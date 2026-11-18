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
 *   el carrito sigue siendo local; si era de una cuenta cuya sesión ha caducado (401 con `owner`),
 *   se vacía para que no pase a la persona siguiente. Con sesión, `planCartSync` decide: el carrito
 *   anónimo se fusiona una sola vez (`POST /api/carrito/fusionar`) y en los demás casos se adopta
 *   el del servidor. Después manda el servidor. Si el usuario toca el carrito mientras la petición
 *   vuela, no se pisa: el último en escribir gana (ver `sync`).
 * - **Mientras hay sesión** (`start`): cada cambio del almacén se sube (`PUT /api/carrito`) con
 *   un pequeño retraso que junta los cambios seguidos, con una sola petición en vuelo. El servidor
 *   sanea el carrito (quita lo no vendible, limita al stock) y, si el resultado difiere de lo
 *   local, se adopta.
 * - **Al ocultar la pestaña** se sube al instante lo pendiente (`keepalive`); **al cerrar sesión**
 *   (`prepareSignOut`), se sube y se vacía el carrito local para que no pase a la siguiente persona.
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

/** Veces como mucho que `sync` repite la fusión porque el carrito cambió mientras la petición volaba. */
const MAX_MERGE_ROUNDS = 3;

/** `GET /api/carrito`: la cuenta y su carrito, o `userId: null` (y sin líneas) si no hay sesión. */
const serverCartSchema = cartItemsRequestSchema.extend({ userId: variantIdSchema.nullable() });

/** Del almacén, el motor solo necesita leer el estado y suscribirse. */
type CartStoreLike = Pick<StoreApi<CartState>, 'getState' | 'subscribe'>;

/** `fetch` reducido a lo que usa el motor: una ruta del propio sitio. */
export type CartFetch = (input: string, init?: RequestInit) => Promise<Response>;

/** Registra una función que debe llamarse al ocultar la pestaña; devuelve cómo desregistrarla. */
export type CartHideRegistrar = (onHide: () => void) => () => void;

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
    /** Cómo enterarse de que se oculta la pestaña. Por defecto, `visibilitychange` y `pagehide`. */
    onHide?: CartHideRegistrar;
}

