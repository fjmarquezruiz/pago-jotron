import { beforeEach, describe, expect, it, vi } from 'vitest';

const tx = { tx: true };
const reserveInvoiceSequence = vi.fn();
const insertInvoiceQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    reserveInvoiceSequence: (...a: unknown[]) => reserveInvoiceSequence(...a),
    insertInvoiceQuery: (...a: unknown[]) => insertInvoiceQuery(...a),
}));

import type { InvoiceSource } from './build';
import { issueInvoice } from './issue';

// 2 x 11.50 (21 %) + envío 4.95 = 27.95
const source: InvoiceSource = {
    orderId: 12,
    user: { name: 'Juan', lastName: 'Moreno', idCard: '12345678Z' },
    billingAddress: null,
    shippingCost: '4.95',
    shippingName: 'Envío estándar',
    lines: [
        {
            name: 'Tinto Roble',
            vintage: null,
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            quantity: 2,
            unitPrice: '11.50',
            taxRate: '21.00',
        },
    ],
};

const issuer = {
    name: 'Bodegas Jotrón S.L.',
    taxId: 'B12345678',
    address: 'Calle Larios 1, 29005 Málaga',
};

beforeEach(() => {
    reserveInvoiceSequence.mockReset().mockResolvedValue(7);
    insertInvoiceQuery.mockReset().mockResolvedValue(undefined);
});

describe('issueInvoice', () => {
    it('reserva el número del año en la misma transacción y lo guarda con sus importes', async () => {
        const number = await issueInvoice(
            tx as never,
            source,
            issuer,
            new Date('2026-11-21T10:00:00Z'),
        );

        expect(number).toBe('F-2026-0007');
        expect(reserveInvoiceSequence).toHaveBeenCalledWith(tx, 2026);
        expect(insertInvoiceQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({
                orderId: 12,
                number: 'F-2026-0007',
                issueDate: '2026-11-21 10:00:00',
                taxBase: '23.10',
                taxAmount: '4.85',
                total: '27.95',
                kind: 'Completa',
            }),
        );
    });

    it('guarda una copia congelada del documento con el mismo número', async () => {
        await issueInvoice(tx as never, source, issuer, new Date('2026-11-21T10:00:00Z'));
        const saved = insertInvoiceQuery.mock.calls[0][1];
        expect(saved.snapshot).toMatchObject({
            number: 'F-2026-0007',
            orderNumber: 'PJ-12',
            totalCents: 2795,
        });
        expect(saved.taxBase).toBe('23.10');
    });

    it('el emisor queda dentro de la copia congelada, tal como era al emitir', async () => {
        await issueInvoice(tx as never, source, issuer, new Date('2026-11-21T10:00:00Z'));
        expect(insertInvoiceQuery.mock.calls[0][1].snapshot.issuer).toEqual(issuer);
    });

    it('la base y la cuota suman el total (lo exige invoices.ck_invoice_total)', async () => {
        await issueInvoice(tx as never, source, issuer);
        const { taxBase, taxAmount, total } = insertInvoiceQuery.mock.calls[0][1];
        expect(Math.round((Number(taxBase) + Number(taxAmount)) * 100)).toBe(
            Math.round(Number(total) * 100),
        );
    });

    it('el año de la serie es el de Madrid: el 1 de enero de madrugada ya es el año nuevo', async () => {
        await issueInvoice(tx as never, source, issuer, new Date('2026-12-31T23:30:00Z'));
        expect(reserveInvoiceSequence).toHaveBeenCalledWith(tx, 2027);
        expect(insertInvoiceQuery.mock.calls[0][1].number).toBe('F-2027-0007');
    });

    it('si no se puede montar el documento, no inserta nada', async () => {
        await expect(
            issueInvoice(
                tx as never,
                {
                    ...source,
                    user: { name: null, lastName: null, idCard: '12345678Z' },
                },
                issuer,
                new Date(),
            ),
        ).rejects.toThrow('Falta el nombre del destinatario');
        expect(insertInvoiceQuery).not.toHaveBeenCalled();
    });

    it('si la inserción falla, el error sube para que se deshaga la transacción entera', async () => {
        insertInvoiceQuery.mockRejectedValue(new Error('duplicate'));
        await expect(issueInvoice(tx as never, source, issuer)).rejects.toThrow('duplicate');
    });
});
