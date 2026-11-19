import type { z } from 'zod';
import type { StoreApi } from 'zustand';
import type { Cart } from '@/lib/cart/cart';
import { cartKey, planCartSync } from '@/lib/cart/sync';
import { cartItemsRequestSchema, variantIdSchema } from '@/lib/validations/cart';
import { cartStore, type CartState } from '@/stores/cart';

/**
 * Motor que sincroniza el carrito del almacén (`src/stores/cart.ts`) con el de la cuenta en la BD
 * (tabla `cart_products`), a través de la API `/api/carrito`. No toca React: se usa desde
 * `CartHydrator` y los formularios de sesión, y se puede probar sin DOM inyectando `fetchFn`.
 *
 * - **Al cargar o iniciar sesión** (`sync`): pregunta al servidor quién es el usuario. Sin sesión,
 *   el carrito sigue siendo local; si era de una cuenta cuya sesión ha caducado (`owner`), se
 *   vacía para que no pase a la persona siguiente. Con sesión, `planCartSync` decide: el carrito
 *   anónimo se fusiona una sola vez (`POST /api/carrito/fusionar`) y en los demás casos se adopta
 *   el del servidor. Después manda el servidor: un cambio hecho mientras vuela esa petición se
 *   pierde (aceptado).
 * - **Mientras hay sesión** (`start`): cada cambio del almacén se sube (`PUT /api/carrito`) con
 *   un pequeño retraso que junta los cambios seguidos, con una sola petición en vuelo. Todo PUT
 *   lleva `keepalive`, para que el navegador lo termine aunque se cierre la pestaña. Eso solo
 *   salva peticiones ya enviadas: un cambio de menos de `debounceMs` antes de cerrar se pierde
 *   (aceptado). El cliente no lee la respuesta del PUT: lo que el servidor sanee (quitar lo no
 *   vendible, limitar al stock) se refleja al recargar (`sync`) y en la página del carrito.
 * - **Al cerrar sesión** (`prepareSignOut`) se sube lo pendiente y se vacía el carrito local para
 *   que no pase a la persona siguiente.
 *
 * Solo se sube mientras el dueño del carrito (`owner`) es la cuenta activa: un carrito local que
 * aún no se ha fusionado (dueño `null`) nunca pisa el de la cuenta.
 *
 * Ninguna petición puede colgar el motor: todas tienen un tiempo máximo (`timeoutMs`) y, pasado,
 * cuentan como un error de red.
 */

/** Ruta de la API del carrito de la cuenta (GET para leerlo, PUT para guardarlo). */
const CART_API = '/api/carrito';

/** Ruta que fusiona el carrito anónimo con el guardado en la cuenta. */
const CART_MERGE_API = '/api/carrito/fusionar';

/** Milisegundos que espera `start` tras un cambio antes de subirlo, para juntar los cambios seguidos. */
const DEFAULT_DEBOUNCE_MS = 300;

/** Milisegundos que se espera la respuesta de una petición antes de darla por perdida. */
const DEFAULT_TIMEOUT_MS = 8000;

/** `GET /api/carrito`: la cuenta y su carrito, o `userId: null` (y sin líneas) si no hay sesión. */
const serverCartSchema = cartItemsRequestSchema.extend({ userId: variantIdSchema.nullable() });

/** Del almacén, el motor solo necesita leer el estado y suscribirse. */
type CartStoreLike = Pick<StoreApi<CartState>, 'getState' | 'subscribe'>;

/** `fetch` reducido a lo que usa el motor: una ruta del propio sitio. */
export type CartFetch = (input: string, init?: RequestInit) => Promise<Response>;

