import type { StateStorage } from 'zustand/middleware';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mergeCarts, type Cart } from '@/lib/cart/cart';
import { createCartSync, type CartFetch } from './cart-sync';
import { createCartStore } from './cart';

/** `localStorage` en memoria: Vitest corre en Node, que no lo tiene. */
function memoryStorage(): StateStorage {
    const data: Record<string, string> = {};
    return {
        getItem: (name) => data[name] ?? null,
        setItem: (name, value) => {
            data[name] = value;
        },
        removeItem: (name) => {
            delete data[name];
        },
    };
}

const item = (variantId: number, quantity: number) => ({ variantId, quantity });

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

/** Una petición que ha llegado al servidor simulado. */
interface RecordedRequest {
    method: string;
    path: string;
    items?: Cart;
    keepalive?: boolean;
}

/**
 * Servidor de `/api/carrito` simulado. `state.session` es la cuenta con sesión (`null`: anónimo),
 * `state.saved` el carrito guardado y `state.sanitize` lo que el servidor le hace a lo que recibe
 * en un PUT. Un test puede cambiar la respuesta de una sola llamada con `override`.
 */
function createFakeServer(session: number | null, saved: Cart) {
    const state = { session, saved, sanitize: (items: Cart): Cart => items };
    const requests: RecordedRequest[] = [];
    const overrides: { method: string; respond: (init?: RequestInit) => Promise<Response> }[] = [];
    const holds: { method: string; gate: Promise<void> }[] = [];
    const fetchFn = vi.fn<CartFetch>(async (path, init) => {
        const method = init?.method ?? 'GET';
        const items =
            typeof init?.body === 'string'
                ? (JSON.parse(init.body) as { items: Cart }).items
                : undefined;
        requests.push({ method, path, items, keepalive: init?.keepalive });

        const override = overrides.findIndex((candidate) => candidate.method === method);
        if (override >= 0) return overrides.splice(override, 1)[0].respond(init);
        if (state.session === null) return json(401, { message: 'No has iniciado sesión' });

        let response: Response;
        if (method === 'GET') {
            response = json(200, { userId: state.session, items: state.saved });
        } else {
            if (method === 'POST') {
                const ids = [...state.saved, ...(items ?? [])].map((line) => line.variantId);
                state.saved = mergeCarts(
                    state.saved,
                    items ?? [],
                    new Map(ids.map((id) => [id, 99])),
                );
            } else {
                state.saved = state.sanitize(items ?? []);
            }
            response = json(200, { items: state.saved });
        }

        const hold = holds.findIndex((candidate) => candidate.method === method);
        if (hold >= 0) await holds.splice(hold, 1)[0].gate;
        return response;
    });
    return {
        state,
        requests,
        fetchFn,
        /** La próxima petición con ese método (ya registrada en `requests`) recibe esta respuesta. */
        override: (method: string, respond: (init?: RequestInit) => Promise<Response>) => {
            overrides.push({ method, respond });
        },
        /**
         * La próxima petición con ese método se procesa en el servidor, pero la respuesta no sale
         * hasta llamar a la función que devuelve: la petición queda "en vuelo".
         */
        hold: (method: string) => {
            const gate = deferred<void>();
            holds.push({ method, gate: gate.promise });
            return () => gate.resolve();
        },
        puts: () => requests.filter((request) => request.method === 'PUT'),
        posts: () => requests.filter((request) => request.method === 'POST'),
    };
}

/** Sustituye `onHide`: guarda la función que el motor registra y permite "ocultar la pestaña". */
function createHideRegistrar() {
    let callback: (() => void) | null = null;
    return {
        register: (onHide: () => void) => {
            callback = onHide;
            return () => {
                callback = null;
            };
        },
        fire: () => callback?.(),
        isRegistered: () => callback !== null,
    };
}

/** Respuesta de un servidor que no contesta: solo termina (con error) cuando se aborta la petición. */
const hangUntilAborted = (init?: RequestInit) =>
    new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
        );
    });

/** Una promesa que se resuelve a mano: para dejar una petición "en vuelo". */
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

interface SetupOptions {
    /** Cuenta con sesión en el servidor; `null` si es anónimo. */
    session?: number | null;
    /** Carrito guardado en el servidor. */
    saved?: Cart;
    /** Carrito local. */
    local?: Cart;
    /** Dueño del carrito local. */
    owner?: number | null;
    /** Tiempo máximo de cada petición; por defecto, el del motor. */
    timeoutMs?: number;
}

/** Almacén, servidor simulado y motor, con el carrito local ya preparado. */
function setup({
    session = 5,
    saved = [],
    local = [],
    owner = null,
    timeoutMs,
}: SetupOptions = {}) {
    const store = createCartStore(memoryStorage());
    if (owner !== null) store.getState().adopt(owner, local);
    else local.forEach((line) => store.getState().add(line.variantId, line.quantity, 99));

    const server = createFakeServer(session, saved);
    const hide = createHideRegistrar();
    const cartSync = createCartSync({
        store,
        fetchFn: server.fetchFn,
        debounceMs: 300,
        timeoutMs,
        onHide: hide.register,
    });
    return { store, server, hide, cartSync };
}

/** Como `setup`, pero ya sincronizado (con sesión) y empezado a subir; sin peticiones registradas. */
async function setupLoggedIn(options: SetupOptions = {}) {
    const context = setup(options);
    await context.cartSync.sync();
    const stop = context.cartSync.start();
    context.server.requests.length = 0;
    context.server.fetchFn.mockClear();
    return { ...context, stop };
}

