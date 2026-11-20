import { describe, expect, it } from 'vitest';
import { centsToDecimal, orderNumber } from './format';

describe('orderNumber', () => {
    it('es PJ- y el id', () => {
        expect(orderNumber(12)).toBe('PJ-12');
    });
});

describe('centsToDecimal', () => {
    it.each([
        [0, '0.00'],
        [5, '0.05'],
        [50, '0.50'],
        [100, '1.00'],
        [3345, '33.45'],
        [1_000_000_01, '1000000.01'],
    ])('%i céntimos son %s', (cents, text) => {
        expect(centsToDecimal(cents)).toBe(text);
    });

    it.each([-1, 1.5, Number.NaN, Infinity])('rechaza %s', (cents) => {
        expect(() => centsToDecimal(cents)).toThrow(RangeError);
    });
});
