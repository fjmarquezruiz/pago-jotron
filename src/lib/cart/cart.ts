/**
 * Lógica del carrito (RF6) como funciones puras: no tocan el almacén, la red ni la BD, y nunca
 * modifican el carrito que reciben, devuelven uno nuevo (o el mismo si no cambia nada).
 *
 * El carrito solo sabe qué presentación (`variantId`) y cuántas unidades. El precio y el stock no
 * se guardan: salen siempre del servidor (`getCartLines`). Por eso cada función que puede subir
 * una cantidad recibe el stock que el servidor acaba de dar, y la limita a él.
 *
 * Reglas que cumplen todas:
 * - Cada línea tiene una cantidad entera >= 1 y no mayor que el stock. Una línea sin stock que
 *   dar desaparece: no hay líneas con cantidad 0.
 * - Una presentación aparece en una sola línea.
 * - Un carrito tiene como mucho `CART_MAX_LINES` líneas distintas.
 * - Los argumentos que no tienen sentido (ids o cantidades que no son enteros >= 1, `NaN`…) no
 *   cambian el carrito.
 */

/** Líneas distintas que caben en un carrito: también el máximo de ids que pide la API (`getCartLines`). */
export const CART_MAX_LINES = 50;

/** Una línea del carrito: una presentación (`product_variants.variant_id`) y cuántas unidades. */
export interface CartItem {
    variantId: number;
    quantity: number;
}

/** El carrito: sus líneas en el orden en que se añadieron. */
export type Cart = readonly CartItem[];

/** Entero >= 1: lo único válido como id o cantidad. */
function isPositiveInt(value: number): boolean {
    return Number.isInteger(value) && value >= 1;
}

/** Stock aprovechable: un entero >= 0. Lo que no sea un número (sin dato del servidor) cuenta como 0. */
function usableStock(stock: number | undefined): number {
    return stock !== undefined && Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
}

/**
 * Deja la línea de `variantId` con `wanted` unidades, limitadas al stock. Si no queda ninguna
 * (sin stock), la quita. Si la línea no existía, la añade al final; si ya estaba, conserva su
 * sitio. Devuelve el mismo carrito si no cambia nada.
 */
function withQuantity(cart: Cart, variantId: number, wanted: number, stock: number): Cart {
    const quantity = Math.min(wanted, usableStock(stock));
    if (quantity < 1) return removeItem(cart, variantId);

    const current = cart.find((item) => item.variantId === variantId);
    if (!current) return [...cart, { variantId, quantity }];
    if (current.quantity === quantity) return cart;
    return cart.map((item) => (item === current ? { variantId, quantity } : item));
}

/**
 * Añade unidades de una presentación: las suma a las que ya había y limita el total al stock.
 * Una presentación nueva va al final; una que ya estaba conserva su sitio. Sin stock no se añade
 * (y se quita la línea, si estaba). Con el carrito lleno (`CART_MAX_LINES`), una presentación
 * nueva no entra.
 *
 * @param cart - El carrito actual.
 * @param variantId - Presentación que se añade.
 * @param quantity - Unidades que se añaden (entero >= 1).
 * @param stock - Stock actual de la presentación, tal como lo da el servidor.
 * @returns El carrito con la línea añadida o ampliada.
 *
 * @example
 * addItem([{ variantId: 4, quantity: 2 }], 4, 3, 4);
 * // [{ variantId: 4, quantity: 4 }]: pide 5 en total, pero solo hay 4
 */
export function addItem(cart: Cart, variantId: number, quantity: number, stock: number): Cart {
    if (!isPositiveInt(variantId) || !isPositiveInt(quantity)) return cart;

    const current = cart.find((item) => item.variantId === variantId);
    if (!current && cart.length >= CART_MAX_LINES) return cart;

    return withQuantity(cart, variantId, (current?.quantity ?? 0) + quantity, stock);
}

