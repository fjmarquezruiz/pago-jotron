import { describe, expect, it } from 'vitest';
import { findStockProblems } from './stock';

const item = (variantId: number, quantity: number) => ({ variantId, quantity });
const line = (variantId: number, stock: number) => ({ variantId, stock });

describe('findStockProblems', () => {
    it('sin problemas si hay stock de todo', () => {
        expect(findStockProblems([item(4, 2), item(9, 1)], [line(4, 2), line(9, 10)])).toEqual([]);
    });

    it('con el carrito vacío no hay problemas', () => {
        expect(findStockProblems([], [])).toEqual([]);
    });

    it('avisa de lo que pide más del stock y de cuánto queda', () => {
        expect(findStockProblems([item(4, 5)], [line(4, 2)])).toEqual([
            { variantId: 4, available: 2 },
        ]);
    });

    it('una presentación agotada no tiene unidades', () => {
        expect(findStockProblems([item(4, 1)], [line(4, 0)])).toEqual([
            { variantId: 4, available: 0 },
        ]);
    });

    it('una presentación que ya no se vende (no vuelve de la BD) no tiene unidades', () => {
        expect(findStockProblems([item(7, 1)], [])).toEqual([{ variantId: 7, available: 0 }]);
    });

    it('los problemas salen en el orden del carrito y solo los que fallan', () => {
        expect(
            findStockProblems(
                [item(9, 3), item(4, 1), item(2, 5)],
                [line(4, 9), line(9, 1), line(2, 0)],
            ),
        ).toEqual([
            { variantId: 9, available: 1 },
            { variantId: 2, available: 0 },
        ]);
    });
});
