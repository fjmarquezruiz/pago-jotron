import { describe, expect, it } from 'vitest';
import { toVintageOptions } from './filter-options';

describe('toVintageOptions', () => {
    it.each([
        [[], []],
        [[2023], [{ id: 2023, name: '2023' }]],
        [
            [2025, 2023, 2022],
            [
                { id: 2025, name: '2025' },
                { id: 2023, name: '2023' },
                { id: 2022, name: '2022' },
            ],
        ],
        [[null], []], // sin añada: no es una opción
        [
            [2025, null, 2022, null],
            [
                { id: 2025, name: '2025' },
                { id: 2022, name: '2022' },
            ],
        ],
        [[2023, 2023], [{ id: 2023, name: '2023' }]], // sin repetir
    ])('%j → %j', (years, expected) => {
        expect(toVintageOptions(years)).toEqual(expected);
    });

    it('conserva el orden de entrada, sea cual sea', () => {
        expect(toVintageOptions([2020, 2025, 2022]).map((o) => o.id)).toEqual([2020, 2025, 2022]);
    });

    it('el id es el año como número y el nombre como texto', () => {
        const [option] = toVintageOptions([2023]);
        expect(option.id).toBe(2023);
        expect(option.name).toBe('2023');
    });
});
