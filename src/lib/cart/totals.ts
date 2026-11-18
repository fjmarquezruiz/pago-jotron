/**
 * Totales del carrito (RF6) como funciones puras. El dinero se calcula en céntimos enteros, nunca
 * con decimales de coma flotante: el precio llega como texto (`'9.50'`, un `decimal` de Drizzle) y
 * se parsea sin pasar por `Number` con decimales, así `0.1 + 0.2` no aparece en un total.
 *
 * El carrito no guarda el precio: los totales salen del precio que el servidor da ahora para cada
 * línea (`getCartLines`).
 */
import { formatEuros } from '@/lib/utils';
import type { Cart } from './cart';

/** Importe permitido: enteros y, opcionalmente, un punto con uno o dos decimales. Sin signo ni coma. */
const PRICE_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Cuenta las unidades del carrito: la suma de las cantidades de todas sus líneas (no el número de
 * líneas).
 *
 * @param cart - El carrito.
 * @returns Las unidades, o 0 si el carrito está vacío.
 *
 * @example
 * cartUnits([{ variantId: 4, quantity: 2 }, { variantId: 7, quantity: 3 }]); // 5
 */
export function cartUnits(cart: Cart): number {
    return cart.reduce((units, { quantity }) => units + quantity, 0);
}

/**
 * Pasa un precio en euros, tal como llega de la BD, a céntimos enteros. Parsea el texto, sin
 * operar con decimales de coma flotante.
 *
 * @param price - Importe decimal no negativo, con hasta 2 decimales y punto decimal (`'9.5'`, `'12'`).
 * @returns Los céntimos.
 * @throws {RangeError} Si no es un decimal no negativo con hasta 2 decimales (`''`, `'abc'`,
 * `'-1'`, `'1.234'`, `'1,50'`), o si es tan grande que no cabe en un entero seguro.
 *
 * @example
 * priceToCents('9.50'); // 950
 */
export function priceToCents(price: string): number {
    const match = PRICE_PATTERN.exec(price);
    if (!match) throw new RangeError(`Importe no válido: ${price}`);

    const [, euros, decimals = ''] = match;
    const cents = Number(euros) * 100 + Number(decimals.padEnd(2, '0'));
    if (!Number.isSafeInteger(cents)) throw new RangeError(`Importe no válido: ${price}`);
    return cents;
}

/**
 * Total de una línea: precio unitario por unidades, en céntimos.
 *
 * @param price - Precio unitario en euros, como texto (`'9.50'`).
 * @param quantity - Unidades de la línea.
 * @returns El total de la línea, en céntimos.
 * @throws {RangeError} Si el precio no es válido (ver `priceToCents`).
 *
 * @example
 * lineTotalCents('9.50', 3); // 2850
 */
export function lineTotalCents(price: string, quantity: number): number {
    return priceToCents(price) * quantity;
}

/**
 * Subtotal del carrito: la suma del total de cada línea, en céntimos. Una línea del carrito que no
 * está en `lines` (el servidor ya no la devuelve) no cuenta.
 *
 * @param cart - El carrito.
 * @param lines - El precio actual de cada presentación, tal como lo da el servidor.
 * @returns El subtotal, en céntimos (0 si no hay nada que sumar).
 * @throws {RangeError} Si el precio de una línea que se suma no es válido.
 *
 * @example
 * cartSubtotalCents(
 *     [{ variantId: 4, quantity: 2 }, { variantId: 9, quantity: 1 }],
 *     [{ variantId: 4, price: '18.50' }],
 * );
 * // 3700: la 9 no está en `lines`
 */
export function cartSubtotalCents(
    cart: Cart,
    lines: readonly { variantId: number; price: string }[],
): number {
    const priceByVariant = new Map(lines.map(({ variantId, price }) => [variantId, price]));
    return cart.reduce((total, { variantId, quantity }) => {
        const price = priceByVariant.get(variantId);
        return price === undefined ? total : total + lineTotalCents(price, quantity);
    }, 0);
}

/**
 * Da formato de euros en español a un importe en céntimos.
 *
 * @param cents - Importe en céntimos.
 * @returns El importe formateado, con espacio duro antes del símbolo.
 *
 * @example
 * formatCents(4690); // '46,90 €'
 */
export function formatCents(cents: number): string {
    return formatEuros(cents / 100);
}

/**
 * Cuenta de artículos para el icono o el resumen del carrito.
 *
 * @param units - Unidades del carrito.
 * @returns `'1 artículo'` en singular y `'N artículos'` en cualquier otro caso (también 0).
 *
 * @example
 * formatItemCount(3); // '3 artículos'
 */
export function formatItemCount(units: number): string {
    return `${units} ${units === 1 ? 'artículo' : 'artículos'}`;
}
