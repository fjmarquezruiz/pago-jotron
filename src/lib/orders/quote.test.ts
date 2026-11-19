import { describe, expect, it } from 'vitest';
import { quoteOrder, SHIPPING_TAX_RATE, type QuoteLineInput } from './quote';

const wine = (quantity: number, price: string): QuoteLineInput => ({
    quantity,
    price,
    taxRate: '21.00',
});
const raisins = (quantity: number, price: string): QuoteLineInput => ({
    quantity,
    price,
    taxRate: '10.00',
});

describe('quoteOrder', () => {
    it('calcula el ejemplo de la documentación: vino al 21 %, pasas al 10 % y envío', () => {
        expect(quoteOrder([wine(2, '11.50'), raisins(1, '5.50')], '4.95')).toEqual({
            subtotalCents: 2850,
            shippingCents: 495,
            totalCents: 3345,
            vat: [
                { rate: '10.00', grossCents: 550, baseCents: 500, taxCents: 50 },
                { rate: '21.00', grossCents: 2795, baseCents: 2310, taxCents: 485 },
            ],
        });
    });

    it('el precio ya lleva IVA: el total es subtotal + envío, sin sumar el IVA encima', () => {
        const quote = quoteOrder([wine(1, '12.10')], '0.00');
        expect(quote.totalCents).toBe(1210);
        expect(quote.vat).toEqual([
            { rate: '21.00', grossCents: 1210, baseCents: 1000, taxCents: 210 },
        ]);
    });

    it('agrupa por tipo: dos líneas al mismo IVA son una sola fila', () => {
        const { vat } = quoteOrder([wine(1, '10.00'), wine(3, '2.00')], '0.00');
        expect(vat).toHaveLength(1);
        expect(vat[0]).toMatchObject({ rate: '21.00', grossCents: 1600 });
    });

    it('el envío tributa al 21 % y se junta con el vino en la misma fila', () => {
        expect(SHIPPING_TAX_RATE).toBe('21.00');
        const { vat, totalCents } = quoteOrder([wine(1, '10.00')], '4.95');
        expect(vat).toEqual([{ rate: '21.00', grossCents: 1495, baseCents: 1236, taxCents: 259 }]);
        expect(totalCents).toBe(1495);
    });

    it('con solo pasas, el envío abre su propia fila al 21 % y las filas salen de menor a mayor tipo', () => {
        const { vat } = quoteOrder([raisins(2, '5.50')], '4.95');
        expect(vat.map((row) => row.rate)).toEqual(['10.00', '21.00']);
    });

    it('con envío gratis no aparece una fila de IVA vacía', () => {
        const { vat, shippingCents } = quoteOrder([raisins(1, '5.50')], '0.00');
        expect(shippingCents).toBe(0);
        expect(vat.map((row) => row.rate)).toEqual(['10.00']);
    });

    it('un pedido sin líneas solo tiene el envío', () => {
        expect(quoteOrder([], '4.95')).toEqual({
            subtotalCents: 0,
            shippingCents: 495,
            totalCents: 495,
            vat: [{ rate: '21.00', grossCents: 495, baseCents: 409, taxCents: 86 }],
        });
    });

    it('redondea la base al céntimo más cercano, con el medio céntimo hacia arriba', () => {
        // 0,05 € / 1,10 = 4,5454… → 5 céntimos; 0,06 € / 1,21 = 4,9586… → 5; 0,11 € / 1,10 = 10 exacto.
        expect(quoteOrder([raisins(1, '0.05')], '0.00').vat[0]).toMatchObject({
            baseCents: 5,
            taxCents: 0,
        });
        expect(quoteOrder([wine(1, '0.06')], '0.00').vat[0]).toMatchObject({
            baseCents: 5,
            taxCents: 1,
        });
        // Medio céntimo exacto: 0,03 € al 100 % → base 1,5 → 2.
        expect(
            quoteOrder([{ quantity: 1, price: '0.03', taxRate: '100.00' }], '0.00').vat[0],
        ).toMatchObject({
            baseCents: 2,
            taxCents: 1,
        });
    });

    it('no usa decimales de coma flotante: 0,10 € + 0,20 € son 30 céntimos', () => {
        expect(quoteOrder([wine(1, '0.10'), wine(1, '0.20')], '0.00').subtotalCents).toBe(30);
    });

    it('acepta un tipo sin decimales y lo trata igual que el de dos', () => {
        const { vat } = quoteOrder(
            [{ quantity: 1, price: '12.10', taxRate: '21' }, wine(1, '12.10')],
            '0.00',
        );
        expect(vat).toHaveLength(1);
        expect(vat[0].grossCents).toBe(2420);
    });

    it('una fila siempre cuadra: base + cuota = bruto, y las filas suman el total', () => {
        const lines = [wine(7, '13.37'), wine(3, '8.99'), raisins(11, '4.13'), raisins(1, '0.01')];
        for (const shipping of ['0.00', '4.95', '9.95']) {
            const quote = quoteOrder(lines, shipping);
            for (const row of quote.vat) expect(row.baseCents + row.taxCents).toBe(row.grossCents);
            expect(quote.vat.reduce((sum, row) => sum + row.grossCents, 0)).toBe(quote.totalCents);
            expect(quote.totalCents).toBe(quote.subtotalCents + quote.shippingCents);
        }
    });

    it('no modifica las líneas que recibe', () => {
        const lines = [wine(2, '11.50')];
        const copy = structuredClone(lines);
        quoteOrder(lines, '4.95');
        expect(lines).toEqual(copy);
    });

    describe('datos no válidos', () => {
        it.each([0, -1, 1.5, Number.NaN])('rechaza la cantidad %s', (quantity) => {
            expect(() => quoteOrder([wine(quantity, '9.50')], '0.00')).toThrow(RangeError);
        });

        it.each(['', 'abc', '-1', '1.234', '1,50'])('rechaza el precio %j', (price) => {
            expect(() => quoteOrder([wine(1, price)], '0.00')).toThrow(RangeError);
        });

        it.each(['', '-4.95', '4,95', 'gratis'])('rechaza el coste de envío %j', (cost) => {
            expect(() => quoteOrder([], cost)).toThrow(RangeError);
        });

        it.each(['', 'abc', '-21', '100.01', '101', '21.123', '21,00'])(
            'rechaza el IVA %j',
            (taxRate) => {
                expect(() => quoteOrder([{ quantity: 1, price: '9.50', taxRate }], '0.00')).toThrow(
                    RangeError,
                );
            },
        );
    });
});
