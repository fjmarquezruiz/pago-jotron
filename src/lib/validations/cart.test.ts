import { describe, expect, it } from 'vitest';
import { CART_MAX_LINES } from '@/lib/cart/cart';
import {
    cartItemSchema,
    cartLinesRequestSchema,
    cartSchema,
    persistedCartSchema,
    variantIdSchema,
} from './cart';

const MAX_ID = 2_147_483_647;

describe('variantIdSchema', () => {
    it.each([1, 7, MAX_ID])('acepta %s', (value) => {
        expect(variantIdSchema.safeParse(value).success).toBe(true);
    });

    it.each([
        ['0', 0],
        ['negativo', -1],
        ['decimal', 1.5],
        ['por encima del int de MySQL', MAX_ID + 1],
        ['NaN', Number.NaN],
        ['infinito', Number.POSITIVE_INFINITY],
        ['texto', '3'],
        ['nulo', null],
        ['indefinido', undefined],
        ['booleano', true],
    ])('rechaza %s', (_, value) => {
        expect(variantIdSchema.safeParse(value).success).toBe(false);
    });
});

describe('cartItemSchema', () => {
    it('acepta una línea válida y descarta lo que no conoce', () => {
        expect(
            cartItemSchema.parse({ variantId: 4, quantity: 2, price: '9.99', stock: 3 }),
        ).toEqual({
            variantId: 4,
            quantity: 2,
        });
    });

    it.each([
        ['cantidad 0', { variantId: 4, quantity: 0 }],
        ['cantidad decimal', { variantId: 4, quantity: 1.5 }],
        ['cantidad como texto', { variantId: 4, quantity: '2' }],
        ['sin cantidad', { variantId: 4 }],
        ['sin id', { quantity: 2 }],
        ['id no válido', { variantId: 0, quantity: 2 }],
    ])('rechaza %s', (_, value) => {
        expect(cartItemSchema.safeParse(value).success).toBe(false);
    });
});

describe('cartSchema', () => {
    it('acepta un carrito vacío y uno con líneas', () => {
        expect(cartSchema.safeParse([]).success).toBe(true);
        expect(
            cartSchema.safeParse([
                { variantId: 4, quantity: 2 },
                { variantId: 7, quantity: 1 },
            ]).success,
        ).toBe(true);
    });

    it('rechaza una presentación repetida', () => {
        expect(
            cartSchema.safeParse([
                { variantId: 4, quantity: 2 },
                { variantId: 4, quantity: 1 },
            ]).success,
        ).toBe(false);
    });

    it(`admite ${CART_MAX_LINES} líneas y rechaza más`, () => {
        const lines = (count: number) =>
            Array.from({ length: count }, (_, i) => ({ variantId: i + 1, quantity: 1 }));
        expect(cartSchema.safeParse(lines(CART_MAX_LINES)).success).toBe(true);
        expect(cartSchema.safeParse(lines(CART_MAX_LINES + 1)).success).toBe(false);
    });

    it.each([
        ['no es un array', { variantId: 4, quantity: 2 }],
        ['es nulo', null],
    ])('rechaza algo que %s', (_, value) => {
        expect(cartSchema.safeParse(value).success).toBe(false);
    });
});

describe('persistedCartSchema', () => {
    it('acepta { items } y descarta el resto de claves (un precio guardado no se lee)', () => {
        expect(
            persistedCartSchema.parse({
                items: [{ variantId: 4, quantity: 2 }],
                prices: { 4: '9.99' },
            }),
        ).toEqual({ items: [{ variantId: 4, quantity: 2 }] });
    });

    it.each([
        ['sin items', {}],
        ['items no válidos', { items: [{ variantId: 'a', quantity: 2 }] }],
        ['nulo', null],
        ['texto', 'carrito'],
    ])('rechaza %s', (_, value) => {
        expect(persistedCartSchema.safeParse(value).success).toBe(false);
    });
});

describe('cartLinesRequestSchema', () => {
    it('acepta una lista de ids y una vacía', () => {
        expect(cartLinesRequestSchema.parse({ variantIds: [3, 5] })).toEqual({
            variantIds: [3, 5],
        });
        expect(cartLinesRequestSchema.parse({ variantIds: [] })).toEqual({ variantIds: [] });
    });

    it('junta los ids repetidos conservando el orden', () => {
        expect(cartLinesRequestSchema.parse({ variantIds: [5, 3, 5, 3, 9] })).toEqual({
            variantIds: [5, 3, 9],
        });
    });

    it('descarta las claves que no conoce', () => {
        expect(cartLinesRequestSchema.parse({ variantIds: [3], userId: 1 })).toEqual({
            variantIds: [3],
        });
    });

    it(`admite ${CART_MAX_LINES} ids y rechaza más`, () => {
        const ids = (count: number) => Array.from({ length: count }, (_, i) => i + 1);
        expect(cartLinesRequestSchema.safeParse({ variantIds: ids(CART_MAX_LINES) }).success).toBe(
            true,
        );
        expect(
            cartLinesRequestSchema.safeParse({ variantIds: ids(CART_MAX_LINES + 1) }).success,
        ).toBe(false);
    });

    it.each([
        ['sin variantIds', {}],
        ['variantIds no es un array', { variantIds: 3 }],
        ['un id como texto', { variantIds: ['3'] }],
        ['un id inválido entre los válidos', { variantIds: [3, 0, 5] }],
        ['un id decimal', { variantIds: [1.5] }],
        ['cuerpo nulo', null],
        ['cuerpo que es un array', [3, 5]],
    ])('rechaza %s', (_, body) => {
        expect(cartLinesRequestSchema.safeParse(body).success).toBe(false);
    });
});
