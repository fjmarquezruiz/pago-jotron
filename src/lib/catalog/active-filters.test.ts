import { describe, expect, it } from 'vitest';
import {
    activeFilters,
    countSelectFilters,
    filterChoices,
    filterValue,
    hasActiveFilters,
    setFilter,
} from './active-filters';
import type { CatalogFilterOptions } from './filter-options';

const options: CatalogFilterOptions = {
    origins: [
        { id: 1, name: 'Jerez-Xérès-Sherry' },
        { id: 6, name: 'Sierras de Málaga' },
    ],
    wineries: [
        { id: 1, name: 'Bodega Pago de Jotrón' },
        { id: 2, name: 'González Byass' },
    ],
    grapes: [{ id: 3, name: 'Moscatel de Alejandría' }],
    typologies: [
        { id: 1, name: 'Tinto' },
        { id: 4, name: 'Generoso' },
    ],
    vintages: [
        { id: 2023, name: '2023' },
        { id: 2022, name: '2022' },
    ],
};

describe('filterChoices', () => {
    it.each([
        [
            'tipologia',
            [
                { value: '1', label: 'Tinto' },
                { value: '4', label: 'Generoso' },
            ],
        ],
        [
            'do',
            [
                { value: '1', label: 'Jerez-Xérès-Sherry' },
                { value: '6', label: 'Sierras de Málaga' },
            ],
        ],
        [
            'bodega',
            [
                { value: '1', label: 'Bodega Pago de Jotrón' },
                { value: '2', label: 'González Byass' },
            ],
        ],
        ['uva', [{ value: '3', label: 'Moscatel de Alejandría' }]],
        [
            'anada',
            [
                { value: '2023', label: '2023' },
                { value: '2022', label: '2022' },
            ],
        ],
    ] as const)('%s: los ids van como texto y en el orden recibido', (key, expected) => {
        expect(filterChoices(key, options)).toEqual(expected);
    });

    it('precio: los 4 tramos fijos, con su texto', () => {
        expect(filterChoices('precio', options)).toEqual([
            { value: 'hasta-10', label: 'Menos de 10 €' },
            { value: '10-15', label: '10 € – 15 €' },
            { value: '15-25', label: '15 € – 25 €' },
            { value: 'mas-25', label: '25 € o más' },
        ]);
    });

    it('una lista vacía da un select sin opciones', () => {
        expect(filterChoices('uva', { ...options, grapes: [] })).toEqual([]);
    });
});

describe('filterValue', () => {
    it.each([
        [{ tipologia: 1 }, 'tipologia', '1'],
        [{ anada: 2022 }, 'anada', '2022'],
        [{ precio: '10-15' as const }, 'precio', '10-15'],
        [{ uva: 0 }, 'uva', '0'],
        [{}, 'bodega', undefined],
        [{ bodega: undefined }, 'bodega', undefined],
    ] as const)('%j · %s → %s', (filters, key, expected) => {
        expect(filterValue({ ...filters }, key)).toBe(expected);
    });
});

