import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_MAX_LINES, type Cart } from '@/lib/cart/cart';

const getCartLines = vi.fn();
const getUserCart = vi.fn();
const saveUserCart = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getCartLines: (ids: number[]) => getCartLines(ids),
    getUserCart: (userId: number) => getUserCart(userId),
    saveUserCart: (userId: number, items: Cart) => saveUserCart(userId, items),
}));

import { mergeWithSaved, normalizeCart } from './server';

/**
 * Hace que `getCartLines` se comporte como el de verdad: solo devuelve las presentaciones pedidas
 * que se pueden comprar, es decir, las que están en `stock` (`variantId` → unidades).
 */
function sellable(stock: Record<number, number>) {
    getCartLines.mockImplementation(async (ids: number[]) =>
        ids.filter((id) => id in stock).map((id) => ({ variantId: id, stock: stock[id] })),
    );
}

const item = (variantId: number, quantity: number) => ({ variantId, quantity });

beforeEach(() => {
    getCartLines.mockReset();
    getUserCart.mockReset();
    saveUserCart.mockReset();
});

describe('normalizeCart', () => {
    it('un carrito vacío da otro vacío, sin consultar la BD', async () => {
        await expect(normalizeCart([])).resolves.toEqual([]);
        expect(getCartLines).not.toHaveBeenCalled();
    });

    it('pide el stock de las presentaciones del carrito, en su orden', async () => {
        sellable({ 4: 10, 7: 10 });
        await normalizeCart([item(7, 1), item(4, 1)]);
        expect(getCartLines).toHaveBeenCalledTimes(1);
        expect(getCartLines).toHaveBeenCalledWith([7, 4]);
    });

    it('lo que cabe en el stock se queda igual (y es el mismo carrito)', async () => {
        sellable({ 4: 10, 7: 3 });
        const items = [item(4, 2), item(7, 3)];
        await expect(normalizeCart(items)).resolves.toBe(items);
    });

    it('limita cada cantidad al stock', async () => {
        sellable({ 4: 6, 7: 100 });
        await expect(normalizeCart([item(4, 9), item(7, 2)])).resolves.toEqual([
            item(4, 6),
            item(7, 2),
        ]);
    });

    it.each([
        ['agotada (stock 0)', { 4: 0, 7: 5 }],
        ['bloqueada o borrada (la BD no la devuelve)', { 7: 5 }],
    ])('descarta la presentación %s', async (_, stock) => {
        sellable(stock);
        await expect(normalizeCart([item(4, 2), item(7, 1)])).resolves.toEqual([item(7, 1)]);
    });

    it('si ninguna se puede comprar, el carrito queda vacío', async () => {
        sellable({});
        await expect(normalizeCart([item(4, 2), item(7, 1)])).resolves.toEqual([]);
    });

    it('conserva el orden de las líneas', async () => {
        sellable({ 9: 5, 2: 5, 5: 5 });
        const result = await normalizeCart([item(9, 1), item(2, 1), item(5, 1)]);
        expect(result.map((line) => line.variantId)).toEqual([9, 2, 5]);
    });

    it('no modifica el carrito que recibe', async () => {
        sellable({ 4: 1 });
        const items = [item(4, 9), item(7, 1)];
        await normalizeCart(items);
        expect(items).toEqual([item(4, 9), item(7, 1)]);
    });

    it('no guarda nada: solo lee', async () => {
        sellable({ 4: 1 });
        await normalizeCart([item(4, 1)]);
        expect(saveUserCart).not.toHaveBeenCalled();
    });

    it('deja pasar el error de la BD', async () => {
        getCartLines.mockRejectedValue(new Error('boom'));
        await expect(normalizeCart([item(4, 1)])).rejects.toThrow('boom');
    });
});

