import type { StateStorage } from 'zustand/middleware';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_STORAGE_KEY, CART_STORAGE_VERSION, createCartStore } from './cart';

/** `localStorage` en memoria: Vitest corre en Node, que no lo tiene. */
function memoryStorage(initial: Record<string, string> = {}): StateStorage & {
    data: Record<string, string>;
    /** Cuántas veces se ha escrito: un JSON idéntico reescrito también cuenta. */
    writes: () => number;
} {
    const data = { ...initial };
    let writes = 0;
    return {
        data,
        writes: () => writes,
        getItem: (name) => data[name] ?? null,
        setItem: (name, value) => {
            writes += 1;
            data[name] = value;
        },
        removeItem: (name) => {
            delete data[name];
        },
    };
}

/** Lo que `persist` escribe: `{ state, version }` en JSON. */
const saved = (storage: { data: Record<string, string> }) =>
    JSON.parse(storage.data[CART_STORAGE_KEY] ?? 'null');

describe('createCartStore', () => {
    let storage: ReturnType<typeof memoryStorage>;
    beforeEach(() => {
        storage = memoryStorage();
    });

    describe('acciones', () => {
        it('empieza vacío', () => {
            expect(createCartStore(storage).getState().items).toEqual([]);
        });

        it('add suma y limita al stock', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 2, 5);
            store.getState().add(4, 9, 5);
            expect(store.getState().items).toEqual([{ variantId: 4, quantity: 5 }]);
        });

        it('add no mete lo que no tiene stock', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 1, 0);
            expect(store.getState().items).toEqual([]);
        });

        it('setQuantity cambia la cantidad, limitada al stock, y menos de 1 quita la línea', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 2, 10);
            store.getState().add(7, 1, 10);

            store.getState().setQuantity(4, 99, 6);
            expect(store.getState().items).toEqual([
                { variantId: 4, quantity: 6 },
                { variantId: 7, quantity: 1 },
            ]);

            store.getState().setQuantity(4, 0, 6);
            expect(store.getState().items).toEqual([{ variantId: 7, quantity: 1 }]);
        });

        it('remove quita la línea', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 2, 10);
            store.getState().remove(4);
            expect(store.getState().items).toEqual([]);
        });

        it('mergeItems une con la mayor cantidad y limita al stock', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 2, 10);

            store.getState().mergeItems(
                [
                    { variantId: 4, quantity: 3 },
                    { variantId: 9, quantity: 1 },
                    { variantId: 11, quantity: 1 },
                ],
                new Map([
                    [4, 10],
                    [9, 0],
                    [11, 4],
                ]),
            );

            expect(store.getState().items).toEqual([
                { variantId: 4, quantity: 3 },
                { variantId: 11, quantity: 1 },
            ]);
        });

        it('clear vacía el carrito', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 2, 10);
            store.getState().clear();
            expect(store.getState().items).toEqual([]);
        });

        it('no avisa a los suscriptores ni escribe si nada cambia', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 2, 10);
            let calls = 0;
            const unsubscribe = store.subscribe(() => (calls += 1));
            const writesBefore = storage.writes();

            store.getState().add(4, 1, 2); // ya está en el stock
            store.getState().remove(99); // no estaba
            store.getState().setQuantity(99, 3, 10); // no estaba
            store.getState().setQuantity(4, 2, 10); // misma cantidad
            store.getState().mergeItems([{ variantId: 4, quantity: 2 }], new Map([[4, 10]])); // igual
            store.getState().mergeItems([], new Map([[4, 10]])); // otro carrito vacío

            expect(calls).toBe(0);
            expect(storage.writes()).toBe(writesBefore);
            unsubscribe();
        });

        it('clear con el carrito vacío no escribe ni avisa', () => {
            const store = createCartStore(storage);
            let calls = 0;
            const unsubscribe = store.subscribe(() => (calls += 1));

            store.getState().clear();

            expect(calls).toBe(0);
            expect(storage.writes()).toBe(0);
            unsubscribe();
        });

        it('escribe una vez por cada cambio de verdad', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 1, 10);
            store.getState().add(4, 1, 10);
            store.getState().remove(4);
            expect(storage.writes()).toBe(3);
        });

        it('avisa a los suscriptores cuando cambia', () => {
            const store = createCartStore(storage);
            let calls = 0;
            const unsubscribe = store.subscribe(() => (calls += 1));
            store.getState().add(4, 1, 10);
            expect(calls).toBe(1);
            unsubscribe();
        });
    });

    describe('persistencia', () => {
        it('guarda solo variantId y quantity, con su versión', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 2, 10);

            expect(saved(storage)).toEqual({
                state: { items: [{ variantId: 4, quantity: 2 }] },
                version: CART_STORAGE_VERSION,
            });
        });

        it('no guarda las acciones ni nada más que las líneas', () => {
            const store = createCartStore(storage);
            store.getState().add(4, 2, 10);
            expect(Object.keys(saved(storage).state)).toEqual(['items']);
        });

        it('no se recupera hasta pedirlo: el primer pintado coincide con el del servidor', () => {
            storage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify({
                    state: { items: [{ variantId: 4, quantity: 2 }] },
                    version: CART_STORAGE_VERSION,
                }),
            );
            const store = createCartStore(storage);
            expect(store.getState().items).toEqual([]);

            store.persist.rehydrate();
            expect(store.getState().items).toEqual([{ variantId: 4, quantity: 2 }]);
        });

        it('recupera lo que guardó otro almacén', async () => {
            const first = createCartStore(storage);
            first.getState().add(4, 2, 10);
            first.getState().add(7, 1, 10);

            const second = createCartStore(storage);
            await second.persist.rehydrate();
            expect(second.getState().items).toEqual(first.getState().items);
        });

        it.each([
            ['JSON roto', '{no es json'],
            ['sin items', JSON.stringify({ state: {}, version: CART_STORAGE_VERSION })],
            [
                'cantidad no válida',
                JSON.stringify({
                    state: { items: [{ variantId: 4, quantity: 0 }] },
                    version: CART_STORAGE_VERSION,
                }),
            ],
            [
                'presentación repetida',
                JSON.stringify({
                    state: {
                        items: [
                            { variantId: 4, quantity: 1 },
                            { variantId: 4, quantity: 2 },
                        ],
                    },
                    version: CART_STORAGE_VERSION,
                }),
            ],
            ['un array en vez de un objeto', JSON.stringify([1, 2, 3])],
        ])('si lo guardado tiene %s, el carrito queda vacío', async (_, raw) => {
            storage.setItem(CART_STORAGE_KEY, raw);
            const store = createCartStore(storage);
            await store.persist.rehydrate();
            expect(store.getState().items).toEqual([]);
        });

        it('un precio o un stock escritos a mano en lo guardado no llegan al estado', async () => {
            storage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify({
                    state: {
                        items: [{ variantId: 4, quantity: 2, price: '0.01', stock: 999 }],
                        prices: { 4: '0.01' },
                    },
                    version: CART_STORAGE_VERSION,
                }),
            );
            const store = createCartStore(storage);
            await store.persist.rehydrate();

            expect(store.getState().items).toEqual([{ variantId: 4, quantity: 2 }]);
            expect(store.getState()).not.toHaveProperty('prices');
        });

        it('sigue funcionando después de recuperar un carrito estropeado', async () => {
            storage.setItem(CART_STORAGE_KEY, '{no es json');
            const store = createCartStore(storage);
            await store.persist.rehydrate();

            store.getState().add(4, 1, 10);
            expect(saved(storage).state.items).toEqual([{ variantId: 4, quantity: 1 }]);
        });

        it('una acción que no cambia nada antes de recuperar no pisa lo guardado', async () => {
            const stored = JSON.stringify({
                state: { items: [{ variantId: 4, quantity: 2 }] },
                version: CART_STORAGE_VERSION,
            });
            storage.setItem(CART_STORAGE_KEY, stored);
            const store = createCartStore(storage);

            store.getState().remove(99);
            store.getState().clear();
            store.getState().mergeItems([], new Map());
            expect(storage.data[CART_STORAGE_KEY]).toBe(stored);

            await store.persist.rehydrate();
            expect(store.getState().items).toEqual([{ variantId: 4, quantity: 2 }]);
        });
    });

    describe('almacenamiento por defecto (localStorage)', () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        /** `localStorage` cuyos métodos lanzan, como con los datos del sitio bloqueados o sin espacio. */
        const brokenLocalStorage = () => {
            const fail = () => {
                throw new DOMException('bloqueado', 'SecurityError');
            };
            return { getItem: fail, setItem: fail, removeItem: fail };
        };

        it('guarda y recupera en localStorage con la clave del carrito', async () => {
            const local = memoryStorage();
            vi.stubGlobal('localStorage', local);

            const first = createCartStore();
            first.getState().add(4, 2, 10);
            expect(saved(local).state.items).toEqual([{ variantId: 4, quantity: 2 }]);

            const second = createCartStore();
            await second.persist.rehydrate();
            expect(second.getState().items).toEqual([{ variantId: 4, quantity: 2 }]);
        });

        it('sin localStorage (servidor), store.persist existe y el carrito funciona en memoria', async () => {
            vi.stubGlobal('localStorage', undefined);

            const store = createCartStore();
            expect(store.persist).toBeDefined();
            await expect(store.persist.rehydrate()).resolves.not.toThrow();

            store.getState().add(4, 2, 10);
            expect(store.getState().items).toEqual([{ variantId: 4, quantity: 2 }]);
        });

        it('con localStorage bloqueado, no lanza al recuperar ni al guardar', async () => {
            vi.stubGlobal('localStorage', brokenLocalStorage());

            const store = createCartStore();
            expect(store.persist).toBeDefined();
            await expect(store.persist.rehydrate()).resolves.not.toThrow();

            expect(() => store.getState().add(4, 2, 10)).not.toThrow();
            expect(store.getState().items).toEqual([{ variantId: 4, quantity: 2 }]);
        });
    });
});
