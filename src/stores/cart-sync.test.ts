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
const networkError = () => Promise.reject(new TypeError('Failed to fetch'));

/** Una promesa que se resuelve a mano: para dejar una petición "en vuelo". */
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

/** Respuesta de un servidor que no contesta: solo termina (con error) cuando se aborta la petición. */
const hangUntilAborted = (init?: RequestInit) =>
    new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
        );
    });

/** Una petición que ha llegado al servidor simulado. */
interface RecordedRequest {
    method: string;
    path: string;
    items?: Cart;
    keepalive?: boolean;
}

/**
 * Servidor de `/api/carrito` simulado. `state.session` es la cuenta con sesión (`null`: sin sesión),
 * `state.saved` el carrito guardado y `state.sanitize` lo que el servidor le hace a lo que recibe
 * en un PUT. Un test puede cambiar la respuesta de una sola llamada con `override`, o dejarla en
 * vuelo con `hold`.
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
        if (state.session === null) {
            return method === 'GET'
                ? json(200, { userId: null, items: [] })
                : json(401, { message: 'No has iniciado sesión' });
        }

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
        /** La próxima petición con ese método se procesa, pero la respuesta no sale hasta llamar a lo que devuelve. */
        hold: (method: string) => {
            const gate = deferred<void>();
            holds.push({ method, gate: gate.promise });
            return () => gate.resolve();
        },
        puts: () => requests.filter((request) => request.method === 'PUT'),
        posts: () => requests.filter((request) => request.method === 'POST'),
    };
}

type FakeServer = ReturnType<typeof createFakeServer>;

interface SetupOptions {
    /** Cuenta con sesión en el servidor; `null` si no hay. */
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
    const cartSync = createCartSync({ store, fetchFn: server.fetchFn, debounceMs: 300, timeoutMs });
    return { store, server, cartSync };
}

/** Como `setup`, pero ya sincronizado y empezado a subir; sin peticiones registradas. */
async function setupLoggedIn(options: SetupOptions = {}) {
    const context = setup(options);
    await context.cartSync.sync();
    context.cartSync.start();
    context.server.requests.length = 0;
    context.server.fetchFn.mockClear();
    return context;
}

/** Deja pasar el tiempo (y las microtareas de las peticiones) con los temporizadores simulados. */
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);

