import type { InvoiceKind } from './types';

/** Tope de una factura simplificada: 400 € con IVA incluido (RD 1619/2012, art. 4), en céntimos. */
export const SIMPLIFIED_LIMIT_CENTS = 40_000;

/**
 * Qué factura toca: completa si el cliente dio su NIF o si el total pasa de 400 €, y simplificada
 * si no hay NIF y el total no pasa de 400 €. Los 400 € exactos caben en una simplificada.
 *
 * Un pedido de más de 400 € sin NIF sale como factura completa con el nombre y la dirección del
 * cliente: el NIF solo es obligatorio cuando el destinatario es empresario o profesional.
 *
 * @param input.taxId - NIF/NIE/CIF del cliente (`users.id_card`); vacío o `null` si no lo dio.
 * @param input.totalCents - Total del pedido con IVA incluido, en céntimos.
 *
 * @example
 * invoiceKind({ taxId: null, totalCents: 40_000 }); // 'Simplificada'
 * invoiceKind({ taxId: '12345678Z', totalCents: 1_000 }); // 'Completa'
 */
export function invoiceKind({
    taxId,
    totalCents,
}: {
    taxId: string | null;
    totalCents: number;
}): InvoiceKind {
    const hasTaxId = taxId !== null && taxId.trim() !== '';
    return hasTaxId || totalCents > SIMPLIFIED_LIMIT_CENTS ? 'Completa' : 'Simplificada';
}
