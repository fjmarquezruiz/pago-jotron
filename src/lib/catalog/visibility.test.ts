import { describe, expect, it } from 'vitest';
import { isProductPageAvailable, isProductVisible } from './visibility';

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

describe('isProductPageAvailable', () => {
    const visible = {
        isBlocked: false,
        winery: { isBlocked: false },
        guaranteeOfOrigin: { isBlocked: false },
    };

    it.each([
        ['visible y con presentaciones', visible, 1, true],
        ['visible y con varias presentaciones', visible, 3, true],
        ['visible pero sin presentaciones', visible, 0, false],
        [
            'bodega bloqueada con presentaciones',
            { ...visible, winery: { isBlocked: true } },
            2,
            false,
        ],
        ['bloqueado y sin presentaciones', { ...visible, isBlocked: true }, 0, false],
    ] as const)('%s → %s', (_caso, product, variants, expected) => {
        expect(
            isProductPageAvailable({ ...product, variants: Array.from({ length: variants }) }),
        ).toBe(expected);
    });
});
