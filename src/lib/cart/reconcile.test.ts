import { describe, expect, it } from 'vitest';
import type { Cart } from './cart';
import { reconcileCart, type CartChange, type StockInfo } from './reconcile';

/** Carrito de prueba a partir de `'id x cantidad'` separados por espacios: `'4x2 7x1'`. */
function cart(spec = ''): Cart {
    return spec
        .split(' ')
        .filter(Boolean)
        .map((line) => {
            const [variantId, quantity] = line.split('x').map(Number);
            return { variantId, quantity };
        });
}

/** Líneas del servidor a partir de `'id:stock'` separados por espacios: `'4:9 7:0'`. */
function stockOf(spec = ''): StockInfo[] {
    return spec
        .split(' ')
        .filter(Boolean)
        .map((entry) => {
            const [variantId, stock] = entry.split(':').map(Number);
            return { variantId, stock };
        });
}

const removed = (variantId: number, reason: 'sold-out' | 'unavailable'): CartChange => ({
    type: 'removed',
    variantId,
    reason,
});
const clamped = (variantId: number, from: number, to: number): CartChange => ({
    type: 'clamped',
    variantId,
    from,
    to,
});

describe('reconcileCart', () => {
    it.each([
        // carrito, stock del servidor → carrito resultante, cambios
        ['4x2', '4:5', '4x2', []], // stock de sobra
        ['4x2', '4:2', '4x2', []], // justo el stock
        ['4x5', '4:3', '4x3', [clamped(4, 5, 3)]], // limitada al stock
        ['4x5', '4:1', '4x1', [clamped(4, 5, 1)]], // queda 1
        ['4x2', '4:0', '', [removed(4, 'sold-out')]], // sin stock
        ['4x2', '', '', [removed(4, 'unavailable')]], // el servidor ya no la devuelve
        ['4x2', '7:9', '', [removed(4, 'unavailable')]], // el servidor devuelve otras
        [
            '4x5 7x1 9x2 11x3',
            '4:3 7:0 11:3',
            '4x3 11x3',
            [clamped(4, 5, 3), removed(7, 'sold-out'), removed(9, 'unavailable')],
        ], // de todo, en el orden del carrito
        ['4x2 7x1 9x3', '9:3 4:2 7:1', '4x2 7x1 9x3', []], // el orden de `lines` da igual
        ['4x2 7x1 9x3', '4:2 7:0 9:1', '4x2 9x1', [removed(7, 'sold-out'), clamped(9, 3, 1)]], // conserva el orden
    ])('[%s] con servidor [%s] → [%s]', (items, lines, expectedCart, expectedChanges) => {
        const result = reconcileCart(cart(items), stockOf(lines));
        expect(result.cart).toEqual(cart(expectedCart));
        expect(result.changes).toEqual(expectedChanges);
    });

    it.each([
        ['negativo', -5],
        ['NaN', Number.NaN],
        ['infinito', Number.POSITIVE_INFINITY],
        ['infinito negativo', Number.NEGATIVE_INFINITY],
        ['decimal menor que 1', 0.9],
    ])('un stock %s cuenta como 0: la línea se quita por agotada', (_, stock) => {
        const result = reconcileCart(cart('4x2'), [{ variantId: 4, stock }]);
        expect(result.cart).toEqual([]);
        expect(result.changes).toEqual([removed(4, 'sold-out')]);
    });

    it.each([
        // cantidad, stock decimal → cantidad que queda
        [5, 2.9, 2],
        [5, 1.1, 1],
        [3, 3.5, 3],
    ])('un stock decimal se redondea hacia abajo: %s con stock %s → %s', (quantity, stock, to) => {
        const result = reconcileCart([{ variantId: 4, quantity }], [{ variantId: 4, stock }]);
        expect(result.cart).toEqual([{ variantId: 4, quantity: to }]);
        expect(result.changes).toEqual(quantity > to ? [clamped(4, quantity, to)] : []);
    });

    it('con el carrito vacío no hay nada que reconciliar', () => {
        const empty = cart();
        const result = reconcileCart(empty, stockOf('4:9'));
        expect(result.cart).toBe(empty);
        expect(result.changes).toEqual([]);
    });

    it('sin líneas del servidor se quita todo por no disponible', () => {
        const result = reconcileCart(cart('4x2 7x1'), []);
        expect(result.cart).toEqual([]);
        expect(result.changes).toEqual([removed(4, 'unavailable'), removed(7, 'unavailable')]);
    });

    it('un carrito y un servidor vacíos devuelven el mismo carrito', () => {
        const empty = cart();
        const result = reconcileCart(empty, []);
        expect(result.cart).toBe(empty);
        expect(result.changes).toEqual([]);
    });

    it('sin cambios devuelve el MISMO carrito (misma referencia)', () => {
        const before = cart('4x2 7x1');
        const result = reconcileCart(before, stockOf('4:9 7:1 11:5'));
        expect(result.cart).toBe(before);
        expect(result.changes).toEqual([]);
    });

    it.each([
        ['una línea limitada', '4:1 7:9'],
        ['una línea agotada', '4:9 7:0'],
        ['una línea que desaparece del servidor', '4:9'],
    ])('con %s devuelve un carrito nuevo', (_, lines) => {
        const before = cart('4x2 7x1');
        const result = reconcileCart(before, stockOf(lines));
        expect(result.cart).not.toBe(before);
        expect(result.changes).toHaveLength(1);
    });

    it('las líneas que no cambian conservan su objeto (no se copian de más)', () => {
        const before = cart('4x2 7x5');
        const result = reconcileCart(before, stockOf('4:9 7:1'));
        expect(result.cart[0]).toBe(before[0]);
        expect(result.cart[1]).toEqual({ variantId: 7, quantity: 1 });
    });

    it('no modifica el carrito ni las líneas que recibe', () => {
        const before = cart('4x5 7x1 9x2');
        const lines = stockOf('4:3 7:0');
        const snapshot = structuredClone([before, lines]);
        reconcileCart(before, lines);
        expect([before, lines]).toEqual(snapshot);
    });

    it('es idempotente: reconciliar lo ya reconciliado no cambia nada', () => {
        const lines = stockOf('4:3 7:0 11:3');
        const first = reconcileCart(cart('4x5 7x1 9x2 11x3'), lines);
        const second = reconcileCart(first.cart, lines);
        expect(second.cart).toBe(first.cart);
        expect(second.changes).toEqual([]);
    });
});
