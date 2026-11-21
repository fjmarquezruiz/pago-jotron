import { describe, expect, it } from 'vitest';
import { invoiceTitle, renderInvoicePdf } from './pdf';
import type { InvoiceDocument } from './types';

const issuer = {
    name: 'Bodegas Jotrón S.L.',
    taxId: 'B12345678',
    address: 'Calle Larios 1, 29005 Málaga',
};

// 2 x 11,50 (21 %) + 1 x 5,50 (10 %) + envío 4,95 (21 %) = 33,45
const complete: InvoiceDocument = {
    number: 'F-2026-0001',
    kind: 'Completa',
    issueDate: '2026-10-15 07:12:00',
    orderNumber: 'PJ-12',
    recipient: {
        name: 'Juan Moreno Ñandú',
        taxId: '12345678Z',
        address: 'Calle Alcalá 12, 28014 Madrid',
    },
    lines: [
        {
            description: 'Jotrón Tinto Roble 2021 · Botella 75 cl',
            quantity: 2,
            unitPriceCents: 1150,
            totalCents: 2300,
            taxRate: '21.00',
        },
        {
            description: 'Moscatel Dulce · Botella 50 cl',
            quantity: 1,
            unitPriceCents: 550,
            totalCents: 550,
            taxRate: '10.00',
        },
    ],
    shipping: { description: 'Envío estándar', cents: 495, taxRate: '21.00' },
    vat: [
        { rate: '10.00', grossCents: 550, baseCents: 500, taxCents: 50 },
        { rate: '21.00', grossCents: 2795, baseCents: 2310, taxCents: 485 },
    ],
    taxBaseCents: 2810,
    taxAmountCents: 535,
    totalCents: 3345,
};

const simplified: InvoiceDocument = {
    ...complete,
    number: 'F-2026-0002',
    kind: 'Simplificada',
    recipient: { name: '', taxId: null, address: null },
    shipping: null,
};

/** El PDF comprime el contenido: se mira que sea un PDF y que no esté vacío. */
const isPdf = (buffer: Buffer) => buffer.subarray(0, 5).toString('latin1') === '%PDF-';

describe('renderInvoicePdf', () => {
    it('genera un PDF para una factura completa', async () => {
        const pdf = await renderInvoicePdf(complete, issuer);
        expect(isPdf(pdf)).toBe(true);
        expect(pdf.length).toBeGreaterThan(1_000);
    });

    it('genera un PDF para una factura simplificada, sin destinatario ni envío', async () => {
        const pdf = await renderInvoicePdf(simplified, issuer);
        expect(isPdf(pdf)).toBe(true);
    });

    it('con muchas líneas pasa a más de una página sin fallar', async () => {
        const many: InvoiceDocument = {
            ...complete,
            lines: Array.from({ length: 80 }, (_, i) => ({
                description: `Producto ${i + 1}`,
                quantity: 1,
                unitPriceCents: 1000,
                totalCents: 1000,
                taxRate: '21.00',
            })),
        };
        const pdf = await renderInvoicePdf(many, issuer);
        expect(isPdf(pdf)).toBe(true);
        expect((pdf.toString('latin1').match(/\/Type \/Page[^s]/g) ?? []).length).toBeGreaterThan(
            1,
        );
    });
}, 30_000);

describe('invoiceTitle', () => {
    it('distingue la factura completa de la simplificada', () => {
        expect(invoiceTitle('Completa')).toBe('Factura');
        expect(invoiceTitle('Simplificada')).toBe('Factura simplificada');
    });
});
