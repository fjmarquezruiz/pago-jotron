import { describe, expect, it } from 'vitest';
import { sanitizeFilters, toVintageOptions } from './filter-options';

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

describe('sanitizeFilters', () => {
    const options = {
        origins: [{ id: 6, name: 'Sierras de Málaga' }],
        wineries: [
            { id: 1, name: 'Bodega Pago de Jotrón' },
            { id: 2, name: 'González Byass' },
        ],
        grapes: [{ id: 3, name: 'Moscatel de Alejandría' }],
        typologies: [{ id: 1, name: 'Tinto' }],
        vintages: [
            { id: 2023, name: '2023' },
            { id: 2022, name: '2022' },
        ],
    };

    it('conserva los filtros que están en las opciones', () => {
        const filters = {
            q: 'roble',
            do: 6,
            bodega: 2,
            uva: 3,
            tipologia: 1,
            precio: '10-15' as const,
            anada: 2022,
        };
        expect(sanitizeFilters(filters, options)).toEqual(filters);
    });

    it('sin filtros, sin filtros', () => {
        expect(sanitizeFilters({}, options)).toEqual({});
    });

    it.each([
        [{ do: 7 }, {}], // una D.O. que no está en las opciones (no existe, bloqueada o sin productos)
        [{ bodega: 999 }, {}],
        [{ uva: 1 }, {}],
        [{ tipologia: 7 }, {}],
        [{ anada: 1999 }, {}],
        [{ bodega: 999, tipologia: 1 }, { tipologia: 1 }], // solo descarta el desconocido
    ])('descarta el id desconocido: %j → %j', (filters, expected) => {
        expect(sanitizeFilters(filters, options)).toEqual(expected);
    });

    it('q y precio ya vienen validados y pasan tal cual', () => {
        expect(sanitizeFilters({ q: 'x', precio: 'mas-25' }, options)).toEqual({
            q: 'x',
            precio: 'mas-25',
        });
    });

    it('con listas de opciones vacías, descarta todos los ids', () => {
        const empty = { origins: [], wineries: [], grapes: [], typologies: [], vintages: [] };
        expect(
            sanitizeFilters({ do: 6, bodega: 1, uva: 3, tipologia: 1, anada: 2022, q: 'a' }, empty),
        ).toEqual({ q: 'a' });
    });

    it('no modifica los filtros recibidos', () => {
        const filters = Object.freeze({ bodega: 999 });
        sanitizeFilters(filters, options);
        expect(filters).toEqual({ bodega: 999 });
    });
});