describe('createCartSync', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    describe('sync', () => {
        const noSession = [
            ['un 200 con userId null', async () => json(200, { userId: null, items: [] })],
            ['un 401', async () => json(401, { message: 'No has iniciado sesión' })],
        ] as const;

        it.each(noSession)(
            'sin sesión (%s) y con un carrito sin dueño no toca nada ni sube nada',
            async (_, respond) => {
                const { store, server, cartSync } = setup({ local: [item(4, 2)] });
                server.override('GET', respond);

                await cartSync.sync();
                cartSync.start();
                store.getState().add(7, 1, 10);
                await wait(1000);

                expect(cartSync.isSynced()).toBe(true);
                expect(store.getState().items).toEqual([item(4, 2), item(7, 1)]);
                expect(store.getState().owner).toBeNull();
                expect(server.requests).toHaveLength(1);
            },
        );

        it.each(noSession)(
            'sin sesión (%s) y con el carrito de una cuenta (sesión caducada) lo vacía sin subir nada',
            async (_, respond) => {
                const { store, server, cartSync } = setup({ local: [item(4, 2)], owner: 9 });
                cartSync.start();
                server.override('GET', respond);

                await cartSync.sync();

                expect(store.getState().items).toEqual([]);
                expect(store.getState().owner).toBeNull();
                expect(vi.getTimerCount()).toBe(0);

                // Lo que añade la persona anónima siguiente no hereda dueño ni se sube.
                store.getState().add(7, 1, 10);
                await wait(1000);
                expect(store.getState().owner).toBeNull();
                expect(server.puts()).toHaveLength(0);
            },
        );

        it.each([
            ['un error de red', networkError],
            ['un 500', async () => json(500, { message: 'Error' })],
            ['un 404', async () => json(404, { message: 'No existe' })],
            ['un 200 sin cuerpo válido', async () => json(200, { hola: 'mundo' })],
            ['un 200 que no es JSON', async () => new Response('<html>', { status: 200 })],
            [
                'un 200 con presentaciones repetidas',
                async () => json(200, { userId: 5, items: [item(4, 1), item(4, 2)] }),
            ],
        ])(
            'con %s deja el carrito de una cuenta como está (solo "sin sesión" lo vacía) y no sube nada',
            async (_, respond) => {
                const { store, server, cartSync } = setup({ local: [item(4, 2)], owner: 5 });
                server.override('GET', respond);

                await expect(cartSync.sync()).resolves.toBeUndefined();
                cartSync.start();
                store.getState().add(7, 1, 10);
                await wait(1000);

                expect(cartSync.isSynced()).toBe(true);
                expect(store.getState().items).toEqual([item(4, 2), item(7, 1)]);
                expect(store.getState().owner).toBe(5);
                expect(server.fetchFn).toHaveBeenCalledTimes(1);
            },
        );

        it('si fetch lanza de forma síncrona, tampoco lanza', async () => {
            const { server, cartSync } = setup();
            server.fetchFn.mockImplementationOnce(() => {
                throw new Error('boom');
            });
            await expect(cartSync.sync()).resolves.toBeUndefined();
            expect(cartSync.isSynced()).toBe(true);
        });

        it.each<[string, Cart, number | null, Cart, Cart]>([
            [
                'local vacío y sin dueño',
                [],
                null,
                [item(4, 2), item(9, 1)],
                [item(4, 2), item(9, 1)],
            ],
            [
                'el carrito ya era de esta cuenta',
                [item(1, 1), item(4, 9)],
                5,
                [item(4, 2)],
                [item(4, 2)],
            ],
            [
                'el carrito es de otra cuenta con líneas',
                [item(1, 1), item(9, 3)],
                9,
                [item(4, 2)],
                [item(4, 2)],
            ],
            ['el carrito es de otra cuenta y el servidor lo tiene vacío', [item(1, 1)], 9, [], []],
        ])('%s: manda el servidor, sin fusionar', async (_, local, owner, saved, expected) => {
            const { store, server, cartSync } = setup({ local, owner, saved });
            cartSync.start();

            await cartSync.sync();
            expect(vi.getTimerCount()).toBe(0); // ni siquiera se programa una subida
            await wait(1000);

            expect(store.getState().items).toEqual(expected);
            expect(store.getState().owner).toBe(5);
            expect(server.posts()).toHaveLength(0);
            expect(server.puts()).toHaveLength(0); // sin subida de eco
        });

        it('carrito anónimo con líneas: lo fusiona una vez con el de la cuenta y adopta el resultado', async () => {
            const { store, server, cartSync } = setup({
                saved: [item(4, 2), item(9, 1)],
                local: [item(4, 1), item(7, 3)],
            });
            cartSync.start();

            await cartSync.sync();
            await wait(1000);

            expect(server.posts()).toEqual([
                expect.objectContaining({
                    path: '/api/carrito/fusionar',
                    items: [item(4, 1), item(7, 3)],
                }),
            ]);
            expect(store.getState().items).toEqual([item(4, 2), item(9, 1), item(7, 3)]);
            expect(store.getState().owner).toBe(5);
            expect(server.puts()).toHaveLength(0); // sin subida de eco
        });

        it('después de fusionar, otra sync no vuelve a fusionar: manda el servidor', async () => {
            const { store, server, cartSync } = setup({ saved: [item(4, 2)], local: [item(7, 3)] });
            await cartSync.sync();
            server.state.saved = [item(4, 2)]; // otro dispositivo borró la línea 7

            await cartSync.sync();

            expect(server.posts()).toHaveLength(1);
            expect(store.getState().items).toEqual([item(4, 2)]);
        });

        it.each([
            ['un error de red', networkError],
            ['un 500', async () => json(500, { message: 'Error' })],
            ['un 401', async () => json(401, { message: 'Caducada' })],
        ])(
            'si la fusión falla (%s), deja lo local sin dueño, no sube nada y la siguiente sync lo reintenta',
            async (_, respond) => {
                const { store, server, cartSync } = setup({
                    saved: [item(4, 2)],
                    local: [item(7, 3)],
                });
                cartSync.start();
                server.override('POST', respond);

                await cartSync.sync();
                expect(store.getState().items).toEqual([item(7, 3)]);
                expect(store.getState().owner).toBeNull();
                expect(cartSync.isSynced()).toBe(true);

                // Con el carrito sin fusionar, los cambios locales no pisan el del servidor.
                store.getState().add(8, 1, 10);
                await wait(1000);
                expect(server.puts()).toHaveLength(0);

                await cartSync.sync();
                expect(server.posts()).toHaveLength(2); // la que falló y el reintento
                expect(server.posts()[1].items).toEqual([item(7, 3), item(8, 1)]);
                expect(store.getState().owner).toBe(5);
                expect(store.getState().items).toEqual([item(4, 2), item(7, 3), item(8, 1)]);
            },
        );

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

        it('los PUT llevan keepalive y el GET y el POST no; todas llevan una señal de tiempo máximo', async () => {
            const { store, server, cartSync } = setup({ local: [item(7, 3)] });
            await cartSync.sync(); // GET y POST de la fusión
            cartSync.start();
            store.getState().add(8, 1, 10);
            await cartSync.flush(); // PUT

            expect(server.requests.map((r) => `${r.method}:${Boolean(r.keepalive)}`)).toEqual([
                'GET:false',
                'POST:false',
                'PUT:true',
            ]);
            expect(
                server.fetchFn.mock.calls.every(([, init]) => init?.signal instanceof AbortSignal),
            ).toBe(true);
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

        it.each([
            ['sin sesión', (server: FakeServer) => (server.state.session = null)],
            ['con la red caída', (server: FakeServer) => server.override('GET', networkError)],
        ])('pasa a true también %s', async (_, breakServer) => {
            const { server, cartSync } = setup();
            breakServer(server);
            await cartSync.sync();
            expect(cartSync.isSynced()).toBe(true);
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
            pending.resolve(json(200, { userId: null, items: [] }));
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
                expect.objectContaining({ path: '/api/carrito', items: [item(4, 2), item(7, 1)] }),
            );
            expect(server.state.saved).toEqual([item(4, 2), item(7, 1)]);

            await wait(5000); // sin más cambios no manda nada
            expect(server.puts()).toHaveLength(1);
        });

        it.each([
            [
                'deja el carrito igual que el servidor',
                (server: FakeServer) => {
                    server.state.saved = [item(4, 1)]; // otro dispositivo ya guardó lo mismo
                },
            ],
            [
                'cambia de cuenta',
                (server: FakeServer) => {
                    server.state.session = 8;
                },
            ],
        ])('una sync que %s cancela la subida programada', async (_, change) => {
            const { store, server, cartSync } = await setupLoggedIn({ owner: 5 });
            store.getState().add(4, 1, 10);
            expect(vi.getTimerCount()).toBe(1); // subida programada
            change(server);

            await cartSync.sync();
            // `adopt` no escribe si nada cambia: es `sync` quien tiene que cancelarla.
            expect(vi.getTimerCount()).toBe(0);
            await wait(1000);

            expect(server.puts()).toHaveLength(0);
        });

        it('no sube si el carrito no es de la cuenta activa (otro dueño)', async () => {
            const { store, server } = await setupLoggedIn();
            store.getState().adopt(9, [item(4, 1)]); // llega un carrito de otra cuenta (otra pestaña)
            await wait(1000);
            store.getState().add(7, 1, 10);
            await wait(1000);

            expect(server.puts()).toHaveLength(0);
        });

        it('un 401 al subir deja de subir y no vacía el carrito; la siguiente sync sí lo vacía', async () => {
            const { store, server, cartSync } = await setupLoggedIn();
            server.state.session = null;

            store.getState().add(4, 1, 10);
            await wait(300);
            expect(server.puts()).toHaveLength(1);

            store.getState().add(7, 1, 10);
            await wait(1000);
            expect(server.puts()).toHaveLength(1);
            expect(store.getState().items).toEqual([item(4, 1), item(7, 1)]);
            expect(store.getState().owner).toBe(5);

            await cartSync.sync();
            expect(store.getState().items).toEqual([]);
            expect(store.getState().owner).toBeNull();
            await wait(1000);
            expect(server.puts()).toHaveLength(1);
        });

        it.each([
            ['un 500', async () => json(500, { message: 'Error' })],
            ['un error de red', networkError],
        ])('con %s se queda pendiente hasta el siguiente cambio', async (_, respond) => {
            const { store, server } = await setupLoggedIn();
            server.override('PUT', respond);

            store.getState().add(4, 1, 10);
            await wait(300);
            await wait(10_000); // sin reintentos por su cuenta
            expect(server.puts()).toHaveLength(1);

            store.getState().add(7, 1, 10);
            await wait(300);

            expect(server.puts()).toHaveLength(2);
            expect(server.state.saved).toEqual([item(4, 1), item(7, 1)]);
        });

        it('la función que devuelve start lo para todo: suscripción y temporizador', async () => {
            const { store, server, cartSync } = setup();
            await cartSync.sync();
            const stop = cartSync.start();

            store.getState().add(4, 1, 10); // queda un temporizador pendiente
            stop();
            await wait(1000);
            store.getState().add(7, 1, 10);
            await wait(1000);

            expect(server.puts()).toHaveLength(0);
        });

        describe('con un PUT en vuelo', () => {
            it('solo hay una petición en vuelo: lo que cambia mientras tanto se manda después', async () => {
                const { store, server } = await setupLoggedIn();
                const release = server.hold('PUT');

                store.getState().add(4, 1, 10);
                await wait(300);
                expect(server.puts()).toHaveLength(1);

                store.getState().add(7, 1, 10);
                await wait(1000); // el temporizador vence, pero la primera sigue sin responder
                expect(server.puts()).toHaveLength(1);

                release();
                await wait(0);

                expect(server.puts()).toHaveLength(2);
                expect(server.puts()[1].items).toEqual([item(4, 1), item(7, 1)]);
            });

            it('si añade y quita la misma línea mientras vuela, el servidor acaba sin ella', async () => {
                const { store, server } = await setupLoggedIn();
                const release = server.hold('PUT');

                store.getState().add(4, 1, 10);
                await wait(300); // sale el PUT con [4], que se queda en vuelo
                store.getState().remove(4); // lo local vuelve a ser igual a lo que el servidor sabía antes
                release();
                await wait(0);
                expect(server.state.saved).toEqual([item(4, 1)]);

                await wait(300);

                expect(server.puts()).toHaveLength(2);
                expect(server.puts()[1].items).toEqual([]);
                expect(server.state.saved).toEqual([]);
            });

            it('lo que el usuario cambia mientras vuela no se pisa: el carrito local no vuelve atrás', async () => {
                const { store, server } = await setupLoggedIn({
                    saved: [item(4, 1)],
                    local: [item(4, 1)],
                    owner: 5,
                });
                const release = server.hold('PUT');

                store.getState().setQuantity(4, 2, 10);
                await wait(300); // sale el PUT con 2, que se queda en vuelo
                store.getState().setQuantity(4, 3, 10);
                store.getState().setQuantity(4, 4, 10);
                release();
                await wait(0);

                expect(store.getState().items).toEqual([item(4, 4)]); // no vuelve a 2

                await wait(300);
                expect(server.puts()).toHaveLength(2);
                expect(server.puts()[1].items).toEqual([item(4, 4)]);
            });
        });

        it('no lee la respuesta del PUT: lo que el servidor sanee no cambia el carrito local', async () => {
            const { store, server } = await setupLoggedIn();
            server.state.sanitize = (items) =>
                items.map((line) => item(line.variantId, Math.min(line.quantity, 3)));

            store.getState().add(4, 5, 10);
            await wait(300);
            await wait(5000);

            expect(server.state.saved).toEqual([item(4, 3)]);
            expect(store.getState().items).toEqual([item(4, 5)]);
            expect(server.puts()).toHaveLength(1);
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

        it.each([
            ['sin nada pendiente', 5],
            ['sin sesión', null],
        ])('%s no hace peticiones', async (_, session) => {
            const { store, server, cartSync } = await setupLoggedIn({ session });
            if (session === null) store.getState().add(4, 1, 10);

            await cartSync.flush();

            expect(server.fetchFn).not.toHaveBeenCalled();
        });

        it('si falla el PUT, flush lo reintenta en la siguiente llamada', async () => {
            const { store, server, cartSync } = await setupLoggedIn();
            server.override('PUT', networkError);

            store.getState().add(4, 1, 10);
            await wait(300);
            expect(server.state.saved).toEqual([]);

            await cartSync.flush();
            expect(server.state.saved).toEqual([item(4, 1)]);
        });

        it('si hay una petición en vuelo, espera a que acabe y luego manda lo último', async () => {
            const { store, server, cartSync } = await setupLoggedIn();
            const release = server.hold('PUT');
            store.getState().add(4, 1, 10);
            await wait(300);
            store.getState().add(7, 1, 10);

            let done = false;
            const flushing = cartSync.flush().then(() => {
                done = true;
            });
            await wait(0);
            expect(done).toBe(false);

            release();
            await flushing;

            expect(server.state.saved).toEqual([item(4, 1), item(7, 1)]);
        });
    });

    describe('prepareSignOut', () => {
        it('sube lo pendiente, vacía el carrito local y no manda nada más', async () => {
            const { store, server, cartSync } = await setupLoggedIn({
                saved: [item(4, 2)],
                local: [item(4, 2)],
                owner: 5,
            });
            store.getState().add(7, 1, 10); // pendiente: aún no ha vencido el temporizador

            await cartSync.prepareSignOut();

            expect(server.puts()).toHaveLength(1);
            expect(server.state.saved).toEqual([item(4, 2), item(7, 1)]); // la cuenta lo conserva
            expect(store.getState().items).toEqual([]);
            expect(store.getState().owner).toBeNull();

            store.getState().add(9, 1, 10); // ya anónimo
            await wait(5000);
            expect(server.puts()).toHaveLength(1);
        });

        it('sin nada pendiente solo vacía, y también si la subida falla', async () => {
            const { store, server, cartSync } = await setupLoggedIn({ saved: [item(4, 2)] });
            await cartSync.prepareSignOut();
            expect(server.fetchFn).not.toHaveBeenCalled();
            expect(store.getState().owner).toBeNull();

            const failing = await setupLoggedIn();
            failing.server.override('PUT', networkError);
            failing.store.getState().add(4, 1, 10);
            await expect(failing.cartSync.prepareSignOut()).resolves.toBeUndefined();
            expect(failing.store.getState().items).toEqual([]);
            expect(failing.store.getState().owner).toBeNull();
        });

        it('al volver a iniciar sesión con otra cuenta no hereda lo de la anterior', async () => {
            const { store, server, cartSync } = await setupLoggedIn({ saved: [item(4, 2)] });
            await cartSync.prepareSignOut();
            server.state.session = 8;
            server.state.saved = [item(9, 1)];

            await cartSync.sync();

            expect(store.getState().items).toEqual([item(9, 1)]);
            expect(store.getState().owner).toBe(8);
            expect(server.posts()).toHaveLength(0);
        });
    });

    describe('resyncIfOwnerChanged', () => {
        it('inicio de sesión en otra pestaña: el dueño pasa de null a una cuenta y hace sync', async () => {
            const { store, server, cartSync } = setup({ session: null });
            await cartSync.sync(); // esta pestaña cargó sin sesión
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

        it('cierre de sesión en otra pestaña: el dueño pasa a null, el GET dice que no hay sesión y no se sube nada', async () => {
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
            ['sin sesión y sin dueño', null, null],
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
});

/**
 * El tiempo máximo usa `AbortSignal.timeout`, que corre con temporizadores reales: estos tests no
 * usan los simulados y ponen un `timeoutMs` pequeño.
 */
describe('createCartSync: tiempo máximo de las peticiones', () => {
    const TIMEOUT_MS = 20;

    /** Deja el servidor sin contestar la próxima petición con ese método y devuelve la señal que recibe. */
    const hang = (server: FakeServer, method: string) => {
        const received: { signal?: AbortSignal } = {};
        server.override(method, (init) => {
            received.signal = init?.signal ?? undefined;
            return hangUntilAborted(init);
        });
        return received;
    };

    it('un GET que no responde se aborta y cuenta como error de red', async () => {
        const { store, server, cartSync } = setup({
            local: [item(4, 2)],
            owner: 5,
            timeoutMs: TIMEOUT_MS,
        });
        const request = hang(server, 'GET');

        await cartSync.sync();

        expect(request.signal?.aborted).toBe(true);
        expect(cartSync.isSynced()).toBe(true);
        expect(store.getState().items).toEqual([item(4, 2)]); // lo local, como estaba
        expect(store.getState().owner).toBe(5);
    });

    it('un POST de fusión que no responde se aborta y lo local queda sin fusionar hasta la siguiente sync', async () => {
        const { store, server, cartSync } = setup({
            local: [item(7, 3)],
            saved: [item(4, 2)],
            timeoutMs: TIMEOUT_MS,
        });
        const request = hang(server, 'POST');

        await cartSync.sync();

        expect(request.signal?.aborted).toBe(true);
        expect(store.getState().items).toEqual([item(7, 3)]);
        expect(store.getState().owner).toBeNull();

        await cartSync.sync();
        expect(store.getState().owner).toBe(5);
        expect(store.getState().items).toEqual([item(4, 2), item(7, 3)]);
    });

    it('un PUT que no responde se aborta, queda pendiente y no bloquea la cola', async () => {
        const { store, server, cartSync } = await setupLoggedIn({ timeoutMs: TIMEOUT_MS });
        const request = hang(server, 'PUT');

        store.getState().add(4, 1, 10);
        await cartSync.flush(); // el PUT cuelga y se aborta
        expect(request.signal?.aborted).toBe(true);
        expect(server.state.saved).toEqual([]);

        store.getState().add(7, 1, 10);
        await cartSync.flush();
        expect(server.state.saved).toEqual([item(4, 1), item(7, 1)]);
    });

    it('prepareSignOut termina aunque el PUT no responda', async () => {
        const { store, server, cartSync } = await setupLoggedIn({ timeoutMs: TIMEOUT_MS });
        hang(server, 'PUT');
        store.getState().add(4, 1, 10);

        await cartSync.prepareSignOut();

        expect(store.getState().items).toEqual([]);
        expect(store.getState().owner).toBeNull();
    });
});
