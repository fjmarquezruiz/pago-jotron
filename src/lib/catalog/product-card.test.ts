import { describe, expect, it } from 'vitest';
import { productCardBadge, productCardPrice } from './product-card';

describe('productCardBadge', () => {
    it.each([
        [{ totalStock: 0, isNew: false }, 'sold-out'],
        [{ totalStock: 0, isNew: true }, 'sold-out'], // agotado gana a nuevo
        [{ totalStock: 5, isNew: true }, 'new'],
        [{ totalStock: 1, isNew: false }, null],
    ] as const)('%j → %s', (product, expected) => {
        expect(productCardBadge(product)).toBe(expected);
    });
});

describe('productCardPrice', () => {
    // El espacio antes del € es un espacio duro (U+00A0), como lo da formatEuros.
    it.each([
        ['7.99', 1, '7,99 €'],
        ['23.50', 1, '23,50 €'],
        ['7.50', 2, 'Desde 7,50 €'],
        ['13.5', 3, 'Desde 13,50 €'],
        ['0.00', 1, '0,00 €'],
    ])('%s con %s presentaciones → %j', (minPrice, variantCount, expected) => {
        expect(productCardPrice(minPrice, variantCount)).toBe(expected);
    });

    it('lanza error con un precio que no es un número', () => {
        expect(() => productCardPrice('abc', 1)).toThrow(RangeError);
    });
});
