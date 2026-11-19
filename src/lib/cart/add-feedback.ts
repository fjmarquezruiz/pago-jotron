import { CART_MAX_LINES } from '@/lib/cart/cart';

/** El aviso que sigue a pulsar "Añadir al carrito". */
export interface AddFeedback {
    /** `success` si entró todo lo pedido; `warning` si el stock lo ha limitado. */
    type: 'success' | 'warning';
    message: string;
}

/**
 * Qué decir tras añadir unidades al carrito. El stock puede haber limitado la cantidad
 * (`addItem`): se compara lo que había antes con lo que hay ahora.
 *
 * @param params.requested - Unidades que pidió el cliente.
 * @param params.before - Unidades de esa presentación que había ya en el carrito.
 * @param params.after - Unidades que hay ahora.
 * @param params.cartIsFull - Si el carrito está lleno de líneas: entonces no entrar no es por falta de stock.
 * @returns El tipo de aviso y su texto.
 *
 * @example
 * describeAdd({ requested: 3, before: 2, after: 4 });
 * // { type: 'warning', message: 'Hemos añadido 2 unidades: es todo lo que queda.' }
 */
export function describeAdd({
    requested,
    before,
    after,
    cartIsFull = false,
}: {
    requested: number;
    before: number;
    after: number;
    /** `true` si el carrito ya tiene `CART_MAX_LINES` líneas: una presentación nueva no entra. */
    cartIsFull?: boolean;
}): AddFeedback {
    const added = after - before;
    if (added >= requested) return { type: 'success', message: 'Añadido al carrito' };
    if (added <= 0 && before === 0 && cartIsFull) {
        return {
            type: 'warning',
            message: `Tu carrito está lleno: puedes tener como máximo ${CART_MAX_LINES} productos distintos.`,
        };
    }
    if (added <= 0) {
        return {
            type: 'warning',
            message: 'Ya tienes en el carrito todas las unidades que quedan.',
        };
    }
    return {
        type: 'warning',
        message: `Hemos añadido ${added} ${added === 1 ? 'unidad' : 'unidades'}: es todo lo que queda.`,
    };
}