/** Opciones de `createCartSync`. Todas son opcionales; solo los tests suelen cambiarlas. */
export interface CartSyncOptions {
    /** Almacén del carrito. Por defecto, `cartStore`. */
    store?: CartStoreLike;
    /** Cómo hacer las peticiones. Por defecto, `globalThis.fetch`. */
    fetchFn?: CartFetch;
    /** Retraso, en milisegundos, para juntar los cambios seguidos en una sola subida. Por defecto, 300. */
    debounceMs?: number;
    /** Tiempo máximo, en milisegundos, de cada petición; pasado, cuenta como error de red. Por defecto, 8000. */
    timeoutMs?: number;
}

/** Lo que devuelve `createCartSync`. Son funciones sueltas (no usan `this`) para pasarlas tal cual a React. */
export interface CartSync {
    /**
     * Pone el almacén al día con la cuenta (ver arriba). Nunca lanza; si ya hay una en curso,
     * devuelve esa misma. Debe llamarse con el carrito ya recuperado de `localStorage`.
     */
    sync: () => Promise<void>;
    /**
     * Si el dueño del carrito (`owner`) ya no coincide con la cuenta que el motor cree activa
     * (inicio o cierre de sesión en otra pestaña, que llega por `storage`), llama a `sync`; si
     * coinciden, no hace nada.
     */
    resyncIfOwnerChanged: () => Promise<void>;
    /** Empieza a subir los cambios mientras haya sesión. Devuelve la función que lo para todo. */
    start: () => () => void;
    /** Sube ya lo pendiente (si hay algo) y espera a que termine. Nunca lanza. */
    flush: () => Promise<void>;
    /** `true` cuando `sync` ya ha terminado al menos una vez (haya habido sesión o no). */
    isSynced: () => boolean;
    /** Avisa cuando cambia `isSynced`: para `useSyncExternalStore`. Devuelve cómo dejar de avisar. */
    subscribe: (listener: () => void) => () => void;
    /** Antes de cerrar sesión: sube lo pendiente, vacía el carrito local y olvida la cuenta. */
    prepareSignOut: () => Promise<void>;
}

/** Cómo ha ido la pregunta por la sesión: con cuenta y carrito, anónimo o sin saberlo. */
type SessionCheck =
    { kind: 'session'; userId: number; items: Cart } | { kind: 'anonymous' } | { kind: 'unknown' };

/** Petición con cuerpo `{ items }` en JSON. Los PUT llevan `keepalive` (ver la cabecera). */
function jsonRequest(method: 'PUT' | 'POST', items: Cart): RequestInit {
    return {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        keepalive: method === 'PUT',
    };
}

/**
 * Crea un motor de sincronización del carrito.
 *
 * @param options - Almacén, `fetch`, retraso y tiempo máximo; ver `CartSyncOptions`.
 * @returns Las funciones del motor; cada llamada crea uno independiente.
 *
 * @example
 * const cartSync = createCartSync();
 * await cartSync.sync(); // tras recuperar el carrito de localStorage
 * const stop = cartSync.start(); // desde ahora, cada cambio se sube
 */
