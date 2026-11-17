import { describe, expect, it } from 'vitest';
import { CATALOG_RESULTS_ID, catalogPageHref, catalogResultsHref } from './catalog-url';

describe('catalogPageHref', () => {
    it.each([
        [1, '/productos'],
        [2, '/productos?page=2'],
        [10, '/productos?page=10'],
        [0, '/productos'],
        [-3, '/productos'],
        [Number.NaN, '/productos'],
        [2.9, '/productos?page=2'],
    ])('página %s → %s', (page, expected) => {
        expect(catalogPageHref(page)).toBe(expected);
    });

    it.each([
        [{ q: 'roble' }, '/productos?q=roble'],
        [{ do: 6 }, '/productos?do=6'],
        [{ bodega: 2 }, '/productos?bodega=2'],
        [{ uva: 8 }, '/productos?uva=8'],
        [{ tipologia: 1 }, '/productos?tipologia=1'],
        [{ precio: '10-15' as const }, '/productos?precio=10-15'],
        [{ anada: 2022 }, '/productos?anada=2022'],
    ])('el filtro %j → %s', (filters, expected) => {
        expect(catalogPageHref(1, { filters })).toBe(expected);
    });

    it('escribe los parámetros siempre en el mismo orden, sea cual sea el de las claves', () => {
        const expected =
            '/productos?q=a&do=1&bodega=2&uva=3&tipologia=4&precio=mas-25&anada=2020&orden=nombre&page=2';
        expect(
            catalogPageHref(2, {
                orden: 'nombre',
                filters: {
                    anada: 2020,
                    precio: 'mas-25',
                    tipologia: 4,
                    uva: 3,
                    bodega: 2,
                    do: 1,
                    q: 'a',
                },
            }),
        ).toBe(expected);
        expect(
            catalogPageHref(2, {
                filters: {
                    q: 'a',
                    do: 1,
                    bodega: 2,
                    uva: 3,
                    tipologia: 4,
                    precio: 'mas-25',
                    anada: 2020,
                },
                orden: 'nombre',
            }),
        ).toBe(expected);
    });

    it.each([
        ['recientes', '/productos'], // el orden por defecto no se escribe
        ['precio-asc', '/productos?orden=precio-asc'],
        ['precio-desc', '/productos?orden=precio-desc'],
        ['nombre', '/productos?orden=nombre'],
    ] as const)('orden %s → %s', (orden, expected) => {
        expect(catalogPageHref(1, { orden })).toBe(expected);
    });

    it('la página va la última y la primera no se escribe', () => {
        expect(catalogPageHref(1, { filters: { bodega: 2 } })).toBe('/productos?bodega=2');
        expect(catalogPageHref(3, { filters: { bodega: 2 } })).toBe('/productos?bodega=2&page=3');
    });

    it.each([
        [{}, '/productos'],
        [{ q: undefined, uva: undefined, precio: undefined }, '/productos'],
        [{ q: '' }, '/productos'],
        [{ q: '   ' }, '/productos'],
    ])('los filtros vacíos (%j) no aparecen', (filters, expected) => {
        expect(catalogPageHref(1, { filters })).toBe(expected);
    });

    it('recorta la búsqueda y codifica lo que no es seguro en una URL', () => {
        expect(catalogPageHref(1, { filters: { q: '  tinto roble ' } })).toBe(
            '/productos?q=tinto+roble',
        );
        expect(catalogPageHref(1, { filters: { q: 'Jotrón & Co/100%' } })).toBe(
            '/productos?q=Jotr%C3%B3n+%26+Co%2F100%25',
        );
    });

    it('un filtro con valor 0 no se pierde (no es "vacío")', () => {
        expect(catalogPageHref(1, { filters: { uva: 0 } })).toBe('/productos?uva=0');
    });
});

describe('catalogResultsHref', () => {
    it('el ancla apunta al id de la sección de resultados', () => {
        expect(CATALOG_RESULTS_ID).toBe('resultados');
    });

    it.each([
        [1, {}, '/productos#resultados'],
        [2, {}, '/productos?page=2#resultados'],
        [3, { filters: { tipologia: 1 } }, '/productos?tipologia=1&page=3#resultados'],
        [
            2,
            { filters: { q: 'roble', precio: '10-15' as const }, orden: 'nombre' as const },
            '/productos?q=roble&precio=10-15&orden=nombre&page=2#resultados',
        ],
        [0, {}, '/productos#resultados'], // página inválida: la primera, con ancla
    ])('página %s con %j → %s', (page, state, expected) => {
        expect(catalogResultsHref(page, state)).toBe(expected);
    });

    it('es la misma URL que catalogPageHref más el ancla', () => {
        const state = { filters: { bodega: 2, uva: 3 }, orden: 'precio-asc' as const };
        expect(catalogResultsHref(4, state)).toBe(`${catalogPageHref(4, state)}#resultados`);
    });
});