/**
 * Cambia la cantidad de una línea que ya está en el carrito, limitada al stock. Con una cantidad
 * menor que 1 quita la línea. Si la presentación no está en el carrito no hace nada: para
 * meterla, `addItem`.
 *
 * @param cart - El carrito actual.
 * @param variantId - Presentación de la línea.
 * @param quantity - Cantidad nueva (entero; menor que 1 quita la línea).
 * @param stock - Stock actual de la presentación, tal como lo da el servidor.
 * @returns El carrito con la línea cambiada.
 *
 * @example
 * setQuantity([{ variantId: 4, quantity: 2 }], 4, 9, 6);
 * // [{ variantId: 4, quantity: 6 }]
 */
export function setQuantity(cart: Cart, variantId: number, quantity: number, stock: number): Cart {
    if (!isPositiveInt(variantId) || !Number.isInteger(quantity)) return cart;
    if (!cart.some((item) => item.variantId === variantId)) return cart;
    if (quantity < 1) return removeItem(cart, variantId);

    return withQuantity(cart, variantId, quantity, stock);
}

/**
 * Quita la línea de una presentación. Si no estaba, devuelve el mismo carrito.
 *
 * @param cart - El carrito actual.
 * @param variantId - Presentación que se quita.
 * @returns El carrito sin esa línea.
 *
 * @example
 * removeItem([{ variantId: 4, quantity: 2 }, { variantId: 7, quantity: 1 }], 4);
 * // [{ variantId: 7, quantity: 1 }]
 */
export function removeItem(cart: Cart, variantId: number): Cart {
    return cart.some((item) => item.variantId === variantId)
        ? cart.filter((item) => item.variantId !== variantId)
        : cart;
}

/**
 * Une dos carritos, por ejemplo el de invitado (`localStorage`) y el de la cuenta (`cart_products`)
 * al iniciar sesión. Si una presentación está en los dos, queda la mayor de las dos cantidades y
 * no su suma, así unir un carrito consigo mismo no cambia nada (un carrito ya guardado en la
 * cuenta no duplica sus unidades cada vez que se inicia sesión). Después limita cada línea a su
 * stock.
 *
 * - El orden es el de `first` y, detrás, las líneas nuevas de `second`.
 * - Una presentación sin dato en `stockByVariant` (el servidor ya no la devuelve: bloqueada o
 *   borrada) o sin stock se descarta.
 * - Se queda con las primeras `CART_MAX_LINES` líneas.
 * - Si el resultado es igual a `first`, devuelve el propio `first`.
 *
 * @param first - Un carrito; sus líneas van primero.
 * @param second - El otro carrito.
 * @param stockByVariant - Stock actual por presentación (`variantId` → unidades), del servidor.
 * @returns El carrito unido.
 *
 * @example
 * mergeCarts(
 *     [{ variantId: 4, quantity: 2 }],
 *     [{ variantId: 4, quantity: 3 }, { variantId: 9, quantity: 1 }],
 *     new Map([[4, 10], [9, 0]]),
 * );
 * // [{ variantId: 4, quantity: 3 }]: la 4 se queda con la mayor y la 9 no tiene stock
 */
export function mergeCarts(
    first: Cart,
    second: Cart,
    stockByVariant: ReadonlyMap<number, number>,
): Cart {
    const wanted = new Map<number, number>();
    for (const { variantId, quantity } of [...first, ...second]) {
        if (!isPositiveInt(variantId) || !isPositiveInt(quantity)) continue;
        wanted.set(variantId, Math.max(wanted.get(variantId) ?? 0, quantity));
    }

    const merged: CartItem[] = [];
    for (const [variantId, quantity] of Array.from(wanted)) {
        if (merged.length >= CART_MAX_LINES) break;
        const limited = Math.min(quantity, usableStock(stockByVariant.get(variantId)));
        if (limited >= 1) merged.push({ variantId, quantity: limited });
    }
    // Como el resto de funciones: si no cambia nada, el mismo carrito (el almacén no escribe ni avisa).
    const unchanged =
        merged.length === first.length &&
        merged.every(
            (item, i) =>
                item.variantId === first[i].variantId && item.quantity === first[i].quantity,
        );
    return unchanged ? first : merged;
}
