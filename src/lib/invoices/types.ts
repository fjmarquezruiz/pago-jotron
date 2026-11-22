import type { VatBreakdownRow } from '@/lib/orders/quote';

/**
 * Tipo de factura (Real Decreto 1619/2012): la completa lleva los datos del destinatario; la
 * simplificada solo se puede emitir hasta 400 € (IVA incluido) y no necesita su NIF.
 */
export type InvoiceKind = 'Completa' | 'Simplificada';

/** Datos fiscales del emisor (la tienda), copiados al emitir: un cambio de domicilio no altera facturas ya emitidas. */
export interface InvoiceIssuer {
    /** Nombre o razón social. */
    name: string;
    /** NIF o CIF. */
    taxId: string;
    /** Domicilio fiscal en una línea. */
    address: string;
}

/** Una línea de la factura: un producto del pedido, con el precio y el IVA que tenía al comprarlo. */
export interface InvoiceLine {
    /** Nombre del producto con su añada y presentación, tal como estaba al emitir la factura. */
    description: string;
    quantity: number;
    /** Precio unitario con IVA incluido, en céntimos. */
    unitPriceCents: number;
    /** Importe de la línea con IVA incluido: `unitPriceCents × quantity`. */
    totalCents: number;
    /** IVA de la línea en %, como texto (`'21.00'`). */
    taxRate: string;
}

/** Datos del destinatario, copiados al emitir: cambiar después el perfil no altera la factura. */
export interface InvoiceRecipient {
    name: string;
    /** NIF/NIE/CIF (`users.id_card`); `null` si no lo dio. */
    taxId: string | null;
    /** Dirección de facturación en una línea; `null` si el pedido no la tiene. */
    address: string | null;
}

/**
 * Todo lo que enseña una factura, congelado al emitirla (`invoices.snapshot`): el PDF sale de aquí
 * y no de los datos vivos (nombre del producto, perfil o dirección pueden cambiar después, la
 * factura no). Los importes van en céntimos.
 */
export interface InvoiceDocument {
    /** `F-2026-0001`. */
    number: string;
    kind: InvoiceKind;
    /** Fecha de expedición: `datetime` de la BD (`AAAA-MM-DD HH:MM:SS`, UTC). Es también la de la operación. */
    issueDate: string;
    /** Número de pedido que ve el cliente (`PJ-12`). */
    orderNumber: string;
    /** El emisor tal como era al emitir la factura. */
    issuer: InvoiceIssuer;
    recipient: InvoiceRecipient;
    lines: InvoiceLine[];
    /** Gastos de envío con IVA incluido, o `null` si no hubo (recogida en bodega, gratis). */
    shipping: { description: string; cents: number; taxRate: string } | null;
    /** Desglose por tipo de IVA (base y cuota), de `quoteOrder`. */
    vat: VatBreakdownRow[];
    /** Suma de bases imponibles, en céntimos. */
    taxBaseCents: number;
    /** Suma de cuotas de IVA, en céntimos. */
    taxAmountCents: number;
    /** Total de la factura con IVA incluido, en céntimos: `taxBaseCents + taxAmountCents`. */
    totalCents: number;
}
