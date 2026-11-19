import type { Cart } from '@/lib/cart/cart';

/** Una línea del carrito que no se puede servir tal cual está. */
export interface StockProblem {
    variantId: number;
    /** Unidades que quedan: 0 si está agotada o ya no se vende. */
    available: number;
}

/**
 * Líneas del carrito que no se pueden servir (RF7): presentaciones que ya no se venden (no
 * vuelven de `getCartLines`), agotadas o con menos stock del que se pide. Se comprueba antes de
 * autorizar el pago, para no reservar dinero de un pedido que no se va a poder crear. El stock
 * se vuelve a comprobar, ya con el descuento atómico, al crear el pedido: entre una cosa y otra
 * otro cliente puede comprar.
 *
 * @param items - El carrito del cliente en la BD.
 * @param lines - Las líneas vigentes de esas presentaciones (`getCartLines`).
 * @returns Los problemas, en el orden del carrito; vacío si todo se puede servir.
 *
 * @example
 * findStockProblems([{ variantId: 4, quantity: 5 }], [{ variantId: 4, stock: 2 }]);
 * // [{ variantId: 4, available: 2 }]
 */
export function findStockProblems(
    items: Cart,
    lines: readonly { variantId: number; stock: number }[],
): StockProblem[] {
    const stock = new Map(lines.map(({ variantId, stock: units }) => [variantId, units]));
    const problems: StockProblem[] = [];
    for (const { variantId, quantity } of items) {
        const available = stock.get(variantId) ?? 0;
        if (available < quantity) problems.push({ variantId, available });
    }
    return problems;
}
