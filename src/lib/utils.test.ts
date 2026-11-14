import { describe, expect, it } from 'vitest';
import { slugify } from './utils';

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
