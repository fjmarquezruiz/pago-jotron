/** Prefijo del número de pedido que ve el cliente. */
const ORDER_NUMBER_PREFIX = 'PJ-';

/**
 * Número de pedido que se muestra al cliente: `PJ-` y el id del pedido (`PJ-12`). No hay columna
 * propia: se deriva del id, así que nunca se desincroniza.
 *
 * @param orderId - `orders.order_id`.
 * @returns Por ejemplo `'PJ-12'`.
 */
export function orderNumber(orderId: number): string {
    return `${ORDER_NUMBER_PREFIX}${orderId}`;
}

/**
 * Pasa un importe en céntimos enteros a texto decimal con 2 decimales (`3345` → `'33.45'`), el
 * formato de las columnas `decimal` de MySQL, sin pasar por decimales de coma flotante.
 *
 * @param cents - Céntimos: entero >= 0.
 * @returns El importe en euros, como texto.
 * @throws {RangeError} Si no es un entero seguro >= 0.
 *
 * @example
 * centsToDecimal(5); // '0.05'
 */
export function centsToDecimal(cents: number): string {
    if (!Number.isSafeInteger(cents) || cents < 0)
        throw new RangeError(`Importe no válido: ${cents}`);
    return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
