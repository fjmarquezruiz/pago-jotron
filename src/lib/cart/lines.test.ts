import { describe, expect, it } from 'vitest';
import { orderLinesByVariantIds } from './lines';

const rows = (...ids: number[]) => ids.map((variantId) => ({ variantId, name: `v${variantId}` }));

describe('orderLinesByVariantIds', () => {
    it.each([
        // ids del carrito, filas de la BD → ids resultantes
        [
            [7, 4, 9],
            [4, 7, 9],
            [7, 4, 9],
        ], // el orden del carrito, no el de la BD
        [
            [4, 7],
            [7, 4],
            [4, 7],
        ],
        [
            [7, 4, 9],
            [4, 7],
            [7, 4],
        ], // la 9 no volvió: se omite
        [
            [4, 4, 7],
            [7, 4],
            [4, 7],
        ], // un id repetido da una sola fila
        [[4, 7], [], []], // la BD no devolvió nada
        [[], [4, 7], []], // el carrito está vacío
        [[4], [4, 7, 9], [4]], // la BD devuelve más de lo pedido
    ])('ids %j con filas %j → %j', (ids, found, expected) => {
        expect(orderLinesByVariantIds(ids, rows(...found)).map((row) => row.variantId)).toEqual(
            expected,
        );
    });

    it('conserva toda la fila', () => {
        expect(orderLinesByVariantIds([4], rows(4))).toEqual([{ variantId: 4, name: 'v4' }]);
    });
});
