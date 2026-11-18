import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { addItem, mergeCarts, removeItem, setQuantity, type Cart } from '@/lib/cart/cart';
import { persistedCartSchema } from '@/lib/validations/cart';

/** Clave de `localStorage` donde se guarda el carrito. */
export const CART_STORAGE_KEY = 'pago-jotron-cart';

/** Versión del formato guardado. Si cambia, hay que escribir un `migrate` en la configuración de `persist`. */
export const CART_STORAGE_VERSION = 1;

/** Lo único que se guarda en `localStorage`: las líneas. Ni precio ni stock. */
type PersistedCart = { items: Cart };

/**
 * `localStorage` que nunca lanza. Sin él, `persist` se queda sin `store.persist` si leer
 * `localStorage` falla (en el servidor no existe; en un navegador con los datos del sitio
 * bloqueados lanza `SecurityError`), y una escritura sin espacio rompería la acción que la
 * provoca. Si no se puede guardar, el carrito sigue funcionando en memoria.
 */
function browserStorage(): StateStorage {
    return {
        getItem: (name) => {
            try {
                return localStorage.getItem(name);
            } catch {
                return null;
            }
        },
        setItem: (name, value) => {
            try {
                localStorage.setItem(name, value);
            } catch {
                // Bloqueado o sin espacio: no se guarda, y el carrito sigue en memoria.
            }
        },
        removeItem: (name) => {
            try {
                localStorage.removeItem(name);
            } catch {
                // Igual que en `setItem`.
            }
        },
    };
}

/**
 * Estado del carrito y sus acciones. Cada acción aplica la función pura de `src/lib/cart/` que le
 * corresponde, así que las reglas (límite de stock, una línea por presentación…) no se repiten aquí.
 */
export interface CartState {
    /** Las líneas del carrito, en el orden en que se añadieron. */
    items: Cart;
    /** Añade unidades de una presentación, limitadas a `stock` (`addItem`). */
    add: (variantId: number, quantity: number, stock: number) => void;
    /** Cambia la cantidad de una línea del carrito; menos de 1 la quita (`setQuantity`). */
    setQuantity: (variantId: number, quantity: number, stock: number) => void;
    /** Quita una línea (`removeItem`). */
    remove: (variantId: number) => void;
    /** Une otro carrito, por ejemplo el de la cuenta, con el actual (`mergeCarts`). */
    mergeItems: (other: Cart, stockByVariant: ReadonlyMap<number, number>) => void;
    /** Vacía el carrito. */
    clear: () => void;
}

/**
 * Crea el almacén del carrito, con `persist` en `localStorage`.
 *
 * - **Solo guarda `variantId` y `quantity`.** El precio y el stock salen siempre del servidor
 *   (`getCartLines`); lo que `localStorage` tenga además de `items` no se lee nunca.
 * - **Lo recuperado se valida** (`persistedCartSchema`): si `localStorage` está estropeado o lo
 *   han manipulado, el carrito empieza vacío en vez de romper la página.
 * - **No se recupera solo** (`skipHydration`). En el servidor no hay `localStorage` y el primer
 *   pintado del cliente debe ser igual que el del servidor; si no, React avisa de que no
 *   coinciden. Quien lo use debe llamar a `store.persist.rehydrate()` una vez montado (en un
 *   `useEffect`) y, hasta entonces, no pintar lo que dependa de las líneas ni llamar a las
 *   acciones: un cambio antes de recuperar sobrescribiría lo guardado.
 * - **Nunca lanza por el almacenamiento** (`browserStorage`): si `localStorage` no está o falla,
 *   el carrito sigue funcionando en memoria y `store.persist` existe siempre.
 *
 * @param storage - Dónde guardar; por defecto `localStorage`. Solo lo cambian los tests.
 * @returns El almacén, sin enlazar a React: `store.getState()`, `store.subscribe(...)`.
 *
 * @example
 * const store = createCartStore();
 * store.getState().add(4, 2, 10); // presentación 4, 2 unidades, 10 en stock
 */
export function createCartStore(storage?: StateStorage) {
    return createStore<CartState>()(
        persist<CartState, [], [], PersistedCart>(
            (set, get) => {
                /**
                 * Aplica `change` a las líneas. Si devuelve las mismas, no llama a `set`: el `set` de
                 * `persist` escribe en el almacenamiento siempre, aunque el estado no cambie.
                 */
                const update = (change: (items: Cart) => Cart) => {
                    const { items } = get();
                    const next = change(items);
                    if (next !== items) set({ items: next });
                };

                return {
                    items: [],
                    add: (variantId, quantity, stock) =>
                        update((items) => addItem(items, variantId, quantity, stock)),
                    setQuantity: (variantId, quantity, stock) =>
                        update((items) => setQuantity(items, variantId, quantity, stock)),
                    remove: (variantId) => update((items) => removeItem(items, variantId)),
                    mergeItems: (other, stockByVariant) =>
                        update((items) => mergeCarts(items, other, stockByVariant)),
                    clear: () => update((items) => (items.length === 0 ? items : [])),
                };
            },
            {
                name: CART_STORAGE_KEY,
                version: CART_STORAGE_VERSION,
                storage: createJSONStorage<PersistedCart>(() => storage ?? browserStorage()),
                partialize: ({ items }) => ({ items }),
                merge: (persisted, current) => {
                    const parsed = persistedCartSchema.safeParse(persisted);
                    return parsed.success ? { ...current, items: parsed.data.items } : current;
                },
                skipHydration: true,
            },
        ),
    );
}

/** El carrito de la tienda: un único almacén para toda la aplicación, en el navegador. */
export const cartStore = createCartStore();

/**
 * Lee del carrito desde un componente de cliente. Pasa un selector para suscribirte solo a lo que
 * pintas, y nunca devuelvas un objeto o array nuevo en él (React entraría en bucle).
 *
 * @param selector - Qué parte del estado necesita el componente.
 * @returns Lo que devuelve el selector; el componente se vuelve a pintar cuando cambia.
 *
 * @example
 * const items = useCartStore((state) => state.items);
 * const add = useCartStore((state) => state.add);
 */
export function useCartStore<T>(selector: (state: CartState) => T): T {
    return useStore(cartStore, selector);
}
