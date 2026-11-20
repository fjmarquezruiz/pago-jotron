/**
 * Presupuesto de un pedido (RF7) como función pura: subtotal, envío, total y desglose de IVA por
 * tipo. Lo usan el resumen del checkout, el PaymentIntent y el pedido, y los importes salen
 * siempre del servidor (precio y stock de la BD, coste del tipo de envío): el navegador solo
 * manda qué quiere comprar, nunca cuánto cuesta.
 *
 * Todo el dinero va en céntimos enteros, sin decimales de coma flotante. Los precios de las
 * presentaciones y el coste del envío ya llevan el IVA incluido (PVP), así que el IVA no se suma:
 * se extrae de cada importe para el desglose, y `total = subtotal + envío` siempre.
 */
import { lineTotalCents, priceToCents } from '@/lib/cart/totals';

/** IVA de los gastos de envío, en %: el tipo general. No depende del producto. */
export const SHIPPING_TAX_RATE = '21.00';

/** Lo que el presupuesto necesita de una línea: viene de `getCartLines` más la cantidad del carrito. */
export interface QuoteLineInput {
    /** Unidades pedidas (entero >= 1). */
    quantity: number;
    /** Precio unitario en euros con IVA incluido, como texto (`decimal` de Drizzle): `'9.50'`. */
    price: string;
    /** IVA del producto en %, como texto: `typologies.tax_rate`, `'21.00'` o `'10.00'`. */
    taxRate: string;
}

/** Una fila del desglose de IVA: todo lo que tributa a un mismo tipo. */
export interface VatBreakdownRow {
    /** El tipo en %, tal como se guarda (`'21.00'`). */
    rate: string;
    /** Importe con IVA incluido de lo que tributa a este tipo, en céntimos. */
    grossCents: number;
    /** Base imponible, en céntimos. `baseCents + taxCents === grossCents`. */
    baseCents: number;
    /** Cuota de IVA, en céntimos. */
    taxCents: number;
}

/** El presupuesto de un pedido, todo en céntimos. */
export interface OrderQuote {
    /** Suma de las líneas (precio por cantidad), con IVA incluido. */
    subtotalCents: number;
    /** Coste del envío, con IVA incluido. */
    shippingCents: number;
    /** Lo que se cobra: `subtotalCents + shippingCents`. */
    totalCents: number;
    /** Desglose por tipo de IVA, del tipo más bajo al más alto. Suma de bases y cuotas = total. */
    vat: VatBreakdownRow[];
}

/** Tipo de IVA permitido: de 0 a 100 %, con hasta 2 decimales. */
const RATE_PATTERN = /^(\d{1,3})(?:\.(\d{1,2}))?$/;

/**
 * Pasa un tipo de IVA en % (`'21.00'`) a centésimas de punto (`2100`), sin pasar por decimales de
 * coma flotante.
 *
 * @throws {RangeError} Si no es un número de 0 a 100 con hasta 2 decimales.
 */
function rateToHundredths(rate: string): number {
    const match = RATE_PATTERN.exec(rate);
    const hundredths = match
        ? Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
        : NaN;
    if (!(hundredths >= 0 && hundredths <= 10_000)) throw new RangeError(`IVA no válido: ${rate}`);
    return hundredths;
}

/**
 * Base imponible de un importe con IVA incluido: `bruto / (1 + tipo)`, redondeada al céntimo
 * (medio céntimo hacia arriba) con aritmética entera. La cuota es lo que queda, así base y cuota
 * siempre suman el bruto exacto.
 */
function baseCents(grossCents: number, rateHundredths: number): number {
    const divisor = 10_000 + rateHundredths;
    return Math.floor((2 * grossCents * 10_000 + divisor) / (2 * divisor));
}

/**
 * Calcula el presupuesto de un pedido (RF7). El desglose agrupa las líneas por tipo de IVA y
 * redondea una vez por tipo, no por línea: así el desglose cuadra con el total aunque haya muchas
 * líneas. El envío tributa al `SHIPPING_TAX_RATE` y entra en la fila de ese tipo.
 *
 * @param lines - Las líneas del pedido, con el precio y el IVA que da el servidor ahora.
 * @param shippingCost - Coste del tipo de envío elegido en euros, como texto (`shipping_types.cost`).
 * @returns El presupuesto, en céntimos.
 * @throws {RangeError} Si una cantidad no es un entero >= 1, o un precio, un coste o un tipo de
 * IVA no son válidos.
 *
 * @example
 * quoteOrder(
 *     [
 *         { quantity: 2, price: '11.50', taxRate: '21.00' },
 *         { quantity: 1, price: '5.50', taxRate: '10.00' },
 *     ],
 *     '4.95',
 * );
 * // { subtotalCents: 2850, shippingCents: 495, totalCents: 3345, vat: [
 * //     { rate: '10.00', grossCents: 550, baseCents: 500, taxCents: 50 },
 * //     { rate: '21.00', grossCents: 2795, baseCents: 2310, taxCents: 485 } ] }
 */
export function quoteOrder(lines: readonly QuoteLineInput[], shippingCost: string): OrderQuote {
    // Tipo en centésimas → importe bruto de ese tipo, y el texto con el que se guardó el tipo.
    const grossByRate = new Map<number, { rate: string; grossCents: number }>();
    const add = (rate: string, grossCents: number) => {
        const key = rateToHundredths(rate);
        const row = grossByRate.get(key);
        if (row) row.grossCents += grossCents;
        else grossByRate.set(key, { rate, grossCents });
    };

    let subtotalCents = 0;
    for (const { quantity, price, taxRate } of lines) {
        if (!Number.isInteger(quantity) || quantity < 1)
            throw new RangeError(`Cantidad no válida: ${quantity}`);
        const lineCents = lineTotalCents(price, quantity);
        subtotalCents += lineCents;
        add(taxRate, lineCents);
    }

    const shippingCents = priceToCents(shippingCost);
    add(SHIPPING_TAX_RATE, shippingCents);

    const vat = Array.from(grossByRate.entries())
        .sort(([a], [b]) => a - b)
        .filter(([, { grossCents }]) => grossCents > 0)
        .map(([hundredths, { rate, grossCents }]) => {
            const base = baseCents(grossCents, hundredths);
            return { rate, grossCents, baseCents: base, taxCents: grossCents - base };
        });

    return { subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents, vat };
}