describe('setFilter', () => {
    it.each([
        [{}, 'tipologia', '1', { tipologia: 1 }],
        [{ tipologia: 1 }, 'bodega', '2', { tipologia: 1, bodega: 2 }],
        [{ tipologia: 1 }, 'tipologia', '4', { tipologia: 4 }], // cambia el valor
        [{ tipologia: 1 }, 'tipologia', undefined, {}], // lo quita
        [{ tipologia: 1 }, 'tipologia', '', {}],
        [{ anada: 2022 }, 'anada', '2023', { anada: 2023 }],
        [{}, 'do', '6', { do: 6 }],
        [{}, 'uva', '3', { uva: 3 }],
        [{}, 'precio', '15-25', { precio: '15-25' }],
        [{ precio: '10-15' as const }, 'precio', 'mas-25', { precio: 'mas-25' }],
        [{}, 'q', 'roble', { q: 'roble' }],
        [{}, 'q', '  roble  ', { q: 'roble' }], // el buscador se recorta
        [{ q: 'roble', bodega: 1 }, 'q', undefined, { bodega: 1 }],
        [{ q: 'roble' }, 'q', '   ', {}],
    ] as const)('%j · %s=%j → %j', (filters, key, value, expected) => {
        expect(setFilter({ ...filters }, key, value)).toEqual(expected);
    });

    it.each([
        ['bodega', 'abc'],
        ['bodega', '1.5'],
        ['bodega', '-1'],
        ['uva', '1e3'],
        ['precio', '99'],
        ['precio', 'HASTA-10'],
    ] as const)('un valor inválido (%s=%s) quita el filtro en vez de aplicarlo', (key, value) => {
        expect(setFilter({ [key]: 5 } as never, key, value)).toEqual({});
    });

    it('no modifica los filtros recibidos', () => {
        const filters = Object.freeze({ tipologia: 1 });
        expect(setFilter(filters, 'bodega', '2')).toEqual({ tipologia: 1, bodega: 2 });
        expect(filters).toEqual({ tipologia: 1 });
    });
});

describe('activeFilters', () => {
    it('sin filtros, ningún chip', () => {
        expect(activeFilters({}, options)).toEqual([]);
        expect(activeFilters({ q: undefined, uva: undefined }, options)).toEqual([]);
    });

    it('un chip por filtro, con el nombre de la opción', () => {
        expect(activeFilters({ tipologia: 1 }, options)).toEqual([
            { key: 'tipologia', label: 'Tinto' },
        ]);
        expect(activeFilters({ do: 6 }, options)).toEqual([
            { key: 'do', label: 'Sierras de Málaga' },
        ]);
        expect(activeFilters({ anada: 2022 }, options)).toEqual([{ key: 'anada', label: '2022' }]);
        expect(activeFilters({ precio: '10-15' }, options)).toEqual([
            { key: 'precio', label: '10 € – 15 €' },
        ]);
    });

    it('el buscador va primero y entre comillas, como en el diseño', () => {
        expect(activeFilters({ tipologia: 1, q: ' Reserva ' }, options)).toEqual([
            { key: 'q', label: '"Reserva"' },
            { key: 'tipologia', label: 'Tinto' },
        ]);
    });

    it('los selects salen en el orden en que se pintan, no en el de las claves', () => {
        const keys = activeFilters(
            { precio: 'mas-25', anada: 2023, uva: 3, bodega: 2, do: 1, tipologia: 4, q: 'a' },
            options,
        ).map((chip) => chip.key);
        expect(keys).toEqual(['q', 'tipologia', 'do', 'bodega', 'uva', 'anada', 'precio']);
    });

    it('un filtro cuyo valor no está en las opciones no tiene chip', () => {
        expect(activeFilters({ bodega: 999, tipologia: 1 }, options)).toEqual([
            { key: 'tipologia', label: 'Tinto' },
        ]);
    });

    it('un buscador en blanco no tiene chip', () => {
        expect(activeFilters({ q: '   ' }, options)).toEqual([]);
    });
});

describe('countSelectFilters y hasActiveFilters', () => {
    it.each([
        [{}, 0, false],
        [{ q: 'roble' }, 0, true], // el buscador no cuenta en "Filtros (n)"
        [{ q: '  ' }, 0, false],
        [{ tipologia: 1 }, 1, true],
        [{ tipologia: 1, bodega: 2, precio: '10-15' as const }, 3, true],
        [
            {
                q: 'a',
                do: 1,
                bodega: 2,
                uva: 3,
                tipologia: 4,
                precio: 'mas-25' as const,
                anada: 2023,
            },
            6,
            true,
        ],
        [{ uva: 0 }, 1, true],
        [{ uva: undefined }, 0, false],
    ])('%j → %s filtros de selects, activos: %s', (filters, count, active) => {
        expect(countSelectFilters(filters)).toBe(count);
        expect(hasActiveFilters(filters)).toBe(active);
    });
});
