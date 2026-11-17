import { describe, expect, it } from 'vitest';
import {
    CATALOG_SORTS,
    DEFAULT_CATALOG_SORT,
    PRICE_RANGES,
    SEARCH_MAX_LENGTH,
    catalogSearchParamsSchema,
} from './catalog';

const parse = (searchParams: Record<string, unknown>) =>
    catalogSearchParamsSchema.parse(searchParams);

describe('catalogSearchParamsSchema · page', () => {
    it.each([
        [{ page: '1' }, 1],
        [{ page: '2' }, 2],
        [{ page: '37' }, 37],
        [{}, 1], // sin page
        [{ page: undefined }, 1],
        [{ page: '' }, 1],
        [{ page: '0' }, 1],
        [{ page: '-3' }, 1],
        [{ page: '2.5' }, 1], // un decimal no es una página
        [{ page: 'abc' }, 1],
        [{ page: ['2', '3'] }, 1], // ?page=2&page=3
        [{ page: 'Infinity' }, 1],
    ])('%j → page %s', (searchParams, expected) => {
        expect(parse(searchParams).page).toBe(expected);
    });

    it('ignora los parámetros desconocidos', () => {
        expect(parse({ page: '2', utm_source: 'x' })).toEqual({
            page: 2,
            orden: DEFAULT_CATALOG_SORT,
        });
    });
});

describe('catalogSearchParamsSchema · q', () => {
    it.each([
        ['tinto', 'tinto'],
        ['  tinto  ', 'tinto'], // recorta los extremos
        ['tío pepe', 'tío pepe'],
        ['tinto  roble', 'tinto  roble'], // los espacios de dentro no se tocan
        ['100% uva_', '100% uva_'], // los comodines de LIKE llegan tal cual: los escapa la consulta
        ["'; DROP TABLE products; --", "'; DROP TABLE products; --"], // es texto; la consulta lo parametriza
        ['a'.repeat(SEARCH_MAX_LENGTH), 'a'.repeat(SEARCH_MAX_LENGTH)],
    ])('%j → %j', (q, expected) => {
        expect(parse({ q }).q).toBe(expected);
    });

    it.each([
        [undefined],
        [''],
        ['   '], // solo espacios
        ['a'.repeat(SEARCH_MAX_LENGTH + 1)], // demasiado larga
        [['tinto', 'blanco']], // ?q=tinto&q=blanco
        [123],
        [{ toString: 'x' }],
    ])('%j → sin búsqueda', (q) => {
        expect(parse({ q }).q).toBeUndefined();
    });
});

describe.each(['do', 'bodega', 'uva', 'tipologia'] as const)(
    'catalogSearchParamsSchema · %s',
    (key) => {
        it.each([
            ['1', 1],
            ['2', 2],
            ['10', 10],
            ['007', 7],
            ['2147483647', 2147483647], // el id más alto que cabe en un int de MySQL
        ])('%j → %s', (value, expected) => {
            expect(parse({ [key]: value })[key]).toBe(expected);
        });

        it.each([
            [undefined],
            [''],
            [' '],
            ['0'],
            ['-1'],
            ['1.5'],
            ['1e3'], // z.coerce lo convertiría en 1000
            ['0x10'], // ... y este en 16
            [' 2'],
            ['2 '],
            ['+2'],
            ['abc'],
            ['NaN'],
            ['Infinity'],
            ['2147483648'], // pasa del int de MySQL
            ['99999999999999999999999'],
            [['1', '2']], // ?{key}=1&{key}=2
            [['1']],
            [1], // lo que llega de la URL siempre es texto
            [null],
        ])('%j → sin filtro', (value) => {
            expect(parse({ [key]: value })[key]).toBeUndefined();
        });
    },
);

describe('catalogSearchParamsSchema · precio', () => {
    it('tiene los cuatro tramos fijos, de menor a mayor', () => {
        expect(PRICE_RANGES).toEqual(['hasta-10', '10-15', '15-25', 'mas-25']);
    });

    it.each(PRICE_RANGES)('acepta %s', (precio) => {
        expect(parse({ precio }).precio).toBe(precio);
    });

    it.each([
        [undefined],
        [''],
        ['10'],
        ['10-20'], // un tramo que no existe
        ['HASTA-10'], // distingue mayúsculas
        [' hasta-10'],
        ['-10'],
        ['mas-50'],
        [['hasta-10', '10-15']],
        [10],
    ])('%j → sin filtro', (precio) => {
        expect(parse({ precio }).precio).toBeUndefined();
    });
});

