import { describe, expect, it } from 'vitest';
import { formatInvoiceNumber, invoiceYear } from './number';

describe('formatInvoiceNumber', () => {
    it('rellena el orden a cuatro cifras', () => {
        expect(formatInvoiceNumber(2026, 1)).toBe('F-2026-0001');
        expect(formatInvoiceNumber(2026, 42)).toBe('F-2026-0042');
        expect(formatInvoiceNumber(2027, 9999)).toBe('F-2027-9999');
    });

    it('pasa de cuatro cifras sin cortar el número', () => {
        expect(formatInvoiceNumber(2026, 12345)).toBe('F-2026-12345');
    });

    it.each([0, -1, 1.5, NaN])('rechaza el orden %s', (sequence) => {
        expect(() => formatInvoiceNumber(2026, sequence)).toThrow(RangeError);
    });

    it.each([999, 10000, 2026.5, NaN])('rechaza el año %s', (year) => {
        expect(() => formatInvoiceNumber(year, 1)).toThrow(RangeError);
    });
});

describe('invoiceYear', () => {
    it('es el año de la hora de Madrid, no el de UTC', () => {
        // 31 dic 2026, 23:30 UTC = 1 ene 2027, 00:30 en Madrid.
        expect(invoiceYear(new Date('2026-12-31T23:30:00Z'))).toBe(2027);
        // 31 dic 2026, 22:30 UTC = 23:30 en Madrid: sigue en 2026.
        expect(invoiceYear(new Date('2026-12-31T22:30:00Z'))).toBe(2026);
        expect(invoiceYear(new Date('2026-07-01T12:00:00Z'))).toBe(2026);
    });
});
