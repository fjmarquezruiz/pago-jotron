import { describe, expect, it } from 'vitest';
import { isProductVisible } from './visibility';

describe('isProductVisible', () => {
    it.each([
        // producto, bodega, D.O. bloqueados → visible
        [false, false, false, true],
        [true, false, false, false],
        [false, true, false, false],
        [false, false, true, false],
        [true, true, false, false],
        [true, false, true, false],
        [false, true, true, false],
        [true, true, true, false],
    ] as const)(
        'producto bloqueado: %s, bodega: %s, D.O.: %s → visible: %s',
        (product, winery, guarantee, expected) => {
            expect(
                isProductVisible({
                    isBlocked: product,
                    winery: { isBlocked: winery },
                    guaranteeOfOrigin: { isBlocked: guarantee },
                }),
            ).toBe(expected);
        },
    );
});
