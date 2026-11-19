import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { addItem, mergeCarts, removeItem, setQuantity, type Cart } from '@/lib/cart/cart';
import { reconcileCart, type CartChange, type StockInfo } from '@/lib/cart/reconcile';
import { sameCart } from '@/lib/cart/sync';
import { persistedCartSchema } from '@/lib/validations/cart';

/** Clave de `localStorage` donde se guarda el carrito. */
export const CART_STORAGE_KEY = 'pago-jotron-cart';

/** Versión del formato guardado. Si cambia, hay que escribir un `migrate` en la configuración de `persist`. */
export const CART_STORAGE_VERSION = 1;

/**
 * Lo único que se guarda en `localStorage`: las líneas y de quién son (`owner`). Ni precio ni stock.
 */
type PersistedCart = { items: Cart; owner: number | null };

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
 * Envuelve un almacenamiento para que `getItem` devuelva `null` si lo guardado no es JSON. Sin
 * esto, `JSON.parse` lanza dentro de `persist` y la recuperación termina en su `catch`, que ni
 * marca el carrito como recuperado (`hasHydrated`) ni avisa a quien espera: la página del carrito
 * se quedaría para siempre en el esqueleto.
 */
function withValidJson(storage: StateStorage): StateStorage {
    const valid = (raw: string | null): string | null => {
        if (raw === null) return null;
        try {
            JSON.parse(raw);
            return raw;
        } catch {
            return null;
        }
    };
    return {
        getItem: (name) => {
            const value = storage.getItem(name);
            return typeof value === 'string' || value === null
                ? valid(value)
                : Promise.resolve(value).then(valid);
        },
        setItem: (name, value) => storage.setItem(name, value),
        removeItem: (name) => storage.removeItem(name),
    };
}

/**
 * Estado del carrito y sus acciones. Cada acción aplica la función pura de `src/lib/cart/` que le
 * corresponde, así que las reglas (límite de stock, una línea por presentación…) no se repiten aquí.
 */
export interface CartState {
    /** Las líneas del carrito, en el orden en que se añadieron. */
    items: Cart;
    /**
     * Id de la cuenta con la que se sincronizó el carrito por última vez; `null` si es anónimo
     * (nunca se ha sincronizado, o se vació al cerrar sesión). Decide si, al iniciar sesión, el
     * carrito local se fusiona con el de la cuenta o se descarta (`planCartSync`).
     */
    owner: number | null;
    /** Añade unidades de una presentación, limitadas a `stock` (`addItem`). */
    add: (variantId: number, quantity: number, stock: number) => void;
    /** Cambia la cantidad de una línea del carrito; menos de 1 la quita (`setQuantity`). */
    setQuantity: (variantId: number, quantity: number, stock: number) => void;
    /** Quita una línea (`removeItem`). */
    remove: (variantId: number) => void;
    /** Une otro carrito, por ejemplo el de la cuenta, con el actual (`mergeCarts`). */
    mergeItems: (other: Cart, stockByVariant: ReadonlyMap<number, number>) => void;
    /**
     * Pone el carrito al día con lo que el servidor devuelve ahora (`reconcileCart`): quita lo
     * agotado o no disponible y limita las cantidades al stock. Devuelve los cambios hechos, para
     * avisar al usuario; sin cambios, no escribe ni avisa.
     */
    reconcile: (lines: readonly StockInfo[]) => CartChange[];
    /**
     * Se queda con el carrito que el servidor tiene para la cuenta `userId`: pone sus líneas y
     * `owner = userId` en una sola escritura. Sin cambios, no escribe ni avisa.
     */
    adopt: (userId: number, items: Cart) => void;
    /** Vacía el carrito y lo deja sin dueño (anónimo). Si ya estaba así, no escribe ni avisa. */
    clear: () => void;
}

/**
 * Crea el almacén del carrito, con `persist` en `localStorage`.
 *
 * - **Solo guarda `variantId`, `quantity` y el dueño (`owner`).** El precio y el stock salen
 *   siempre del servidor (`getCartLines`); lo que `localStorage` tenga además no se lee nunca.
 * - **Lo recuperado se valida** (`persistedCartSchema`, y `withValidJson` si ni siquiera es JSON): si
 *   `localStorage` está estropeado o lo han manipulado, el carrito empieza vacío (y anónimo) en vez de romper la página.
 *   Un `owner` ausente (formato anterior) o que no es un id se trata como anónimo.
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
                    owner: null,
                    add: (variantId, quantity, stock) =>
                        update((items) => addItem(items, variantId, quantity, stock)),
                    setQuantity: (variantId, quantity, stock) =>
                        update((items) => setQuantity(items, variantId, quantity, stock)),
                    remove: (variantId) => update((items) => removeItem(items, variantId)),
                    mergeItems: (other, stockByVariant) =>
                        update((items) => mergeCarts(items, other, stockByVariant)),
                    reconcile: (lines) => {
                        const { items } = get();
                        const result = reconcileCart(items, lines);
                        if (result.cart !== items) set({ items: result.cart });
                        return result.changes;
                    },
                    adopt: (userId, items) => {
                        const current = get();
                        const sameItems = sameCart(current.items, items);
                        if (sameItems && current.owner === userId) return;
                        set({ items: sameItems ? current.items : items, owner: userId });
                    },
                    clear: () => {
                        const { items, owner } = get();
                        if (items.length > 0 || owner !== null) set({ items: [], owner: null });
                    },
                };
            },
            {
                name: CART_STORAGE_KEY,
                version: CART_STORAGE_VERSION,
                storage: createJSONStorage<PersistedCart>(() =>
                    withValidJson(storage ?? browserStorage()),
                ),
                partialize: ({ items, owner }) => ({ items, owner }),
                merge: (persisted, current) => {
                    const parsed = persistedCartSchema.safeParse(persisted);
                    if (!parsed.success) return current;
                    return { ...current, items: parsed.data.items, owner: parsed.data.owner };
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
