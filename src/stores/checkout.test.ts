import type { StateStorage } from 'zustand/middleware';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHECKOUT_STORAGE_KEY, CHECKOUT_STORAGE_VERSION, createCheckoutStore } from './checkout';

/** `sessionStorage` en memoria: Vitest corre en Node, que no lo tiene. */
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
    JSON.parse(storage.data[CHECKOUT_STORAGE_KEY] ?? 'null');

/** Prepara en el almacenamiento un estado guardado a mano. */
const withSaved = (state: unknown) =>
    memoryStorage({
        [CHECKOUT_STORAGE_KEY]: JSON.stringify({ state, version: CHECKOUT_STORAGE_VERSION }),
    });

describe('createCheckoutStore', () => {
    let storage: ReturnType<typeof memoryStorage>;
    beforeEach(() => {
        storage = memoryStorage();
    });

    describe('acciones', () => {
        it('empieza sin elegir nada y con la facturación igual que el envío', () => {
            expect(createCheckoutStore(storage).getState()).toMatchObject({
                shippingTypeId: null,
                shippingAddressId: null,
                billingSameAsShipping: true,
                billingAddressId: null,
            });
        });

        it('cada acción cambia su campo', () => {
            const store = createCheckoutStore(storage);
            store.getState().setShippingType(2);
            store.getState().selectShippingAddress(7);
            store.getState().setBillingSame(false);
            store.getState().selectBillingAddress(9);
            expect(store.getState()).toMatchObject({
                shippingTypeId: 2,
                shippingAddressId: 7,
                billingSameAsShipping: false,
                billingAddressId: 9,
            });
        });

        it('reset lo devuelve todo al principio', () => {
            const store = createCheckoutStore(storage);
            store.getState().setShippingType(2);
            store.getState().setBillingSame(false);
            store.getState().reset();
            expect(store.getState()).toMatchObject({
                shippingTypeId: null,
                billingSameAsShipping: true,
            });
        });

        it('una acción que no cambia nada no escribe ni avisa', () => {
            const store = createCheckoutStore(storage);
            store.getState().setShippingType(2);
            const writes = storage.writes();
            const listener = vi.fn();
            store.subscribe(listener);

            store.getState().setShippingType(2);
            store.getState().setBillingSame(true);
            store.getState().selectShippingAddress(null);
            store.getState().selectBillingAddress(null);

            expect(storage.writes()).toBe(writes);
            expect(listener).not.toHaveBeenCalled();
        });

        it('reset en el estado inicial no escribe', () => {
            const store = createCheckoutStore(storage);
            store.getState().reset();
            expect(storage.writes()).toBe(0);
        });

        it('escribe una vez por cada cambio de verdad', () => {
            const store = createCheckoutStore(storage);
            store.getState().setShippingType(2);
            store.getState().setShippingType(3);
            expect(storage.writes()).toBe(2);
        });
    });

    describe('persistencia', () => {
        it('guarda solo los cuatro campos, con su versión', () => {
            const store = createCheckoutStore(storage);
            store.getState().setShippingType(2);
            expect(saved(storage)).toEqual({
                state: {
                    shippingTypeId: 2,
                    shippingAddressId: null,
                    billingSameAsShipping: true,
                    billingAddressId: null,
                },
                version: CHECKOUT_STORAGE_VERSION,
            });
        });

        it('no se recupera hasta pedirlo: el primer pintado coincide con el del servidor', () => {
            const store = createCheckoutStore(
                withSaved({
                    shippingTypeId: 2,
                    shippingAddressId: 7,
                    billingSameAsShipping: false,
                    billingAddressId: 9,
                }),
            );
            expect(store.getState().shippingTypeId).toBeNull();
            expect(store.persist.hasHydrated()).toBe(false);

            store.persist.rehydrate();
            expect(store.getState()).toMatchObject({
                shippingTypeId: 2,
                shippingAddressId: 7,
                billingSameAsShipping: false,
                billingAddressId: 9,
            });
            expect(store.persist.hasHydrated()).toBe(true);
        });

        it('recupera lo que guardó otro almacén', async () => {
            const first = createCheckoutStore(storage);
            first.getState().setShippingType(2);
            first.getState().selectShippingAddress(7);

            const second = createCheckoutStore(storage);
            await second.persist.rehydrate();
            expect(second.getState().shippingTypeId).toBe(2);
            expect(second.getState().shippingAddressId).toBe(7);
        });

        it('lo guardado a medias se completa con los valores de partida', async () => {
            const store = createCheckoutStore(withSaved({ shippingTypeId: 2 }));
            await store.persist.rehydrate();
            expect(store.getState()).toMatchObject({
                shippingTypeId: 2,
                shippingAddressId: null,
                billingSameAsShipping: true,
                billingAddressId: null,
            });
        });

        it.each([
            ['texto', 'dos'],
            ['cero', 0],
            ['negativo', -3],
            ['decimal', 1.5],
            ['un objeto', { id: 5 }],
        ])('un id guardado que es %s se trata como sin elegir', async (_name, bad) => {
            const store = createCheckoutStore(
                withSaved({ shippingTypeId: bad, shippingAddressId: 7 }),
            );
            await store.persist.rehydrate();
            expect(store.getState().shippingTypeId).toBeNull();
            expect(store.getState().shippingAddressId).toBe(7);
        });

        it('una casilla guardada que no es booleana vuelve a true', async () => {
            const store = createCheckoutStore(withSaved({ billingSameAsShipping: 'no' }));
            await store.persist.rehydrate();
            expect(store.getState().billingSameAsShipping).toBe(true);
        });

        it.each([
            ['JSON roto', '{no es json'],
            ['un texto', JSON.stringify({ state: 'hola', version: CHECKOUT_STORAGE_VERSION })],
            ['sin estado', JSON.stringify({ version: CHECKOUT_STORAGE_VERSION })],
        ])(
            'lo guardado roto (%s) deja el estado inicial y avisa de que terminó',
            async (_n, raw) => {
                const store = createCheckoutStore(memoryStorage({ [CHECKOUT_STORAGE_KEY]: raw }));
                await store.persist.rehydrate();
                expect(store.getState().shippingTypeId).toBeNull();
                expect(store.getState().billingSameAsShipping).toBe(true);
                expect(store.persist.hasHydrated()).toBe(true);
            },
        );

        it('sigue funcionando después de recuperar algo estropeado', async () => {
            const store = createCheckoutStore(
                memoryStorage({ [CHECKOUT_STORAGE_KEY]: '{no es json' }),
            );
            await store.persist.rehydrate();
            store.getState().setShippingType(4);
            expect(store.getState().shippingTypeId).toBe(4);
        });

        it('lo que sobra en lo guardado no llega al estado', async () => {
            const store = createCheckoutStore(withSaved({ shippingTypeId: 2, totalCents: 1 }));
            await store.persist.rehydrate();
            expect(store.getState()).not.toHaveProperty('totalCents');
        });
    });

    describe('almacenamiento por defecto (sessionStorage)', () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        /** `sessionStorage` cuyos métodos lanzan, como con los datos del sitio bloqueados. */
        const brokenStorage = () => {
            const fail = () => {
                throw new DOMException('bloqueado', 'SecurityError');
            };
            return { getItem: fail, setItem: fail, removeItem: fail };
        };

        it('guarda y recupera en sessionStorage con la clave del checkout, no en localStorage', async () => {
            const session = memoryStorage();
            const local = memoryStorage();
            vi.stubGlobal('sessionStorage', session);
            vi.stubGlobal('localStorage', local);

            createCheckoutStore().getState().setShippingType(2);
            expect(saved(session).state.shippingTypeId).toBe(2);
            expect(local.writes()).toBe(0);

            const second = createCheckoutStore();
            await second.persist.rehydrate();
            expect(second.getState().shippingTypeId).toBe(2);
        });

        it('sin sessionStorage (servidor), store.persist existe y funciona en memoria', async () => {
            vi.stubGlobal('sessionStorage', undefined);
            const store = createCheckoutStore();
            expect(store.persist).toBeDefined();
            await expect(store.persist.rehydrate()).resolves.not.toThrow();
            store.getState().setShippingType(2);
            expect(store.getState().shippingTypeId).toBe(2);
        });

        it('con sessionStorage bloqueado, no lanza al recuperar ni al guardar', async () => {
            vi.stubGlobal('sessionStorage', brokenStorage());
            const store = createCheckoutStore();
            await expect(store.persist.rehydrate()).resolves.not.toThrow();
            expect(() => store.getState().setShippingType(2)).not.toThrow();
            expect(store.getState().shippingTypeId).toBe(2);
        });
    });
});
