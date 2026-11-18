/**
 * Reconciliación del carrito con el servidor (RF6), como función pura. El carrito guardado en el
 * navegador puede quedar desfasado: mientras tanto se agota una presentación, baja su stock o el
 * producto se bloquea o se borra. `reconcileCart` pone el carrito al día con lo que el servidor
 * (`getCartLines`) devuelve ahora y cuenta qué ha cambiado, para poder avisar al usuario.
 */
import type { Cart, CartItem } from './cart';

/** Lo que `reconcileCart` necesita de una línea del servidor. */
export interface StockInfo {
    variantId: number;
    stock: number;
}

/**
 * Un cambio hecho en el carrito al reconciliarlo:
 * - `removed` con `sold-out`: la presentación sigue existiendo, pero no queda stock.
 * - `removed` con `unavailable`: el servidor ya no devuelve la presentación (bloqueada o borrada).
 * - `clamped`: queda stock, pero menos del que había en el carrito; la cantidad pasa de `from` a `to`.
 */
export type CartChange =
    | { type: 'removed'; variantId: number; reason: 'sold-out' | 'unavailable' }
    | { type: 'clamped'; variantId: number; from: number; to: number };

/** Stock aprovechable: un entero >= 0. Lo que no es finito (`NaN`, infinito) o es negativo cuenta como 0. */
function usableStock(stock: number): number {
    return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
}

/**
 * Pone el carrito al día con las líneas que el servidor devuelve ahora. Para cada línea del
 * carrito, en orden:
 *
 * - Si el servidor no la devuelve, se quita (`unavailable`: bloqueada o borrada).
 * - Si no tiene stock aprovechable (entero >= 1; un decimal se redondea hacia abajo, y lo que no
 *   es finito o es negativo cuenta como 0), se quita (`sold-out`).
 * - Si pide más unidades que el stock, se deja con el stock (`clamped`).
 * - Si no, se queda igual.
 *
 * Las líneas que quedan conservan su orden, y `changes` va en el orden del carrito. Si no cambia
 * nada, devuelve el mismo `cart` (misma referencia) y `changes` vacío, para que el almacén no
 * escriba ni avise. No modifica el carrito que recibe.
 *
 * @param cart - El carrito actual.
 * @param lines - El stock actual de cada línea, tal como lo da el servidor.
 * @returns El carrito al día y la lista de cambios, en el orden del carrito.
 *
 * @example
 * reconcileCart(
 *     [{ variantId: 4, quantity: 5 }, { variantId: 7, quantity: 1 }, { variantId: 9, quantity: 2 }],
 *     [{ variantId: 4, stock: 3 }, { variantId: 7, stock: 0 }],
 * );
 * // {
 * //     cart: [{ variantId: 4, quantity: 3 }],
 * //     changes: [
 * //         { type: 'clamped', variantId: 4, from: 5, to: 3 },
 * //         { type: 'removed', variantId: 7, reason: 'sold-out' },
 * //         { type: 'removed', variantId: 9, reason: 'unavailable' },
 * //     ],
 * // }
 */
export function reconcileCart(
    cart: Cart,
    lines: readonly StockInfo[],
): { cart: Cart; changes: CartChange[] } {
    const stockByVariant = new Map(lines.map(({ variantId, stock }) => [variantId, stock]));

    const kept: CartItem[] = [];
    const changes: CartChange[] = [];
    for (const item of cart) {
        const { variantId, quantity } = item;
        const known = stockByVariant.get(variantId);

        if (known === undefined) {
            changes.push({ type: 'removed', variantId, reason: 'unavailable' });
            continue;
        }

        const stock = usableStock(known);
        if (stock < 1) {
            changes.push({ type: 'removed', variantId, reason: 'sold-out' });
        } else if (quantity > stock) {
            changes.push({ type: 'clamped', variantId, from: quantity, to: stock });
            kept.push({ variantId, quantity: stock });
        } else {
            kept.push(item);
        }
    }

    return changes.length === 0 ? { cart, changes } : { cart: kept, changes };
}