/** Lo que devuelve `createCartSync`. Son funciones sueltas (no usan `this`) para pasarlas tal cual a React. */
export interface CartSync {
    /**
     * Pone el almacén al día con la cuenta (ver arriba). Nunca lanza; si ya hay una en curso,
     * devuelve esa misma. Debe llamarse con el carrito ya recuperado de `localStorage`.
     *
     * Si el usuario cambia el carrito mientras la petición vuela, no se pierde: con un carrito de
     * la propia cuenta se conserva lo local y se sube (el último en escribir gana, lo del servidor
     * que no esté en lo local se sobrescribe); con la fusión del carrito anónimo se repite con lo
     * local de ahora (hasta `MAX_MERGE_ROUNDS` veces) antes de adoptar el resultado.
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

/**
 * Registro por defecto de `onHide`: llama a `onHide` cuando la pestaña se oculta
 * (`visibilitychange` con `document.hidden`) y cuando se abandona la página (`pagehide`).
 * Donde no hay `document` o `window` (servidor, tests) no registra nada.
 */
function registerPageHide(onHide: () => void): () => void {
    const cleanups: (() => void)[] = [];

    if (typeof document !== 'undefined') {
        const onVisibilityChange = () => {
            if (document.hidden) onHide();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        cleanups.push(() => document.removeEventListener('visibilitychange', onVisibilityChange));
    }
    if (typeof window !== 'undefined') {
        window.addEventListener('pagehide', onHide);
        cleanups.push(() => window.removeEventListener('pagehide', onHide));
    }

    return () => cleanups.forEach((cleanup) => cleanup());
}

/**
 * Petición con cuerpo `{ items }` en JSON. `keepalive` deja que la petición termine aunque la
 * página se cierre: solo se añade cuando hace falta.
 */
function jsonRequest(method: 'PUT' | 'POST', items: Cart, keepalive = false): RequestInit {
    return {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        ...(keepalive ? { keepalive: true } : {}),
    };
}

/** Respuesta ya leída: el estado HTTP y, si era un 200 con el cuerpo esperado, ese cuerpo. */
interface CartReply<T> {
    status: number;
    body: T | null;
}

/** Cómo ha ido la pregunta por la sesión: con cuenta y carrito, anónimo (401) o sin saberlo. */
type SessionCheck =
    { kind: 'session'; userId: number; items: Cart } | { kind: 'anonymous' } | { kind: 'unknown' };

/** Lee el cuerpo de una respuesta y lo valida con `schema`; `null` si no es JSON o no lo cumple. */
async function readBody<T>(response: Response, schema: z.ZodType<T>): Promise<T | null> {
    try {
        const parsed = schema.safeParse(await response.json());
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}

/**
 * Crea un motor de sincronización del carrito.
 *
 * @param options - Almacén, `fetch`, retraso y aviso de ocultar la pestaña; ver `CartSyncOptions`.
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
    const onHide = options.onHide ?? registerPageHide;

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
     * Hace la petición y lee su cuerpo, todo dentro del tiempo máximo (`timeoutMs`). Devuelve
     * `null` si falla la red o se agota el tiempo. Las peticiones normales se cancelan con un
     * `AbortController` (con el `setTimeout` global, no `AbortSignal.timeout`); las de `keepalive`
     * no, para que el navegador pueda terminarlas aunque se cierre la página, pero tampoco se
     * espera por ellas más del tiempo máximo: la cola de subidas no se queda colgada.
     */
    async function call<T>(
        path: string,
        init: RequestInit,
        schema: z.ZodType<T>,
    ): Promise<CartReply<T> | null> {
        const controller = init.keepalive ? null : new AbortController();
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timedOut = new Promise<null>((resolve) => {
            timeoutId = setTimeout(() => {
                controller?.abort();
                resolve(null);
            }, timeoutMs);
        });
        const exchange = async (): Promise<CartReply<T> | null> => {
            try {
                const response = await fetchFn(
                    path,
                    controller ? { ...init, signal: controller.signal } : init,
                );
                const body = response.status === 200 ? await readBody(response, schema) : null;
                return { status: response.status, body };
            } catch {
                return null;
            }
        };

        try {
            return await Promise.race([exchange(), timedOut]);
        } finally {
            clearTimeout(timeoutId);
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
     * Procesa la respuesta de una subida correcta: el servidor tiene ahora `serverItems`. Si lo
     * saneó (difiere de lo enviado) y el carrito local no ha cambiado desde entonces, lo adopta.
     * Si ha cambiado mientras la petición volaba, lo local sigue por delante de lo que el servidor
     * sabe (`lastSynced`): se programa otra subida, porque el aviso del almacén de ese cambio se
     * pudo descartar al coincidir con el `lastSynced` anterior (p. ej. añadir y quitar la misma línea).
     */
    function applyUploaded(userId: number, sentKey: string, serverItems: Cart) {
        const serverKey = cartKey(serverItems);
        lastSynced = serverKey;
        const { owner, items } = store.getState();
        const unchanged = owner === userId && cartKey(items) === sentKey;
        if (unchanged && serverKey !== sentKey) adoptServerCart(userId, serverItems);
        if (pendingUser() !== null) scheduleUpload();
    }

    /** Sube el carrito si hay algo pendiente. Nunca lanza; si falla, lo deja pendiente. */
    async function uploadPending(keepalive: boolean): Promise<void> {
        const userId = pendingUser();
        if (userId === null) return;
        const { items } = store.getState();
        const sentKey = cartKey(items);

        const reply = await call(
            CART_API,
            jsonRequest('PUT', items, keepalive),
            cartItemsRequestSchema,
        );
        if (reply === null) return;
        if (reply.status === 401) {
            // Sesión caducada: no se vacía aquí; la siguiente `sync` lo hará.
            if (activeUserId === userId) setActiveUser(null);
            return;
        }
        if (reply.body !== null && activeUserId === userId) {
            applyUploaded(userId, sentKey, reply.body.items);
        }
    }

    /** Pone una subida en la cola: se hace cuando acaben las anteriores, y solo si aún hay algo pendiente. */
    function enqueueUpload(keepalive: boolean): Promise<void> {
        uploads = uploads.then(() => uploadPending(keepalive)).catch(() => undefined);
        return uploads;
    }

    /** Programa la subida tras `debounceMs`; un cambio nuevo reinicia la espera. */
    function scheduleUpload() {
        cancelTimer();
        timer = setTimeout(() => {
            timer = null;
            void enqueueUpload(false);
        }, debounceMs);
    }

    /** Cada cambio del almacén: si hay algo que subir, programa la subida; si no, la cancela. */
    function onStoreChange() {
        if (pendingUser() !== null) scheduleUpload();
        else cancelTimer();
    }

    /** Al ocultar la pestaña: sube ya lo pendiente, con `keepalive` por si la página se cierra. */
    function onPageHidden() {
        cancelTimer();
        void enqueueUpload(true);
    }

    /** Pregunta al servidor por la sesión y su carrito. Sin sesión: `anonymous`. Sin saber (red, tiempo, 5xx, cuerpo no válido): `unknown`. */
    async function checkSession(): Promise<SessionCheck> {
        const reply = await call(CART_API, {}, serverCartSchema);
        if (reply === null) return { kind: 'unknown' };
        // Sin sesión el servidor responde 200 con `userId: null`; el 401 se mantiene por si lo devuelve un intermediario.
        if (reply.status === 401) return { kind: 'anonymous' };
        if (reply.status === 200 && reply.body !== null) {
            const { userId, items } = reply.body;
            return userId === null ? { kind: 'anonymous' } : { kind: 'session', userId, items };
        }
        return { kind: 'unknown' };
    }

    /**
     * El servidor dice que no hay sesión (200 con `userId: null`, o 401). Si el carrito local era de una cuenta (`owner`), esa
     * sesión ha caducado sin cerrarla: se vacía, para que ni la persona anónima siguiente lo vea ni
     * lo que añada herede ese dueño. Se olvida la cuenta antes de vaciar, así que no provoca ninguna subida.
     */
    function forgetSession() {
        setActiveUser(null);
        lastSynced = null;
        if (store.getState().owner !== null) store.getState().clear();
    }

    /**
     * Manda el carrito anónimo al servidor para fusionarlo con el de la cuenta y adopta el
     * resultado. Si el carrito local cambia mientras la petición vuela, repite la fusión con lo
     * local de ahora (hasta `MAX_MERGE_ROUNDS` rondas; la última adopta el resultado pase lo que
     * pase). Si falla, no toca nada: lo local sigue sin dueño y `sync` lo reintentará.
     */
    async function mergeLocalCart(userId: number) {
        for (let round = 1; round <= MAX_MERGE_ROUNDS; round++) {
            const sent = store.getState().items;
            const sentKey = cartKey(sent);
            const reply = await call(
                CART_MERGE_API,
                jsonRequest('POST', sent),
                cartItemsRequestSchema,
            );
            if (reply === null) return;
            if (reply.status === 401) {
                if (activeUserId === userId) setActiveUser(null);
                return;
            }
            if (reply.body === null || activeUserId !== userId) return;

            const changed = cartKey(store.getState().items) !== sentKey;
            if (!changed || round === MAX_MERGE_ROUNDS) {
                adoptServerCart(userId, reply.body.items);
                return;
            }
        }
    }

    /**
     * El carrito local es de esta cuenta, pero el usuario lo cambió mientras volaba el GET: adoptar
     * el del servidor borraría ese cambio. Se conserva lo local y se sube (el último en escribir gana).
     */
    function keepLocalCart(serverItems: Cart) {
        lastSynced = cartKey(serverItems);
        if (pendingUser() !== null) scheduleUpload();
    }

    async function syncOnce() {
        const keyBefore = cartKey(store.getState().items);
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
        if (plan === 'merge') await mergeLocalCart(userId);
        else if (owner === userId && cartKey(items) !== keyBefore) keepLocalCart(serverItems);
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
        const unregisterHide = onHide(onPageHidden);
        return () => {
            unsubscribe();
            unregisterHide();
            cancelTimer();
        };
    }

    async function flush(): Promise<void> {
        cancelTimer();
        await enqueueUpload(false);
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
