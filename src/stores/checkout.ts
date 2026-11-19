import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { persistedCheckoutSchema, type PersistedCheckout } from '@/lib/validations/checkout-state';
import { browserStorage, withValidJson } from '@/stores/storage';

/** Clave de `sessionStorage` donde se guardan las elecciones del checkout. */
export const CHECKOUT_STORAGE_KEY = 'pago-jotron-checkout';

/** Versión del formato guardado. Si cambia, hay que escribir un `migrate` en la configuración de `persist`. */
export const CHECKOUT_STORAGE_VERSION = 1;

/**
 * Elecciones del usuario a lo largo de los pasos Datos, Pago y Confirmar, y sus acciones. Solo
 * guardan ids: los datos de la dirección y los importes salen siempre del servidor.
 */
export interface CheckoutState extends PersistedCheckout {
    /** Id de la modalidad de envío elegida (`shipping_types`), o `null` si aún no hay. */
    shippingTypeId: number | null;
    /** Id de la dirección de envío elegida, o `null` si no hay (o se está añadiendo una nueva). */
    shippingAddressId: number | null;
    /** `true` (por defecto) si la dirección de facturación es la misma que la de envío. */
    billingSameAsShipping: boolean;
    /** Id de la dirección de facturación elegida, o `null`; solo cuenta si `billingSameAsShipping` es `false`. */
    billingAddressId: number | null;
    /** Elige la modalidad de envío. */
    setShippingType: (id: number | null) => void;
    /** Elige la dirección de envío. */
    selectShippingAddress: (id: number | null) => void;
    /** Marca o desmarca "la facturación es la misma que el envío". */
    setBillingSame: (same: boolean) => void;
    /** Elige la dirección de facturación. */
    selectBillingAddress: (id: number | null) => void;
    /** Olvida todas las elecciones (por ejemplo, al terminar el pedido). Si ya estaba limpio, no escribe. */
    reset: () => void;
}

/** El estado de partida: lo que `reset` restaura. */
const INITIAL: PersistedCheckout = {
    shippingTypeId: null,
    shippingAddressId: null,
    billingSameAsShipping: true,
    billingAddressId: null,
};

/**
 * Crea el almacén del checkout, con `persist` en `sessionStorage` (es de esta compra y de esta
 * pestaña: no debe sobrevivir al cierre ni verse en otra).
 *
 * - **Solo guarda ids y la casilla de facturación** (`partialize`); las acciones no se serializan.
 * - **Lo recuperado se valida** (`persistedCheckoutSchema`, y `withValidJson` si ni siquiera es
 *   JSON): si está estropeado o manipulado, vale `null` en cada id y `true` en la casilla.
 * - **No se recupera solo** (`skipHydration`), por lo mismo que el carrito: el primer pintado del
 *   cliente debe coincidir con el del servidor. Quien lo use llama a
 *   `store.persist.rehydrate()` tras montar (`CheckoutHydrator`) y, hasta entonces
 *   (`useCheckoutHydrated`), no pinta lo que dependa de él ni llama a las acciones.
 * - **Nunca lanza por el almacenamiento** (`browserStorage`): sin `sessionStorage` sigue en memoria.
 * - **Las acciones solo escriben si algo cambia**: el `set` de `persist` escribe siempre.
 *
 * @param storage - Dónde guardar; por defecto `sessionStorage`. Solo lo cambian los tests.
 * @returns El almacén, sin enlazar a React.
 *
 * @example
 * const store = createCheckoutStore();
 * store.getState().setShippingType(2);
 */
export function createCheckoutStore(storage?: StateStorage) {
    return createStore<CheckoutState>()(
        persist<CheckoutState, [], [], PersistedCheckout>(
            (set, get) => {
                /** `set` solo si algún campo cambia de verdad. */
                const update = (patch: Partial<PersistedCheckout>) => {
                    const state = get();
                    const changed = (Object.keys(patch) as (keyof PersistedCheckout)[]).some(
                        (key) => state[key] !== patch[key],
                    );
                    if (changed) set(patch);
                };

                return {
                    ...INITIAL,
                    setShippingType: (id) => update({ shippingTypeId: id }),
                    selectShippingAddress: (id) => update({ shippingAddressId: id }),
                    setBillingSame: (same) => update({ billingSameAsShipping: same }),
                    selectBillingAddress: (id) => update({ billingAddressId: id }),
                    reset: () => update(INITIAL),
                };
            },
            {
                name: CHECKOUT_STORAGE_KEY,
                version: CHECKOUT_STORAGE_VERSION,
                storage: createJSONStorage<PersistedCheckout>(() =>
                    withValidJson(storage ?? browserStorage('session')),
                ),
                partialize: ({
                    shippingTypeId,
                    shippingAddressId,
                    billingSameAsShipping,
                    billingAddressId,
                }) => ({
                    shippingTypeId,
                    shippingAddressId,
                    billingSameAsShipping,
                    billingAddressId,
                }),
                merge: (persisted, current) => {
                    const parsed = persistedCheckoutSchema.safeParse(persisted);
                    return parsed.success ? { ...current, ...parsed.data } : current;
                },
                skipHydration: true,
            },
        ),
    );
}

/** Las elecciones del checkout: un único almacén para toda la aplicación, en el navegador. */
export const checkoutStore = createCheckoutStore();

/**
 * Lee del checkout desde un componente de cliente. Pasa un selector para suscribirte solo a lo que
 * pintas, y nunca devuelvas un objeto o array nuevo en él (React entraría en bucle).
 *
 * @param selector - Qué parte del estado necesita el componente.
 * @returns Lo que devuelve el selector; el componente se vuelve a pintar cuando cambia.
 *
 * @example
 * const shippingTypeId = useCheckoutStore((state) => state.shippingTypeId);
 * const setShippingType = useCheckoutStore((state) => state.setShippingType);
 */
export function useCheckoutStore<T>(selector: (state: CheckoutState) => T): T {
    return useStore(checkoutStore, selector);
}