export function createCartSync(options: CartSyncOptions = {}): CartSync {
    const store = options.store ?? cartStore;
    const fetchFn: CartFetch = options.fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    /** Cuenta con sesión según el último `sync`; `null` si es anónimo o no se pudo saber. */
    let activeUserId: number | null = null;
    /** `cartKey` de las líneas que el servidor tiene ahora, hasta donde sabemos. */
    let lastSynced: string | null = null;
    let synced = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    /** Cola de subidas: cada una espera a la anterior, así solo hay una petición en vuelo. */
    let uploads: Promise<void> = Promise.resolve();
    let syncing: Promise<void> | null = null;
    const listeners = new Set<() => void>();

    /**
     * Hace la petición dentro del tiempo máximo (`timeoutMs`). Con `schema`, lee y valida el
     * cuerpo de un 200; sin él, no lo lee. Devuelve `null` si falla la red o se agota el tiempo.
     */
    async function call<T = never>(
        path: string,
        init: RequestInit,
        schema?: z.ZodType<T>,
    ): Promise<{ status: number; body: T | null } | null> {
        try {
            const signal = AbortSignal.timeout(timeoutMs);
            const response = await fetchFn(path, { ...init, signal });
            if (!schema || response.status !== 200) return { status: response.status, body: null };
            const parsed = schema.safeParse(await response.json());
            return { status: response.status, body: parsed.success ? parsed.data : null };
        } catch {
            return null;
        }
    }

    function notify() {
        Array.from(listeners).forEach((listener) => listener());
    }

    function cancelTimer() {
        if (timer !== null) clearTimeout(timer);
        timer = null;
    }

    /** Cambia la cuenta activa; si cambia de verdad, cancela la subida programada (era para la anterior). */
    function setActiveUser(userId: number | null) {
        if (activeUserId === userId) return;
        activeUserId = userId;
        cancelTimer();
    }

    /**
     * La cuenta a la que hay cambios que subir, o `null` si no hay nada que subir: sin sesión, con
     * un carrito que no es de la cuenta activa (todavía sin fusionar, o de otra persona) o con las
     * líneas que el servidor ya tiene.
     */
    function pendingUser(): number | null {
        const { owner, items } = store.getState();
        if (activeUserId === null || owner !== activeUserId) return null;
        return cartKey(items) === lastSynced ? null : activeUserId;
    }

    /**
     * Se queda con el carrito del servidor. Apunta antes lo que el servidor tiene (`lastSynced`)
     * para que el aviso del almacén no provoque una subida de eco.
     */
    function adoptServerCart(userId: number, items: Cart) {
        lastSynced = cartKey(items);
        store.getState().adopt(userId, items);
    }

    /**
     * Sube el carrito si hay algo pendiente. Nunca lanza. Un 200 da por guardado lo enviado; un
     * 401 deja la cuenta como anónima (no se vacía aquí: la siguiente `sync` lo hará); cualquier
     * otra cosa lo deja pendiente hasta el siguiente cambio.
     */
    async function uploadPending(): Promise<void> {
        const userId = pendingUser();
        if (userId === null) return;
        const { items } = store.getState();
        const sentKey = cartKey(items);

        const reply = await call(CART_API, jsonRequest('PUT', items));
        if (reply === null || activeUserId !== userId) return;
        if (reply.status === 401) setActiveUser(null);
        if (reply.status !== 200) return;

        lastSynced = sentKey;
        // Si lo local cambió mientras volaba el PUT (y puede haber vuelto a un valor que ya
        // coincidía con el `lastSynced` anterior, cancelando la subida), hay que subirlo otra vez.
        if (pendingUser() !== null) scheduleUpload();
    }

    /** Pone una subida en la cola: se hace cuando acaben las anteriores, y solo si aún hay algo pendiente. */
    function enqueueUpload(): Promise<void> {
        uploads = uploads.then(uploadPending).catch(() => undefined);
        return uploads;
    }

    /** Programa la subida tras `debounceMs`; un cambio nuevo reinicia la espera. */
    function scheduleUpload() {
        cancelTimer();
        timer = setTimeout(() => {
            timer = null;
            void enqueueUpload();
        }, debounceMs);
    }

    /** Cada cambio del almacén: si hay algo que subir, programa la subida; si no, la cancela. */
    function onStoreChange() {
        if (pendingUser() !== null) scheduleUpload();
        else cancelTimer();
    }

    /** Pregunta al servidor por la sesión y su carrito. Sin saber (red, tiempo, 5xx, cuerpo no válido): `unknown`. */
    async function checkSession(): Promise<SessionCheck> {
        const reply = await call(CART_API, {}, serverCartSchema);
        // Sin sesión el servidor responde 200 con `userId: null`; el 401 se mantiene por si lo devuelve un intermediario.
        if (reply?.status === 401) return { kind: 'anonymous' };
        if (reply?.body) {
            const { userId, items } = reply.body;
            return userId === null ? { kind: 'anonymous' } : { kind: 'session', userId, items };
        }
        return { kind: 'unknown' };
    }

    /**
     * Sin sesión. Si el carrito local era de una cuenta (`owner`), esa sesión ha caducado sin
     * cerrarla: se vacía, para que ni la persona anónima siguiente lo vea ni lo que añada herede
     * ese dueño. Se olvida la cuenta antes de vaciar, así que no provoca ninguna subida.
     */
    function forgetSession() {
        setActiveUser(null);
        lastSynced = null;
        if (store.getState().owner !== null) store.getState().clear();
    }

    /**
     * Manda el carrito anónimo al servidor para fusionarlo con el de la cuenta y adopta el
     * resultado. Si falla, no toca nada: lo local sigue sin dueño y `sync` lo reintentará.
     */
    async function mergeLocalCart(userId: number, items: Cart) {
        const reply = await call(
            CART_MERGE_API,
            jsonRequest('POST', items),
            cartItemsRequestSchema,
        );
        if (reply === null || activeUserId !== userId) return;
        if (reply.status === 401) setActiveUser(null);
        else if (reply.body !== null) adoptServerCart(userId, reply.body.items);
    }

    async function syncOnce() {
        const session = await checkSession();
        if (session.kind === 'unknown') {
            setActiveUser(null);
            return;
        }
        if (session.kind === 'anonymous') {
            forgetSession();
            return;
        }

        const { userId, items: serverItems } = session;
        setActiveUser(userId);
        const { owner, items } = store.getState();
        const plan = planCartSync({ localOwner: owner, userId, localItems: items });
        if (plan === 'merge') await mergeLocalCart(userId, items);
        else adoptServerCart(userId, serverItems);
    }

    async function runSync(): Promise<void> {
        try {
            await syncOnce();
        } catch {
            setActiveUser(null);
        } finally {
            // Si ya no hay nada que subir (otra cuenta, sin sesión, o lo adoptado es igual), fuera la subida programada.
            if (pendingUser() === null) cancelTimer();
            synced = true;
            notify();
        }
    }

    function sync(): Promise<void> {
        syncing ??= runSync().finally(() => {
            syncing = null;
        });
        return syncing;
    }

    function start(): () => void {
        const unsubscribe = store.subscribe(onStoreChange);
        return () => {
            unsubscribe();
            cancelTimer();
        };
    }

    async function flush(): Promise<void> {
        cancelTimer();
        await enqueueUpload();
    }

    function resyncIfOwnerChanged(): Promise<void> {
        return store.getState().owner !== activeUserId ? sync() : Promise.resolve();
    }

    async function prepareSignOut(): Promise<void> {
        await flush();
        setActiveUser(null);
        lastSynced = null;
        cancelTimer();
        store.getState().clear();
    }

    function subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }

    return {
        sync,
        resyncIfOwnerChanged,
        start,
        flush,
        isSynced: () => synced,
        subscribe,
        prepareSignOut,
    };
}

/** El motor de la tienda: uno solo para toda la aplicación, sobre `cartStore`. */
export const cartSync = createCartSync();

/**
 * Pone el carrito al día con la cuenta (ver `CartSync.sync`). Llamar tras recuperar el carrito de
 * `localStorage` y después de iniciar sesión.
 */
export const syncCart = () => cartSync.sync();

/** Empieza a subir los cambios del carrito mientras haya sesión; devuelve cómo pararlo. */
export const startCartPush = () => cartSync.start();

/**
 * Vuelve a sincronizar si el dueño del carrito ya no coincide con la cuenta activa del motor.
 * Llamar tras recuperar el carrito de `localStorage` porque otra pestaña lo cambió (`storage`).
 */
export const resyncCartIfOwnerChanged = () => cartSync.resyncIfOwnerChanged();

/** Llamar justo antes de cerrar sesión: sube lo pendiente y vacía el carrito local. */
export const prepareCartSignOut = () => cartSync.prepareSignOut();
