import { describe, expect, it } from 'vitest';
import type { Cart } from './cart';
import { cartKey, planCartSync, sameCart, type CartSyncPlan } from './sync';

const LOCAL: Cart = [{ variantId: 4, quantity: 2 }];

describe('planCartSync', () => {
    it.each<[string, number | null, Cart, CartSyncPlan]>([
        ['anónimo con líneas: se fusiona', null, LOCAL, 'merge'],
        ['anónimo y vacío: se adopta el del servidor', null, [], 'adopt'],
        ['de esta cuenta con líneas: manda el servidor', 5, LOCAL, 'adopt'],
        ['de esta cuenta y vacío: manda el servidor', 5, [], 'adopt'],
        ['de otra cuenta con líneas: se descarta lo local', 9, LOCAL, 'adopt'],
        ['de otra cuenta y vacío: se adopta el del servidor', 9, [], 'adopt'],
    ])('%s', (_, localOwner, localItems, expected) => {
        expect(planCartSync({ localOwner, userId: 5, localItems })).toBe(expected);
    });
});

describe('cartKey y sameCart', () => {
    it('cartKey solo mira variantId y quantity, en orden', () => {
        expect(cartKey([])).toBe('[]');
        expect(cartKey([{ variantId: 4, quantity: 2 }])).toBe('[[4,2]]');
        expect(
            cartKey([
                { variantId: 4, quantity: 2 },
                { variantId: 7, quantity: 1 },
            ]),
        ).not.toBe(
            cartKey([
                { variantId: 7, quantity: 1 },
                { variantId: 4, quantity: 2 },
            ]),
        );
    });

    it('sameCart compara por contenido', () => {
        expect(sameCart([], [])).toBe(true);
        expect(sameCart(LOCAL, [{ variantId: 4, quantity: 2 }])).toBe(true);
        expect(sameCart(LOCAL, LOCAL)).toBe(true);
    });

    it.each<[string, Cart, Cart]>([
        ['otra cantidad', LOCAL, [{ variantId: 4, quantity: 3 }]],
        ['otra presentación', LOCAL, [{ variantId: 5, quantity: 2 }]],
        ['una línea de más', LOCAL, [...LOCAL, { variantId: 7, quantity: 1 }]],
        ['vacío contra con líneas', [], LOCAL],
    ])('sameCart distingue %s', (_, a, b) => {
        expect(sameCart(a, b)).toBe(false);
    });
});
