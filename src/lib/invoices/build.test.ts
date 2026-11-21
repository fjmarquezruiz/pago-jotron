import { describe, expect, it } from 'vitest';
import { addressLine, buildInvoiceDocument, type InvoiceSource } from './build';

// 2 x 11.50 (21 %) + 1 x 5.50 (10 %) + envío 4.95 (21 %) = 33.45
const source: InvoiceSource = {
    orderId: 12,
    user: { name: 'Juan', lastName: 'Moreno', idCard: '12345678Z' },
    billingAddress: {
        recipientName: 'Juan Moreno',
        streetType: 'Calle',
        streetName: 'Larios',
        number: '12',
        floor: '2º',
        postalCode: '29005',
        city: 'Málaga',
        province: 'Málaga',
        country: 'España',
    },
    shippingCost: '4.95',
    shippingName: 'Envío estándar',
    lines: [
        {
            name: 'Tinto Roble',
            vintage: 2020,
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            quantity: 2,
            unitPrice: '11.50',
            taxRate: '21.00',
        },
        {
            name: 'Dulce',
            vintage: null,
            format: 'Botella',
            capacity: 500,
            capacityUnit: 'ml',
            quantity: 1,
            unitPrice: '5.50',
            taxRate: '10.00',
        },
    ],
};
const input = { number: 'F-2026-0007', issueDate: '2026-11-21 10:00:00' };

describe('buildInvoiceDocument', () => {
    const doc = buildInvoiceDocument(source, input);

    it('lleva número, fecha, pedido y tipo', () => {
        expect(doc).toMatchObject({
            number: 'F-2026-0007',
            issueDate: '2026-11-21 10:00:00',
            orderNumber: 'PJ-12',
            kind: 'Completa',
        });
    });

    it('el desglose de IVA sale del precio guardado y cuadra con el total cobrado', () => {
        expect(doc.totalCents).toBe(3345);
        expect(doc.taxBaseCents + doc.taxAmountCents).toBe(doc.totalCents);
        expect(doc.vat).toEqual([
            { rate: '10.00', grossCents: 550, baseCents: 500, taxCents: 50 },
            { rate: '21.00', grossCents: 2795, baseCents: 2310, taxCents: 485 },
        ]);
        expect(doc.taxBaseCents).toBe(2810);
        expect(doc.taxAmountCents).toBe(535);
    });

    it('las líneas llevan descripción con la añada, el precio unitario y el importe', () => {
        expect(doc.lines).toEqual([
            {
                description: 'Tinto Roble (Botella 75 cl) 2020',
                quantity: 2,
                unitPriceCents: 1150,
                totalCents: 2300,
                taxRate: '21.00',
            },
            {
                description: 'Dulce (Botella 50 cl)',
                quantity: 1,
                unitPriceCents: 550,
                totalCents: 550,
                taxRate: '10.00',
            },
        ]);
    });

    it('el envío es una línea aparte al 21 %, y no hay si es gratis', () => {
        expect(doc.shipping).toEqual({
            description: 'Envío: Envío estándar',
            cents: 495,
            taxRate: '21.00',
        });
        expect(
            buildInvoiceDocument({ ...source, shippingCost: '0.00' }, input).shipping,
        ).toBeNull();
    });

    it('copia el destinatario: nombre, NIF y dirección en una línea', () => {
        expect(doc.recipient).toEqual({
            name: 'Juan Moreno',
            taxId: '12345678Z',
            address: 'Calle Larios 12, 2º, 29005 Málaga, Málaga, España',
        });
    });

    it('sin NIF y hasta 400 € es simplificada', () => {
        const simplified = buildInvoiceDocument(
            { ...source, user: { ...source.user, idCard: null } },
            input,
        );
        expect(simplified.kind).toBe('Simplificada');
        expect(simplified.recipient.taxId).toBeNull();
    });

    it('sin NIF pero con más de 400 € es completa', () => {
        const big = buildInvoiceDocument(
            {
                ...source,
                user: { ...source.user, idCard: null },
                lines: [{ ...source.lines[0], quantity: 40 }],
            },
            input,
        );
        expect(big.kind).toBe('Completa');
    });

    it('sin nombre en el perfil usa el de la dirección de facturación', () => {
        const noName = buildInvoiceDocument(
            { ...source, user: { name: null, lastName: null, idCard: '12345678Z' } },
            input,
        );
        expect(noName.recipient.name).toBe('Juan Moreno');
    });

    it('una factura completa sin ningún nombre no se puede emitir', () => {
        expect(() =>
            buildInvoiceDocument(
                {
                    ...source,
                    user: { name: null, lastName: null, idCard: '12345678Z' },
                    billingAddress: null,
                },
                input,
            ),
        ).toThrow('Falta el nombre del destinatario');
    });

    it('una simplificada sin nombre ni dirección sí se emite', () => {
        const simplified = buildInvoiceDocument(
            {
                ...source,
                user: { name: null, lastName: null, idCard: null },
                billingAddress: null,
            },
            input,
        );
        expect(simplified).toMatchObject({
            kind: 'Simplificada',
            recipient: { name: '', taxId: null, address: null },
        });
    });
});

describe('addressLine', () => {
    it('salta las partes que faltan', () => {
        expect(
            addressLine({
                recipientName: null,
                streetType: 'Calle',
                streetName: 'Larios',
                number: '5',
                floor: null,
                postalCode: '29005',
                city: 'Málaga',
                province: null,
                country: 'España',
            }),
        ).toBe('Calle Larios 5, 29005 Málaga, España');
    });
});
