import { describe, expect, it } from 'vitest';
import { catalogSearchParamsSchema } from './catalog';

describe('catalogSearchParamsSchema', () => {
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
        expect(catalogSearchParamsSchema.parse(searchParams).page).toBe(expected);
    });

    it('ignora los parámetros desconocidos', () => {
        expect(catalogSearchParamsSchema.parse({ page: '2', utm_source: 'x' })).toEqual({
            page: 2,
        });
    });
});
