import { describe, expect, it } from 'vitest';
import { catalogPageHref } from './catalog-url';

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
});