describe('mergeWithSaved', () => {
    it('lee el carrito guardado del usuario que se le pasa', async () => {
        getUserCart.mockResolvedValue([]);
        await mergeWithSaved(12, []);
        expect(getUserCart).toHaveBeenCalledTimes(1);
        expect(getUserCart).toHaveBeenCalledWith(12);
    });

    it('sin nada guardado ni en el navegador, da un carrito vacío sin pedir el stock', async () => {
        getUserCart.mockResolvedValue([]);
        await expect(mergeWithSaved(12, [])).resolves.toEqual([]);
        expect(getCartLines).not.toHaveBeenCalled();
    });

    it('pide el stock de la unión de las dos, sin repetidos y con lo guardado primero', async () => {
        getUserCart.mockResolvedValue([item(4, 1), item(7, 1)]);
        sellable({});
        await mergeWithSaved(12, [item(9, 1), item(4, 1)]);
        expect(getCartLines).toHaveBeenCalledTimes(1);
        expect(getCartLines).toHaveBeenCalledWith([4, 7, 9]);
    });

    it.each([
        ['la del navegador es mayor', 2, 5, 5],
        ['la guardada es mayor', 5, 2, 5],
        ['son iguales', 3, 3, 3],
    ])(
        'si la presentación está en las dos, gana la mayor cantidad (no la suma): %s',
        async (_, saved, local, expected) => {
            getUserCart.mockResolvedValue([item(4, saved)]);
            sellable({ 4: 10 });
            await expect(mergeWithSaved(12, [item(4, local)])).resolves.toEqual([
                item(4, expected),
            ]);
        },
    );

    it('añade las líneas del navegador que no estaban guardadas, detrás de las guardadas', async () => {
        getUserCart.mockResolvedValue([item(7, 1), item(4, 2)]);
        sellable({ 4: 10, 7: 10, 9: 10 });
        await expect(mergeWithSaved(12, [item(9, 3), item(4, 1)])).resolves.toEqual([
            item(7, 1),
            item(4, 2),
            item(9, 3),
        ]);
    });

    it('limita cada línea al stock de ahora', async () => {
        getUserCart.mockResolvedValue([item(4, 2)]);
        sellable({ 4: 3, 9: 1 });
        await expect(mergeWithSaved(12, [item(4, 8), item(9, 5)])).resolves.toEqual([
            item(4, 3),
            item(9, 1),
        ]);
    });

    it('descarta lo que ya no se puede comprar, también lo que estaba guardado', async () => {
        getUserCart.mockResolvedValue([item(4, 2), item(7, 1)]);
        sellable({ 7: 5, 9: 0 });
        await expect(mergeWithSaved(12, [item(9, 1), item(11, 1)])).resolves.toEqual([item(7, 1)]);
    });

    it('es idempotente: fusionar otra vez con el mismo carrito no cambia nada', async () => {
        const saved = [item(4, 2), item(7, 1)];
        getUserCart.mockResolvedValue(saved);
        sellable({ 4: 10, 7: 10, 9: 10 });

        const first = await mergeWithSaved(12, [item(4, 2), item(9, 3)]);
        getUserCart.mockResolvedValue(first);
        const second = await mergeWithSaved(12, [item(4, 2), item(9, 3)]);

        expect(first).toEqual([item(4, 2), item(7, 1), item(9, 3)]);
        expect(second).toEqual(first);
    });

    it('con el carrito del navegador vacío, devuelve lo guardado saneado', async () => {
        getUserCart.mockResolvedValue([item(4, 9), item(7, 1)]);
        sellable({ 4: 6, 7: 1 });
        await expect(mergeWithSaved(12, [])).resolves.toEqual([item(4, 6), item(7, 1)]);
    });

    it(`no pasa de ${CART_MAX_LINES} líneas: se quedan las guardadas, que van primero`, async () => {
        const saved = Array.from({ length: CART_MAX_LINES - 1 }, (_, i) => item(i + 1, 1));
        const local = [item(100, 1), item(101, 1)];
        getUserCart.mockResolvedValue(saved);
        sellable(Object.fromEntries([...saved, ...local].map((line) => [line.variantId, 5])));

        const result = await mergeWithSaved(12, local);

        expect(result).toHaveLength(CART_MAX_LINES);
        expect(result.slice(0, saved.length)).toEqual(saved);
        expect(result.at(-1)).toEqual(item(100, 1));
    });

    it('no guarda el resultado: eso lo hace la ruta', async () => {
        getUserCart.mockResolvedValue([item(4, 1)]);
        sellable({ 4: 5, 9: 5 });
        await mergeWithSaved(12, [item(9, 1)]);
        expect(saveUserCart).not.toHaveBeenCalled();
    });

    it.each([
        ['leer el carrito guardado', () => getUserCart.mockRejectedValue(new Error('boom'))],
        [
            'leer el stock',
            () => {
                getUserCart.mockResolvedValue([item(4, 1)]);
                getCartLines.mockRejectedValue(new Error('boom'));
            },
        ],
    ])('deja pasar el error de la BD al %s', async (_, fail) => {
        fail();
        await expect(mergeWithSaved(12, [item(9, 1)])).rejects.toThrow('boom');
    });
});
