import { describe, expect, it } from 'vitest';
import { PRICE_RANGES, type PriceRange } from '@/lib/validations/catalog';
import { PRICE_RANGE_BOUNDS, priceRangeBounds } from './price-range';

/** Tramos a los que pertenece un precio, según los extremos (`from` incluido, `to` excluido). */
function rangesOf(price: number): PriceRange[] {
    return PRICE_RANGES.filter((range) => {
        const { from, to } = priceRangeBounds(range);
        return (from === undefined || price >= from) && (to === undefined || price < to);
    });
}

describe('priceRangeBounds', () => {
    it.each([
        ['hasta-10', { to: 10 }],
        ['10-15', { from: 10, to: 15 }],
        ['15-25', { from: 15, to: 25 }],
        ['mas-25', { from: 25 }],
    ] as const)('%s → %j', (range, expected) => {
        expect(priceRangeBounds(range)).toEqual(expected);
    });

    it('define los extremos de todos los tramos y de ninguno más', () => {
        expect(Object.keys(PRICE_RANGE_BOUNDS)).toEqual([...PRICE_RANGES]);
    });

    it('cada tramo empieza donde acaba el anterior; el primero y el último quedan abiertos', () => {
        const bounds = PRICE_RANGES.map(priceRangeBounds);
        expect(bounds[0].from).toBeUndefined();
        expect(bounds.at(-1)?.to).toBeUndefined();
        bounds.slice(1).forEach(({ from }, index) => {
            expect(from).toBe(bounds[index].to);
        });
    });
});

describe('un precio pertenece a un solo tramo', () => {
    it.each([
        [0, 'hasta-10'],
        [7.5, 'hasta-10'],
        [9.99, 'hasta-10'],
        [10, '10-15'], // el extremo inferior entra
        [14.99, '10-15'],
        [15, '15-25'],
        [24.99, '15-25'],
        [25, 'mas-25'],
        [1000, 'mas-25'],
    ])('%s € → %s', (price, expected) => {
        expect(rangesOf(price)).toEqual([expected]);
    });
});
