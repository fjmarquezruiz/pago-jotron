import { describe, expect, it } from 'vitest';
import { formatEuros, slugify } from './utils';

describe('formatEuros', () => {
    // El espacio antes del € es un espacio duro (U+00A0).
    it.each([
        [18.5, '18,50 €'],
        ['18.50', '18,50 €'],
        [0, '0,00 €'],
        [12, '12,00 €'],
        [0.005, '0,01 €'],
        [12345.6, '12.345,60 €'],
        [-3, '-3,00 €'],
    ] as const)('%j → %j', (amount, expected) => {
        expect(formatEuros(amount)).toBe(expected);
    });

    it.each(['abc', '', NaN, Infinity])('lanza error con %j', (amount) => {
        expect(() => formatEuros(amount)).toThrow(RangeError);
    });
});

describe('slugify', () => {
    it.each([
        ['Tinto Roble 2022', 'tinto-roble-2022'],
        ['tinto-roble-2022', 'tinto-roble-2022'],
        ['jotron-tinto-roble', 'jotron-tinto-roble'],
        ['Pago de Jotrón', 'pago-de-jotron'],
        ['Moscatel Añejo', 'moscatel-anejo'],
        ['Fino   _  Manzanilla', 'fino-manzanilla'],
        ['  --Solear--  ', 'solear'],
        ['???', ''],
        ['', ''],
    ] as const)('%j → %j', (text, expected) => {
        expect(slugify(text)).toBe(expected);
    });
});