describe('catalogSearchParamsSchema · anada', () => {
    it.each([
        ['2023', 2023],
        ['1900', 1900],
        ['2100', 2100],
        ['1999', 1999],
    ])('%j → %s', (anada, expected) => {
        expect(parse({ anada }).anada).toBe(expected);
    });

    it.each([
        [undefined],
        [''],
        ['23'], // no son cuatro dígitos
        ['02023'],
        ['1899'], // antes del mínimo
        ['2101'], // después del máximo
        ['0000'],
        ['20.23'],
        ['2e3'],
        ['abc'],
        ['2023 '],
        [['2022', '2023']],
        [2023],
    ])('%j → sin filtro', (anada) => {
        expect(parse({ anada }).anada).toBeUndefined();
    });
});

describe('catalogSearchParamsSchema · orden', () => {
    it('el primer criterio es el que se aplica por defecto', () => {
        expect(CATALOG_SORTS).toEqual(['recientes', 'precio-asc', 'precio-desc', 'nombre']);
        expect(DEFAULT_CATALOG_SORT).toBe('recientes');
    });

    it.each(CATALOG_SORTS)('acepta %s', (orden) => {
        expect(parse({ orden }).orden).toBe(orden);
    });

    it.each([
        [undefined],
        [''],
        ['precio'],
        ['PRECIO-ASC'],
        ['nombre '],
        ['relevancia'], // no existe (todavía)
        [['nombre', 'precio-asc']],
        [3],
        [null],
    ])('%j → recientes', (orden) => {
        expect(parse({ orden }).orden).toBe('recientes');
    });
});

describe('catalogSearchParamsSchema · conjunto', () => {
    it('sin parámetros: página 1, orden por defecto y ningún filtro', () => {
        expect(parse({})).toEqual({ page: 1, orden: 'recientes' });
    });

    it('una URL completa con todos los parámetros válidos', () => {
        expect(
            parse({
                page: '3',
                q: ' roble ',
                do: '6',
                bodega: '1',
                uva: '8',
                tipologia: '1',
                precio: '15-25',
                anada: '2022',
                orden: 'precio-desc',
            }),
        ).toEqual({
            page: 3,
            q: 'roble',
            do: 6,
            bodega: 1,
            uva: 8,
            tipologia: 1,
            precio: '15-25',
            anada: 2022,
            orden: 'precio-desc',
        });
    });

    it('un parámetro inválido no estropea a los demás', () => {
        expect(
            parse({
                page: 'x',
                q: '',
                bodega: 'dos',
                tipologia: '1',
                precio: '99',
                orden: 'nombre',
            }),
        ).toEqual({ page: 1, tipologia: 1, orden: 'nombre' });
    });

    it.each([
        [
            'todo basura',
            {
                page: '-1',
                q: [],
                do: {},
                bodega: 'a',
                uva: '-',
                tipologia: '1.1',
                precio: 'x',
                anada: 'y',
                orden: 'z',
            },
        ],
        ['claves del prototipo', { __proto__: 'x', constructor: 'y', toString: 'z', page: '2' }],
        ['valores nulos', { page: null, q: null, do: null, bodega: null, orden: null }],
        ['arrays vacíos', { page: [], q: [], uva: [], precio: [], orden: [] }],
        [
            'texto enorme',
            { q: 'x'.repeat(100_000), bodega: '9'.repeat(100_000), page: '9'.repeat(100_000) },
        ],
        [
            'caracteres raros',
            { q: '\u0000\uD800', bodega: '１２', anada: '２０２３', orden: '‮nombre' },
        ],
    ])('nunca lanza: %s', (_name, searchParams) => {
        const result = catalogSearchParamsSchema.safeParse(searchParams);
        expect(result.success).toBe(true);
    });

    it('los números de ancho completo no cuentan como dígitos', () => {
        const result = parse({ bodega: '１２', anada: '２０２３' });
        expect(result.bodega).toBeUndefined();
        expect(result.anada).toBeUndefined();
    });
});