/** Deja pasar el tiempo (y los microtareas de las peticiones) con los temporizadores simulados. */
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);

describe('createCartSync', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    describe('sync', () => {
        it('sin sesión (401) deja el carrito local como está y no sube nada', async () => {
            const { store, server, cartSync } = setup({ session: null, local: [item(4, 2)] });
            const before = store.getState().items;

            await cartSync.sync();
            cartSync.start();
            store.getState().add(7, 1, 10);
            await wait(1000);

            expect(server.requests).toEqual([expect.objectContaining({ method: 'GET' })]);
            expect(store.getState().items).toEqual([...before, item(7, 1)]);
            expect(store.getState().owner).toBeNull();
        });

        it('sin sesión (401) con un carrito de una cuenta (sesión caducada) lo vacía y lo deja anónimo', async () => {
            const { store, server, cartSync } = setup({
                session: null,
                local: [item(4, 2)],
                owner: 9,
            });
            cartSync.start();

            await cartSync.sync();

            expect(store.getState().items).toEqual([]);
            expect(store.getState().owner).toBeNull();
            expect(vi.getTimerCount()).toBe(0);

            // Lo que añade la persona anónima siguiente no hereda dueño ni se sube.
            store.getState().add(7, 1, 10);
            await wait(1000);
            expect(store.getState().owner).toBeNull();
            expect(server.puts()).toHaveLength(0);
        });

        describe('sin sesión con 200 y userId null', () => {
            const anonymousReply = async () => json(200, { userId: null, items: [] });

            it('con un carrito sin dueño no toca nada, no sube nada y marca synced', async () => {
                const { store, server, cartSync } = setup({ local: [item(4, 2)] });
                server.override('GET', anonymousReply);

                await cartSync.sync();
                cartSync.start();
                store.getState().add(7, 1, 10);
                await wait(1000);

                expect(cartSync.isSynced()).toBe(true);
                expect(store.getState().items).toEqual([item(4, 2), item(7, 1)]);
                expect(store.getState().owner).toBeNull();
                expect(server.posts()).toHaveLength(0);
                expect(server.puts()).toHaveLength(0);
            });

            it('con un carrito de una cuenta (sesión caducada) lo vacía y no provoca ningún PUT', async () => {
                const { store, server, cartSync } = setup({ local: [item(4, 2)], owner: 9 });
                cartSync.start();
                server.override('GET', anonymousReply);

                await cartSync.sync();

                expect(cartSync.isSynced()).toBe(true);
                expect(store.getState().items).toEqual([]);
                expect(store.getState().owner).toBeNull();
                expect(vi.getTimerCount()).toBe(0);

                store.getState().add(7, 1, 10);
                await wait(1000);
                expect(store.getState().owner).toBeNull();
                expect(server.puts()).toHaveLength(0);
            });

            it('deja de subir si antes había sesión', async () => {
                const { store, server, cartSync } = await setupLoggedIn({ owner: 5 });
                server.override('GET', anonymousReply);

                await cartSync.sync();
                store.getState().add(7, 1, 10);
                await wait(1000);

                expect(server.puts()).toHaveLength(0);
            });
        });

        it.each([
            ['un error de red', () => Promise.reject(new TypeError('Failed to fetch'))],
            ['un 500', async () => json(500, { message: 'Error' })],
            ['un 200 sin cuerpo válido', async () => json(200, { hola: 'mundo' })],
        ])('con %s no vacía el carrito de una cuenta (solo un 401 lo hace)', async (_, respond) => {
            const { store, server, cartSync } = setup({ local: [item(4, 2)], owner: 5 });
            server.override('GET', respond);

            await cartSync.sync();

            expect(store.getState().items).toEqual([item(4, 2)]);
            expect(store.getState().owner).toBe(5);
        });

        it('con un error de red deja lo local como está y no sube nada', async () => {
            const { store, server, cartSync } = setup({ local: [item(4, 2)] });
            server.override('GET', () => Promise.reject(new TypeError('Failed to fetch')));

            await expect(cartSync.sync()).resolves.toBeUndefined();
            cartSync.start();
            store.getState().add(7, 1, 10);
            await wait(1000);

            expect(server.fetchFn).toHaveBeenCalledTimes(1);
            expect(store.getState().items).toEqual([item(4, 2), item(7, 1)]);
            expect(store.getState().owner).toBeNull();
        });

        it('si fetch lanza de forma síncrona, tampoco lanza', async () => {
            const { server, cartSync } = setup();
            server.fetchFn.mockImplementationOnce(() => {
                throw new Error('boom');
            });
            await expect(cartSync.sync()).resolves.toBeUndefined();
            expect(cartSync.isSynced()).toBe(true);
        });

        it.each([
            ['un 500', () => json(500, { message: 'Error' })],
            ['un 404', () => json(404, { message: 'No existe' })],
            ['un 200 sin cuerpo válido', () => json(200, { hola: 'mundo' })],
            ['un 200 que no es JSON', () => new Response('<html>', { status: 200 })],
            [
                'un 200 con presentaciones repetidas',
                () => json(200, { userId: 5, items: [item(4, 1), item(4, 2)] }),
            ],
        ])('con %s deja lo local como está y no sube nada', async (_, response) => {
            const { store, server, cartSync } = setup({ local: [item(4, 2)] });
            server.override('GET', async () => response());

            await cartSync.sync();
            cartSync.start();
            store.getState().add(7, 1, 10);
            await wait(1000);

            expect(server.fetchFn).toHaveBeenCalledTimes(1);
            expect(store.getState().items).toEqual([item(4, 2), item(7, 1)]);
            expect(store.getState().owner).toBeNull();
        });

        it('local vacío y sin dueño: manda el servidor', async () => {
            const { store, server, cartSync } = setup({ saved: [item(4, 2), item(9, 1)] });

            await cartSync.sync();

            expect(store.getState().items).toEqual([item(4, 2), item(9, 1)]);
            expect(store.getState().owner).toBe(5);
            expect(server.posts()).toHaveLength(0);
        });

        it('el carrito ya era de esta cuenta: manda el servidor, sin fusionar', async () => {
            const { store, server, cartSync } = setup({
                saved: [item(4, 2)],
                local: [item(1, 1), item(4, 9)],
                owner: 5,
            });

            await cartSync.sync();

            expect(store.getState().items).toEqual([item(4, 2)]);
            expect(store.getState().owner).toBe(5);
            expect(server.posts()).toHaveLength(0);
        });

        it('el carrito local es de otra cuenta: se descarta, no se fusiona', async () => {
            const { store, server, cartSync } = setup({
                saved: [item(4, 2)],
                local: [item(1, 1), item(9, 3)],
                owner: 9,
            });

            await cartSync.sync();

            expect(store.getState().items).toEqual([item(4, 2)]);
            expect(store.getState().owner).toBe(5);
            expect(server.posts()).toHaveLength(0);
            expect(server.state.saved).toEqual([item(4, 2)]);
        });

        it('el carrito local es de otra cuenta y el servidor lo tiene vacío: queda vacío', async () => {
            const { store, cartSync } = setup({ local: [item(1, 1)], owner: 9 });

            await cartSync.sync();

            expect(store.getState().items).toEqual([]);
            expect(store.getState().owner).toBe(5);
        });

        it('carrito anónimo con líneas: lo fusiona una vez con el de la cuenta y adopta el resultado', async () => {
            const { store, server, cartSync } = setup({
                saved: [item(4, 2), item(9, 1)],
                local: [item(4, 1), item(7, 3)],
            });

            await cartSync.sync();

            expect(server.posts()).toEqual([
                expect.objectContaining({
                    path: '/api/carrito/fusionar',
                    items: [item(4, 1), item(7, 3)],
                }),
            ]);
            expect(store.getState().items).toEqual([item(4, 2), item(9, 1), item(7, 3)]);
            expect(store.getState().items).toEqual(server.state.saved);
            expect(store.getState().owner).toBe(5);
        });

        it('después de fusionar, otra sync no vuelve a fusionar: manda el servidor', async () => {
            const { store, server, cartSync } = setup({
                saved: [item(4, 2)],
                local: [item(7, 3)],
            });
            await cartSync.sync();
            server.state.saved = [item(4, 2)]; // otro dispositivo borró la línea 7

            await cartSync.sync();

            expect(server.posts()).toHaveLength(1);
            expect(store.getState().items).toEqual([item(4, 2)]);
        });

        it('si la fusión falla, deja lo local sin dueño, no sube nada y la siguiente sync lo reintenta', async () => {
            const { store, server, cartSync } = setup({
                saved: [item(4, 2)],
                local: [item(7, 3)],
            });
            cartSync.start();

            server.override('POST', () => Promise.reject(new TypeError('Failed to fetch')));
            await cartSync.sync();

            expect(store.getState().items).toEqual([item(7, 3)]);
            expect(store.getState().owner).toBeNull();
            expect(cartSync.isSynced()).toBe(true);

            // Con la cuenta ya conocida pero sin fusionar, los cambios locales no pisan el servidor.
            store.getState().add(8, 1, 10);
            await wait(1000);
            expect(server.puts()).toHaveLength(0);

            await cartSync.sync();
            expect(server.posts()).toHaveLength(2); // la que falló y el reintento
            expect(server.posts()[1].items).toEqual([item(7, 3), item(8, 1)]);
            expect(store.getState().owner).toBe(5);
            expect(store.getState().items).toEqual([item(4, 2), item(7, 3), item(8, 1)]);
        });

        it('si la fusión responde con un error del servidor, deja lo local como está', async () => {
            const { store, server, cartSync } = setup({ local: [item(7, 3)], saved: [item(4, 2)] });
            server.override('POST', async () => json(500, { message: 'Error' }));

            await cartSync.sync();

            expect(store.getState().items).toEqual([item(7, 3)]);
            expect(store.getState().owner).toBeNull();
        });

        it('si la sesión caduca durante la fusión (401), no adopta nada ni sube', async () => {
            const { store, server, cartSync } = setup({ local: [item(7, 3)], saved: [item(4, 2)] });
            cartSync.start();
            server.override('POST', async () => json(401, { message: 'Caducada' }));

            await cartSync.sync();
            store.getState().add(8, 1, 10);
            await wait(1000);

            expect(store.getState().items).toEqual([item(7, 3), item(8, 1)]);
            expect(store.getState().owner).toBeNull();
            expect(server.puts()).toHaveLength(0);
        });

        it('dos sync a la vez comparten la misma petición', async () => {
            const { server, cartSync } = setup({ saved: [item(4, 2)] });

            const first = cartSync.sync();
            const second = cartSync.sync();
            await Promise.all([first, second]);

            expect(server.requests).toHaveLength(1);
            expect(first).toBe(second);

            await cartSync.sync();
            expect(server.requests).toHaveLength(2);
        });
    });

    describe('isSynced y subscribe', () => {
        it('empieza en false y pasa a true al terminar sync, avisando una vez', async () => {
            const { cartSync } = setup();
            const listener = vi.fn();
            cartSync.subscribe(listener);
            expect(cartSync.isSynced()).toBe(false);

            await cartSync.sync();

            expect(cartSync.isSynced()).toBe(true);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('pasa a true también sin sesión o con la red caída', async () => {
            const anonymous = setup({ session: null });
            await anonymous.cartSync.sync();
            expect(anonymous.cartSync.isSynced()).toBe(true);

            const offline = setup();
            offline.server.override('GET', () => Promise.reject(new TypeError('Failed to fetch')));
            await offline.cartSync.sync();
            expect(offline.cartSync.isSynced()).toBe(true);
        });

        it('no avisa antes de que acabe la petición, ni después de darse de baja', async () => {
            const { server, cartSync } = setup();
            const pending = deferred<Response>();
            server.override('GET', () => pending.promise);
            const listener = vi.fn();
            const unsubscribe = cartSync.subscribe(listener);

            const running = cartSync.sync();
            expect(listener).not.toHaveBeenCalled();
            expect(cartSync.isSynced()).toBe(false);

            unsubscribe();
            pending.resolve(json(401, { message: 'No' }));
            await running;

            expect(listener).not.toHaveBeenCalled();
            expect(cartSync.isSynced()).toBe(true);
        });
    });

    describe('subida de cambios (start)', () => {
        it('sube con retraso y junta los cambios seguidos en una sola petición', async () => {
            const { store, server } = await setupLoggedIn();

            store.getState().add(4, 1, 10);
            await wait(299);
            expect(server.puts()).toHaveLength(0);

            store.getState().add(4, 1, 10); // reinicia la espera
            await wait(299);
            expect(server.puts()).toHaveLength(0);

            store.getState().add(7, 1, 10);
            await wait(300);

            expect(server.puts()).toHaveLength(1);
            expect(server.puts()[0]).toEqual(
                expect.objectContaining({
                    path: '/api/carrito',
                    items: [item(4, 2), item(7, 1)],
                }),
            );
            expect(server.puts()[0].keepalive).toBeUndefined();
            expect(server.state.saved).toEqual([item(4, 2), item(7, 1)]);
        });

        it('después de subir, sin más cambios no manda nada', async () => {
            const { store, server } = await setupLoggedIn();
            store.getState().add(4, 1, 10);
            await wait(300);
            expect(server.puts()).toHaveLength(1);

            await wait(5000);
            expect(server.puts()).toHaveLength(1);
            expect(store.getState().owner).toBe(5);
        });

        it('no hay subida de eco tras adoptar el carrito del servidor', async () => {
            const { store, server, cartSync } = setup({ saved: [item(4, 2)] });
            cartSync.start();

            await cartSync.sync();
            expect(vi.getTimerCount()).toBe(0); // ni siquiera se programa una subida
            await wait(1000);

            expect(store.getState().items).toEqual([item(4, 2)]);
            expect(server.puts()).toHaveLength(0);
        });

        it('no hay subida de eco tras fusionar', async () => {
            const { store, server, cartSync } = setup({
                saved: [item(4, 2)],
                local: [item(7, 3)],
            });
            cartSync.start();

            await cartSync.sync();
            await wait(1000);

            expect(store.getState().items).toEqual([item(4, 2), item(7, 3)]);
            expect(server.puts()).toHaveLength(0);
        });

        it('una sync que deja el carrito igual que el servidor cancela la subida programada', async () => {
            const { store, server, cartSync } = await setupLoggedIn({ owner: 5 });
            store.getState().add(4, 1, 10);
            expect(vi.getTimerCount()).toBe(1); // subida programada
            server.state.saved = [item(4, 1)]; // otro dispositivo ya guardó lo mismo

            await cartSync.sync();
            // `adopt` no escribe si nada cambia: es `sync` quien tiene que cancelarla.
            expect(vi.getTimerCount()).toBe(0);
            await wait(1000);

            expect(server.puts()).toHaveLength(0);
        });

        it('una sync que cambia de cuenta cancela la subida programada', async () => {
            const { store, server, cartSync } = await setupLoggedIn({ owner: 5 });
            store.getState().add(4, 1, 10);
            expect(vi.getTimerCount()).toBe(1);
            server.state.session = 8; // la sesión ahora es de otra cuenta

            await cartSync.sync();
            expect(vi.getTimerCount()).toBe(0);
            await wait(1000);

            expect(server.puts()).toHaveLength(0);
            expect(store.getState().owner).toBe(8);
        });

        it('si añade y quita la misma línea mientras vuela el PUT, el servidor acaba sin ella', async () => {
            const { store, server } = await setupLoggedIn();
            const release = server.hold('PUT');

            store.getState().add(4, 1, 10);
            await wait(300); // sale el PUT con [4], que se queda en vuelo
            expect(server.puts()).toHaveLength(1);
            store.getState().remove(4); // lo local vuelve a ser igual a lo que el servidor sabía antes
            release();
            await wait(0);
            expect(server.state.saved).toEqual([item(4, 1)]);

            await wait(300);

            expect(server.puts()).toHaveLength(2);
            expect(server.puts()[1].items).toEqual([]);
            expect(server.state.saved).toEqual([]);
        });

        it('adopta lo que el servidor sanea si lo local no ha cambiado, sin subir de nuevo', async () => {
            const { store, server } = await setupLoggedIn();
            server.state.sanitize = (items) =>
                items.map((line) => item(line.variantId, Math.min(line.quantity, 3)));

            store.getState().add(4, 5, 10);
            await wait(300);

            expect(server.puts()).toHaveLength(1);
            expect(server.puts()[0].items).toEqual([item(4, 5)]);
            expect(store.getState().items).toEqual([item(4, 3)]);
            expect(store.getState().owner).toBe(5);

            await wait(5000);
            expect(server.puts()).toHaveLength(1);
        });

        it('adopta el saneado de lo que el servidor quita (no vendible)', async () => {
            const { store, server } = await setupLoggedIn();
            server.state.sanitize = (items) => items.filter((line) => line.variantId !== 9);

            store.getState().add(4, 1, 10);
            store.getState().add(9, 1, 10);
            await wait(300);

            expect(store.getState().items).toEqual([item(4, 1)]);
            await wait(5000);
            expect(server.puts()).toHaveLength(1);
        });

        it('si lo local cambió mientras la petición volaba, no adopta el saneado y manda lo último', async () => {
            const { store, server } = await setupLoggedIn();
            const pending = deferred<Response>();
            server.override('PUT', () => pending.promise);

            store.getState().add(4, 5, 10);
            await wait(300); // sale el PUT 1, que se queda en vuelo
            store.getState().add(7, 1, 10);
            pending.resolve(json(200, { items: [item(4, 3)] })); // el servidor sanea lo enviado
            await wait(0);

            expect(store.getState().items).toEqual([item(4, 5), item(7, 1)]);

            await wait(300);
            expect(server.puts()).toHaveLength(2);
            expect(server.puts()[1].items).toEqual([item(4, 5), item(7, 1)]);
        });

        it('solo hay una petición en vuelo: lo que cambia mientras tanto se manda después', async () => {
            const { store, server } = await setupLoggedIn();
            const pending = deferred<Response>();
            server.override('PUT', () => pending.promise);

            store.getState().add(4, 1, 10);
            await wait(300);
            expect(server.puts()).toHaveLength(1);

            store.getState().add(7, 1, 10);
            await wait(1000); // el temporizador vence, pero la primera sigue sin responder
            expect(server.puts()).toHaveLength(1);

            pending.resolve(json(200, { items: [item(4, 1)] }));
            await wait(0);

            expect(server.puts()).toHaveLength(2);
            expect(server.puts()[1].items).toEqual([item(4, 1), item(7, 1)]);
            expect(store.getState().items).toEqual([item(4, 1), item(7, 1)]);
        });

        it('no sube si el carrito no es de la cuenta activa (otro dueño)', async () => {
            const { store, server } = await setupLoggedIn();
            store.getState().adopt(9, [item(4, 1)]); // llega un carrito de otra cuenta (otra pestaña)
            await wait(1000);
            store.getState().add(7, 1, 10);
            await wait(1000);

            expect(server.puts()).toHaveLength(0);
        });

        it('un 401 al subir deja de subir: la cuenta pasa a anónima', async () => {
            const { store, server, cartSync } = await setupLoggedIn();
            server.state.session = null;

            store.getState().add(4, 1, 10);
            await wait(300);
            expect(server.puts()).toHaveLength(1);

            store.getState().add(7, 1, 10);
            await wait(1000);
            expect(server.puts()).toHaveLength(1);
            // No se vacía aquí: la siguiente carga (sync) lo hará.
            expect(store.getState().items).toEqual([item(4, 1), item(7, 1)]);
            expect(store.getState().owner).toBe(5);

            await cartSync.sync();
            expect(store.getState().items).toEqual([]);
            expect(store.getState().owner).toBeNull();
            await wait(1000);
            expect(server.puts()).toHaveLength(1);
        });

        it.each([
            ['un 500', () => json(500, { message: 'Error' })],
            ['un 200 sin cuerpo válido', () => json(200, { nada: true })],
        ])('con %s se queda pendiente hasta el siguiente cambio', async (_, response) => {
            const { store, server } = await setupLoggedIn();
            server.override('PUT', async () => response());

            store.getState().add(4, 1, 10);
            await wait(300);
            await wait(10_000); // sin reintentos por su cuenta
            expect(server.puts()).toHaveLength(1);

            store.getState().add(7, 1, 10);
            await wait(300);

            expect(server.puts()).toHaveLength(2);
            expect(server.puts()[1].items).toEqual([item(4, 1), item(7, 1)]);
            expect(server.state.saved).toEqual([item(4, 1), item(7, 1)]);
        });

        it('con un error de red se queda pendiente y flush lo reintenta', async () => {
            const { store, server, cartSync } = await setupLoggedIn();
            server.override('PUT', () => Promise.reject(new TypeError('Failed to fetch')));

            store.getState().add(4, 1, 10);
            await wait(300);
            expect(server.state.saved).toEqual([]);

            await cartSync.flush();
            expect(server.state.saved).toEqual([item(4, 1)]);
        });

        it('la función que devuelve start lo para todo: suscripción, temporizador y ocultar', async () => {
            const { store, server, hide, stop } = await setupLoggedIn();
            expect(hide.isRegistered()).toBe(true);

            store.getState().add(4, 1, 10); // queda un temporizador pendiente
            stop();
            expect(hide.isRegistered()).toBe(false);

            await wait(1000);
            store.getState().add(7, 1, 10);
            await wait(1000);

            expect(server.puts()).toHaveLength(0);
        });
    });

    describe('flush', () => {
        it('sube ya lo pendiente, espera a que termine y no vuelve a subirlo por el temporizador', async () => {
            const { store, server, cartSync } = await setupLoggedIn();
            store.getState().add(4, 1, 10);
            expect(server.puts()).toHaveLength(0);

            await cartSync.flush();

            expect(server.puts()).toHaveLength(1);
            expect(server.state.saved).toEqual([item(4, 1)]);

            await wait(5000);
            expect(server.puts()).toHaveLength(1);
        });

        it('sin nada pendiente no hace peticiones', async () => {
            const { server, cartSync } = await setupLoggedIn();
            await cartSync.flush();
            expect(server.fetchFn).not.toHaveBeenCalled();
        });

        it('sin sesión no sube nada', async () => {
            const { store, server, cartSync } = setup({ session: null });
            await cartSync.sync();
            cartSync.start();
            server.requests.length = 0;

            store.getState().add(4, 1, 10);
            await cartSync.flush();

            expect(server.requests).toHaveLength(0);
        });

        it('si hay una petición en vuelo, espera a que acabe y luego manda lo último', async () => {
            const { store, server, cartSync } = await setupLoggedIn();
            const pending = deferred<Response>();
            server.override('PUT', () => pending.promise);
            store.getState().add(4, 1, 10);
            await wait(300);
            store.getState().add(7, 1, 10);

            let done = false;
            const flushing = cartSync.flush().then(() => {
                done = true;
            });
            await wait(0);
            expect(done).toBe(false);

            pending.resolve(json(200, { items: [item(4, 1)] }));
            await flushing;

            expect(done).toBe(true);
            expect(server.state.saved).toEqual([item(4, 1), item(7, 1)]);
        });
    });

    describe('ocultar la pestaña', () => {
        it('sube al instante lo pendiente con keepalive', async () => {
            const { store, server, hide } = await setupLoggedIn();
            store.getState().add(4, 1, 10);

            hide.fire();
            await wait(0);

            expect(server.puts()).toHaveLength(1);
            expect(server.puts()[0]).toEqual(
                expect.objectContaining({ items: [item(4, 1)], keepalive: true }),
            );

            await wait(5000); // el temporizador ya no sube otra vez
            expect(server.puts()).toHaveLength(1);
        });

        it('sin nada pendiente no hace peticiones', async () => {
            const { server, hide } = await setupLoggedIn();
            hide.fire();
            await wait(0);
            expect(server.fetchFn).not.toHaveBeenCalled();
        });

        it('sin sesión no sube nada', async () => {
            const { store, server, hide, cartSync } = setup({ session: null });
            await cartSync.sync();
            cartSync.start();
            server.requests.length = 0;

            store.getState().add(4, 1, 10);
            hide.fire();
            await wait(0);

            expect(server.requests).toHaveLength(0);
        });
    });

    describe('prepareSignOut', () => {
        it('sube lo pendiente, vacía el carrito local y no manda nada más', async () => {
            const { store, server, cartSync } = await setupLoggedIn({
                saved: [item(4, 2)],
                owner: 5,
                local: [item(4, 2)],
            });
            store.getState().add(7, 1, 10); // pendiente: aún no ha vencido el temporizador

            await cartSync.prepareSignOut();

            expect(server.puts()).toHaveLength(1);
            expect(server.state.saved).toEqual([item(4, 2), item(7, 1)]); // la cuenta lo conserva
            expect(store.getState().items).toEqual([]);
            expect(store.getState().owner).toBeNull();

            await wait(5000);
            store.getState().add(9, 1, 10); // ya anónimo
            await wait(5000);
            expect(server.puts()).toHaveLength(1);
        });

        it('sin nada pendiente, solo vacía', async () => {
            const { store, server, cartSync } = await setupLoggedIn({
                saved: [item(4, 2)],
            });

            await cartSync.prepareSignOut();

            expect(server.fetchFn).not.toHaveBeenCalled();
            expect(store.getState().items).toEqual([]);
            expect(store.getState().owner).toBeNull();
        });

        it('vacía el carrito aunque la subida falle', async () => {
            const { store, server, cartSync } = await setupLoggedIn();
            server.override('PUT', () => Promise.reject(new TypeError('Failed to fetch')));
            store.getState().add(4, 1, 10);

            await expect(cartSync.prepareSignOut()).resolves.toBeUndefined();

            expect(store.getState().items).toEqual([]);
            expect(store.getState().owner).toBeNull();
        });

        it('al volver a iniciar sesión, con otra cuenta, no hereda lo de la anterior', async () => {
            const { store, server, cartSync } = await setupLoggedIn({
                saved: [item(4, 2)],
            });
            await cartSync.prepareSignOut();
            server.state.session = 8;
            server.state.saved = [item(9, 1)];

            await cartSync.sync();

            expect(store.getState().items).toEqual([item(9, 1)]);
            expect(store.getState().owner).toBe(8);
            expect(server.posts()).toHaveLength(0);
        });
    });
    describe('tiempo máximo de las peticiones', () => {
        it('un GET que no responde se aborta a los 8 segundos y cuenta como error de red', async () => {
            const { store, server, cartSync } = setup({ local: [item(4, 2)], owner: 5 });
            let signal: AbortSignal | undefined;
            server.override('GET', (init) => {
                signal = init?.signal ?? undefined;
                return hangUntilAborted(init);
            });

            const running = cartSync.sync();
            await wait(7999);
            expect(cartSync.isSynced()).toBe(false);
            expect(signal?.aborted).toBe(false);

            await wait(1);
            await running;

            expect(signal?.aborted).toBe(true);
            expect(cartSync.isSynced()).toBe(true);
            expect(store.getState().items).toEqual([item(4, 2)]); // lo local, como estaba
            expect(store.getState().owner).toBe(5);
            expect(vi.getTimerCount()).toBe(0);

            // `activeUserId = null`: no se sube nada hasta la siguiente sync.
            cartSync.start();
            store.getState().add(7, 1, 10);
            await wait(1000);
            expect(server.puts()).toHaveLength(0);
        });

        it('el tiempo máximo se puede cambiar con timeoutMs', async () => {
            const { server, cartSync } = setup({ timeoutMs: 500 });
            server.override('GET', hangUntilAborted);

            const running = cartSync.sync();
            await wait(500);
            await running;

            expect(cartSync.isSynced()).toBe(true);
        });

        it('un POST de fusión que no responde se aborta y lo local queda sin fusionar', async () => {
            const { store, server, cartSync } = setup({ local: [item(7, 3)], saved: [item(4, 2)] });
            server.override('POST', hangUntilAborted);

            const running = cartSync.sync();
            await wait(8000);
            await running;

            expect(cartSync.isSynced()).toBe(true);
            expect(store.getState().items).toEqual([item(7, 3)]);
            expect(store.getState().owner).toBeNull();

            await cartSync.sync(); // la siguiente sync lo reintenta
            expect(store.getState().owner).toBe(5);
            expect(store.getState().items).toEqual([item(4, 2), item(7, 3)]);
        });

        it('un PUT que no responde se aborta, queda pendiente y no bloquea la cola', async () => {
            const { store, server } = await setupLoggedIn();
            let signal: AbortSignal | undefined;
            server.override('PUT', (init) => {
                signal = init?.signal ?? undefined;
                return hangUntilAborted(init);
            });

            store.getState().add(4, 1, 10);
            await wait(300);
            expect(server.puts()).toHaveLength(1);

            store.getState().add(7, 1, 10);
            await wait(7999); // el segundo cambio espera en la cola tras el PUT colgado
            expect(server.puts()).toHaveLength(1);

            await wait(1);

            expect(signal?.aborted).toBe(true);
            expect(server.puts()).toHaveLength(2);
            expect(server.puts()[1].items).toEqual([item(4, 1), item(7, 1)]);
            expect(server.state.saved).toEqual([item(4, 1), item(7, 1)]);
        });

        it('flush y prepareSignOut terminan aunque el PUT no responda', async () => {
            const { store, server, cartSync } = await setupLoggedIn();
            server.override('PUT', hangUntilAborted);
            store.getState().add(4, 1, 10);

            const signingOut = cartSync.prepareSignOut();
            await wait(8000);
            await signingOut;

            expect(store.getState().items).toEqual([]);
            expect(store.getState().owner).toBeNull();
            expect(vi.getTimerCount()).toBe(0);
        });

        it('una subida con keepalive no se aborta, pero tampoco bloquea la cola más del tiempo máximo', async () => {
            const { store, server, hide } = await setupLoggedIn();
            let init: RequestInit | undefined;
            server.override('PUT', (received) => {
                init = received;
                return new Promise<Response>(() => {}); // nunca responde ni respeta la señal
            });

            store.getState().add(4, 1, 10);
            hide.fire();
            await wait(0);
            expect(server.puts()).toHaveLength(1);
            expect(init?.keepalive).toBe(true);
            expect(init?.signal).toBeUndefined();

            store.getState().add(7, 1, 10);
            await wait(7999);
            expect(server.puts()).toHaveLength(1);
            await wait(1);

            expect(server.puts()).toHaveLength(2);
            expect(server.puts()[1].items).toEqual([item(4, 1), item(7, 1)]);
        });

        it('las peticiones normales llevan señal de aborto y no dejan temporizadores al acabar', async () => {
            const { store, server, cartSync } = setup({ saved: [item(4, 2)] });
            await cartSync.sync();
            cartSync.start();
            store.getState().add(7, 1, 10);
            await cartSync.flush();

            expect(
                server.fetchFn.mock.calls.map(([, init]) => init?.signal instanceof AbortSignal),
            ).toEqual([true, true]);
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    describe('resyncIfOwnerChanged', () => {
        it('inicio de sesión en otra pestaña: el dueño pasa de null a una cuenta y hace sync', async () => {
            const { store, server, cartSync } = setup({ session: null });
            await cartSync.sync(); // esta pestaña cargó anónima
            cartSync.start();
            server.requests.length = 0;

            // En la otra pestaña inician sesión; aquí `storage` rehidrata el carrito con su dueño.
            server.state.session = 5;
            server.state.saved = [item(4, 2)];
            store.getState().adopt(5, [item(4, 2)]);
            await cartSync.resyncIfOwnerChanged();

            expect(server.requests).toEqual([expect.objectContaining({ method: 'GET' })]);

            // Ahora esta pestaña ya sabe que hay sesión y sube lo que se añada.
            store.getState().add(7, 1, 10);
            await wait(300);
            expect(server.puts()).toHaveLength(1);
            expect(server.puts()[0].items).toEqual([item(4, 2), item(7, 1)]);
        });

        it('cierre de sesión en otra pestaña: el dueño pasa a null, el GET da 401 y no se sube nada', async () => {
            const { store, server, cartSync } = await setupLoggedIn({
                saved: [item(4, 2)],
                local: [item(4, 2)],
                owner: 5,
            });

            server.state.session = null;
            store.getState().clear(); // lo que la otra pestaña dejó en localStorage
            await cartSync.resyncIfOwnerChanged();

            expect(server.requests).toEqual([expect.objectContaining({ method: 'GET' })]);

            store.getState().add(7, 1, 10);
            await wait(1000);
            expect(server.puts()).toHaveLength(0);
            expect(store.getState().owner).toBeNull();
        });

        it.each([
            ['con sesión y el mismo dueño', 5, 5],
            ['anónimo y sin dueño', null, null],
        ])(
            'si el dueño coincide con la cuenta activa (%s) no hace peticiones',
            async (_, session, owner) => {
                const { server, cartSync } = await setupLoggedIn({ session, owner });

                await cartSync.resyncIfOwnerChanged();

                expect(server.fetchFn).not.toHaveBeenCalled();
            },
        );

        it('varias llamadas seguidas comparten la misma sync', async () => {
            const { store, server, cartSync } = setup({ session: null });
            await cartSync.sync();
            server.requests.length = 0;
            server.state.session = 5;
            store.getState().adopt(5, []);

            await Promise.all([cartSync.resyncIfOwnerChanged(), cartSync.resyncIfOwnerChanged()]);

            expect(server.requests).toHaveLength(1);
        });
    });

    describe('cambios del usuario mientras vuela una sync', () => {
        it('con un carrito de la propia cuenta, lo añadido durante el GET no se pierde: se conserva y se sube', async () => {
            const { store, server, cartSync } = setup({ owner: 5, saved: [item(9, 1)] });
            cartSync.start();
            const release = server.hold('GET');

            const running = cartSync.sync();
            store.getState().add(4, 1, 10); // la ficha no espera a `synced`
            release();
            await running;

            expect(store.getState().items).toEqual([item(4, 1)]);
            expect(store.getState().owner).toBe(5);

            await wait(300); // el último en escribir gana
            expect(server.puts()).toHaveLength(1);
            expect(server.puts()[0].items).toEqual([item(4, 1)]);
            expect(server.state.saved).toEqual([item(4, 1)]);
        });

        it('si lo cambiado durante el GET deja el carrito igual que el del servidor, no sube nada', async () => {
            const { store, server, cartSync } = setup({ owner: 5, saved: [item(4, 1)] });
            cartSync.start();
            const release = server.hold('GET');

            const running = cartSync.sync();
            store.getState().add(4, 1, 10);
            release();
            await running;
            await wait(1000);

            expect(store.getState().items).toEqual([item(4, 1)]);
            expect(server.puts()).toHaveLength(0);
        });

        it('un carrito de otra cuenta se descarta aunque cambie durante el GET', async () => {
            const { store, server, cartSync } = setup({
                owner: 9,
                local: [item(1, 1)],
                saved: [item(4, 2)],
            });
            cartSync.start();
            const release = server.hold('GET');

            const running = cartSync.sync();
            store.getState().add(7, 1, 10);
            release();
            await running;
            await wait(1000);

            expect(store.getState().items).toEqual([item(4, 2)]);
            expect(store.getState().owner).toBe(5);
            expect(server.puts()).toHaveLength(0);
        });

        it('un carrito anónimo vacío que se llena durante el GET se fusiona en vez de descartarse', async () => {
            const { store, server, cartSync } = setup({ saved: [item(9, 1)] });
            const release = server.hold('GET');

            const running = cartSync.sync();
            store.getState().add(4, 1, 10);
            release();
            await running;

            expect(server.posts()).toHaveLength(1);
            expect(server.posts()[0].items).toEqual([item(4, 1)]);
            expect(store.getState().items).toEqual([item(9, 1), item(4, 1)]);
            expect(store.getState().owner).toBe(5);
        });

        it('lo añadido durante el POST de la fusión se vuelve a fusionar antes de adoptar', async () => {
            const { store, server, cartSync } = setup({
                saved: [item(4, 2)],
                local: [item(7, 3)],
            });
            cartSync.start();
            const release = server.hold('POST');

            const running = cartSync.sync();
            await wait(0);
            store.getState().add(8, 1, 10); // mientras el POST vuela
            release();
            await running;

            expect(server.posts()).toHaveLength(2);
            expect(server.posts()[0].items).toEqual([item(7, 3)]);
            expect(server.posts()[1].items).toEqual([item(7, 3), item(8, 1)]);
            expect(store.getState().items).toEqual([item(4, 2), item(7, 3), item(8, 1)]);
            expect(store.getState().owner).toBe(5);

            await wait(1000);
            expect(server.puts()).toHaveLength(0);
        });

        it('si el POST no ve cambios, una sola ronda y todo como siempre', async () => {
            const { store, server, cartSync } = setup({ saved: [item(4, 2)], local: [item(7, 3)] });

            await cartSync.sync();

            expect(server.posts()).toHaveLength(1);
            expect(store.getState().items).toEqual([item(4, 2), item(7, 3)]);
        });

        it('repite la fusión como mucho 3 rondas y adopta el resultado de la última', async () => {
            const { store, server, cartSync } = setup({ saved: [item(4, 2)], local: [item(7, 3)] });
            // Cada POST responde después de que el usuario haya añadido otra línea.
            [10, 11, 12].forEach((variantId) =>
                server.override('POST', async () => {
                    store.getState().add(variantId, 1, 10);
                    return json(200, { items: [item(4, 2)] });
                }),
            );

            await cartSync.sync();

            expect(server.posts()).toHaveLength(3);
            expect(store.getState().items).toEqual([item(4, 2)]);
            expect(store.getState().owner).toBe(5);
        });
    });
});
