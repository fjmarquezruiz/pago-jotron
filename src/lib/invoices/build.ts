import { lineLabel } from '@/lib/checkout/confirmation';
import { lineTotalCents, priceToCents } from '@/lib/cart/totals';
import { orderNumber } from '@/lib/orders/format';
import { quoteOrder, SHIPPING_TAX_RATE } from '@/lib/orders/quote';
import { invoiceKind } from './kind';
import type { InvoiceDocument, InvoiceIssuer } from './types';

/** Una línea del pedido tal como la guarda `order_products` más los datos del producto. */
export interface InvoiceSourceLine {
    name: string;
    vintage: number | null;
    format: string;
    capacity: number;
    capacityUnit: 'ml' | 'g';
    quantity: number;
    /** Precio unitario guardado en el pedido (con IVA incluido), como texto: `'11.50'`. */
    unitPrice: string;
    /** IVA guardado en el pedido, en %: `'21.00'`. */
    taxRate: string;
}

/** Dirección de facturación del pedido. */
export interface InvoiceSourceAddress {
    recipientName: string | null;
    streetType: string | null;
    streetName: string | null;
    number: string | null;
    floor: string | null;
    postalCode: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
}

/** Todo lo que hace falta para emitir la factura de un pedido, leído de la BD. */
export interface InvoiceSource {
    orderId: number;
    user: { name: string | null; lastName: string | null; idCard: string | null };
    billingAddress: InvoiceSourceAddress | null;
    /** Coste de envío guardado en el pedido (con IVA incluido), como texto. */
    shippingCost: string;
    shippingName: string;
    lines: InvoiceSourceLine[];
}

/** Dirección en una línea: `Calle Larios 12, 2º, 28014 Madrid, Madrid, España`. */
export function addressLine(address: InvoiceSourceAddress): string {
    const street = [address.streetType, address.streetName, address.number]
        .filter(Boolean)
        .join(' ');
    const place = [address.postalCode, address.city].filter(Boolean).join(' ');
    return [street, address.floor, place, address.province, address.country]
        .filter((part) => part && part.trim() !== '')
        .join(', ');
}

/**
 * Monta lo que enseña la factura de un pedido, listo para guardarse como `invoices.snapshot`. El
 * desglose de IVA sale de `quoteOrder` con los precios y el IVA GUARDADOS en el pedido (no los
 * vigentes), así que base, cuota y total cuadran con lo que se cobró.
 *
 * El destinatario es el cliente (nombre y apellidos; si no los tiene, el nombre de la dirección de
 * facturación), con su NIF si lo dio. La factura es completa o simplificada según `invoiceKind`.
 *
 * @param source - El pedido (`getInvoiceSource`).
 * @param input.number - Número de factura ya reservado (`F-2026-0001`).
 * @param input.issueDate - Fecha de expedición, como `datetime` de la BD (UTC).
 * @param input.issuer - Datos fiscales de la tienda en este momento: quedan dentro de la factura.
 * @returns El documento de la factura.
 * @throws {Error} Si es una factura completa y no consta el nombre del destinatario.
 */
export function buildInvoiceDocument(
    source: InvoiceSource,
    { number, issueDate, issuer }: { number: string; issueDate: string; issuer: InvoiceIssuer },
): InvoiceDocument {
    const quote = quoteOrder(
        source.lines.map(({ quantity, unitPrice, taxRate }) => ({
            quantity,
            price: unitPrice,
            taxRate,
        })),
        source.shippingCost,
    );

    const taxId = source.user.idCard?.trim() || null;
    const kind = invoiceKind({ taxId, totalCents: quote.totalCents });
    const name =
        [source.user.name, source.user.lastName]
            .filter((part) => part && part.trim() !== '')
            .join(' ') ||
        source.billingAddress?.recipientName?.trim() ||
        '';
    if (kind === 'Completa' && name === '')
        throw new Error(
            `Falta el nombre del destinatario de la factura del pedido ${source.orderId}`,
        );

    const taxBaseCents = quote.vat.reduce((sum, row) => sum + row.baseCents, 0);
    const taxAmountCents = quote.vat.reduce((sum, row) => sum + row.taxCents, 0);

    return {
        number,
        kind,
        issueDate,
        orderNumber: orderNumber(source.orderId),
        issuer: { ...issuer },
        recipient: {
            name,
            taxId,
            address: source.billingAddress ? addressLine(source.billingAddress) || null : null,
        },
        lines: source.lines.map((line) => ({
            description: line.vintage ? `${lineLabel(line)} ${line.vintage}` : lineLabel(line),
            quantity: line.quantity,
            unitPriceCents: priceToCents(line.unitPrice),
            totalCents: lineTotalCents(line.unitPrice, line.quantity),
            taxRate: line.taxRate,
        })),
        shipping:
            quote.shippingCents > 0
                ? {
                      description: `Envío: ${source.shippingName}`,
                      cents: quote.shippingCents,
                      taxRate: SHIPPING_TAX_RATE,
                  }
                : null,
        vat: quote.vat,
        taxBaseCents,
        taxAmountCents,
        totalCents: quote.totalCents,
    };
}
