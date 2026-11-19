import { createHash } from 'node:crypto';

/** Lo que fija la huella: qué se compra, con qué envío y por cuánto. */
export interface FingerprintInput {
    /** Líneas del carrito del servidor: presentación y cantidad. El orden no importa. */
    lines: readonly { variantId: number; quantity: number }[];
    /** Tipo de envío elegido (`shipping_types.shipping_type_id`). */
    shippingTypeId: number;
    /** Total del presupuesto en céntimos (`quoteOrder`): recoge precios, IVA y coste de envío. */
    totalCents: number;
}

/**
 * Huella del carrito (RF7): un SHA-256 en hexadecimal de las líneas (ordenadas por presentación),
 * el tipo de envío y el total. Va en los `metadata` del PaymentIntent. Cuando se crea el pedido se
 * recalcula con lo que hay entonces y, si no coincide con la de la autorización, se cancela: el
 * cliente nunca paga algo distinto de lo que vio (un precio, un envío o una cantidad que cambió
 * en medio). Son 64 caracteres, dentro del límite de 500 de un valor de `metadata`.
 *
 * @param input - Líneas, tipo de envío y total.
 * @returns La huella, 64 caracteres hexadecimales.
 *
 * @example
 * cartFingerprint({ lines: [{ variantId: 4, quantity: 2 }], shippingTypeId: 1, totalCents: 3345 });
 */
export function cartFingerprint({ lines, shippingTypeId, totalCents }: FingerprintInput): string {
    const sorted = [...lines]
        .sort((a, b) => a.variantId - b.variantId)
        .map(({ variantId, quantity }) => `${variantId}x${quantity}`)
        .join(',');
    return createHash('sha256')
        .update(`lines=${sorted};shipping=${shippingTypeId};total=${totalCents}`)
        .digest('hex');
}
