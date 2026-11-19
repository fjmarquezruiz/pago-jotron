import { describe, expect, it } from 'vitest';
import { CART_MAX_LINES, addItem, mergeCarts, removeItem, setQuantity, type Cart } from './cart';

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

/** Stock de prueba a partir de `'id:stock'` separados por espacios: `'4:9 7:0'`. */
function stockOf(spec = ''): Map<number, number> {
    return new Map(
        spec
            .split(' ')
            .filter(Boolean)
            .map((entry) => {
                const [variantId, stock] = entry.split(':').map(Number);
                return [variantId, stock];
            }),
    );
}

/** Carrito con `CART_MAX_LINES` líneas: los ids 1..N, de una unidad. */
const fullCart = (): Cart =>
    Array.from({ length: CART_MAX_LINES }, (_, i) => ({ variantId: i + 1, quantity: 1 }));

describe('addItem', () => {
    it.each([
        // carrito, id, cantidad, stock → carrito resultante
        ['', 4, 2, 10, '4x2'], // presentación nueva
        ['4x2', 4, 3, 10, '4x5'], // suma a lo que ya había
        ['4x2', 4, 3, 4, '4x4'], // limitada al stock
        ['4x2', 4, 1, 2, '4x2'], // ya estaba en el stock: no cambia
        ['', 4, 9, 3, '4x3'], // una presentación nueva también se limita
        ['4x2', 7, 1, 5, '4x2 7x1'], // la nueva va al final
        ['4x2 7x1', 4, 1, 9, '4x3 7x1'], // la que ya estaba conserva su sitio
    ])('[%s] + id %s × %s (stock %s) → [%s]', (items, variantId, quantity, stock, expected) => {
        expect(addItem(cart(items), variantId, quantity, stock)).toEqual(cart(expected));
    });

    it('sin stock no añade, y quita la línea que hubiera', () => {
        expect(addItem(cart(), 4, 1, 0)).toEqual([]);
        expect(addItem(cart('4x2 7x1'), 4, 1, 0)).toEqual(cart('7x1'));
    });

    it.each([
        ['cantidad 0', 4, 0],
        ['cantidad negativa', 4, -1],
        ['cantidad decimal', 4, 1.5],
        ['cantidad NaN', 4, Number.NaN],
        ['cantidad infinita', 4, Number.POSITIVE_INFINITY],
        ['id 0', 0, 1],
        ['id negativo', -3, 1],
        ['id decimal', 2.5, 1],
        ['id NaN', Number.NaN, 1],
    ])('con %s no cambia el carrito', (_, variantId, quantity) => {
        const before = cart('4x2');
        expect(addItem(before, variantId, quantity, 10)).toBe(before);
    });

    it.each([
        ['negativo', -5],
        ['NaN', Number.NaN],
        ['infinito negativo', Number.NEGATIVE_INFINITY],
    ])('un stock %s cuenta como cero', (_, stock) => {
        expect(addItem(cart(), 4, 1, stock)).toEqual([]);
    });

    it('un stock decimal se redondea hacia abajo', () => {
        expect(addItem(cart(), 4, 5, 2.9)).toEqual(cart('4x2'));
    });

    it('con el carrito lleno no deja entrar una presentación nueva', () => {
        const full = fullCart();
        expect(addItem(full, 999, 1, 5)).toBe(full);
    });

    it('con el carrito lleno sí amplía una línea que ya estaba', () => {
        const result = addItem(fullCart(), 1, 2, 5);
        expect(result).toHaveLength(CART_MAX_LINES);
        expect(result[0]).toEqual({ variantId: 1, quantity: 3 });
    });

    it('no modifica el carrito que recibe', () => {
        const before = cart('4x2');
        const snapshot = structuredClone(before);
        addItem(before, 4, 1, 9);
        addItem(before, 7, 1, 9);
        expect(before).toEqual(snapshot);
    });

    it('devuelve el mismo carrito si no cambia nada (no provoca renders de más)', () => {
        const before = cart('4x2');
        expect(addItem(before, 4, 1, 2)).toBe(before);
    });
});

describe('setQuantity', () => {
    it.each([
        // carrito, id, cantidad, stock → carrito resultante
        ['4x2', 4, 5, 10, '4x5'],
        ['4x2', 4, 1, 10, '4x1'], // también para bajar
        ['4x2', 4, 9, 6, '4x6'], // limitada al stock
        ['4x2 7x1', 7, 3, 3, '4x2 7x3'], // solo cambia esa línea
        ['4x2', 4, 2, 10, '4x2'], // misma cantidad
    ])('[%s] → id %s a %s (stock %s) = [%s]', (items, variantId, quantity, stock, expected) => {
        expect(setQuantity(cart(items), variantId, quantity, stock)).toEqual(cart(expected));
    });

    it.each([0, -1, -100])('una cantidad %s quita la línea', (quantity) => {
        expect(setQuantity(cart('4x2 7x1'), 4, quantity, 10)).toEqual(cart('7x1'));
    });

    it('sin stock quita la línea', () => {
        expect(setQuantity(cart('4x2'), 4, 3, 0)).toEqual([]);
    });

    it('si la presentación no está en el carrito no hace nada: no la añade', () => {
        const before = cart('4x2');
        expect(setQuantity(before, 7, 3, 10)).toBe(before);
    });

    it.each([
        ['decimal', 1.5],
        ['NaN', Number.NaN],
        ['infinita', Number.POSITIVE_INFINITY],
    ])('una cantidad %s no cambia el carrito', (_, quantity) => {
        const before = cart('4x2');
        expect(setQuantity(before, 4, quantity, 10)).toBe(before);
    });

    it('un id no válido no cambia el carrito', () => {
        const before = cart('4x2');
        expect(setQuantity(before, 0, 3, 10)).toBe(before);
        expect(setQuantity(before, Number.NaN, 3, 10)).toBe(before);
    });

    it('no modifica el carrito que recibe', () => {
        const before = cart('4x2');
        const snapshot = structuredClone(before);
        setQuantity(before, 4, 9, 10);
        expect(before).toEqual(snapshot);
    });

    it('devuelve el mismo carrito si la cantidad no cambia', () => {
        const before = cart('4x2');
        expect(setQuantity(before, 4, 2, 10)).toBe(before);
    });
});

describe('removeItem', () => {
    it('quita solo esa línea y conserva el orden de las demás', () => {
        expect(removeItem(cart('4x2 7x1 9x3'), 7)).toEqual(cart('4x2 9x3'));
    });

    it('quitar la última deja el carrito vacío', () => {
        expect(removeItem(cart('4x2'), 4)).toEqual([]);
    });

    it('si no estaba, devuelve el mismo carrito', () => {
        const before = cart('4x2');
        expect(removeItem(before, 9)).toBe(before);
    });

    it('no modifica el carrito que recibe', () => {
        const before = cart('4x2 7x1');
        const snapshot = structuredClone(before);
        removeItem(before, 4);
        expect(before).toEqual(snapshot);
    });
});

describe('mergeCarts', () => {
    it.each([
        // first, second, stock → carrito unido
        ['4x2', '4x3', '4:10', '4x3'], // la misma: la mayor, no la suma
        ['4x5', '4x3', '4:10', '4x5'], // la mayor es la primera
        ['4x2', '7x1', '4:9 7:9', '4x2 7x1'], // distintas: se juntan
        ['4x8', '4x9', '4:5', '4x5'], // limitada al stock
        ['4x2 9x1', '7x1 4x1', '4:9 7:9 9:9', '4x2 9x1 7x1'], // orden: first y luego lo nuevo de second
    ])('[%s] ∪ [%s] con stock [%s] → [%s]', (first, second, stocks, expected) => {
        expect(mergeCarts(cart(first), cart(second), stockOf(stocks))).toEqual(cart(expected));
    });

    it('descarta lo que no tiene stock', () => {
        expect(mergeCarts(cart('4x2 9x1'), cart(), stockOf('4:5 9:0'))).toEqual(cart('4x2'));
    });

    it('descarta lo que el servidor ya no devuelve (sin dato de stock)', () => {
        expect(mergeCarts(cart('4x2'), cart('7x1'), stockOf('4:5'))).toEqual(cart('4x2'));
    });

    it('es idempotente: unir un carrito consigo mismo no cambia nada', () => {
        const mine = cart('4x2 7x1 9x3');
        const stocks = stockOf('4:9 7:9 9:9');
        expect(mergeCarts(mine, mine, stocks)).toEqual(mine);
        expect(mergeCarts(mergeCarts(mine, mine, stocks), mine, stocks)).toEqual(mine);
    });

    it('con un carrito vacío queda el otro (limitado al stock)', () => {
        expect(mergeCarts(cart(), cart('4x2'), stockOf('4:9'))).toEqual(cart('4x2'));
        expect(mergeCarts(cart('4x2'), cart(), stockOf('4:1'))).toEqual(cart('4x1'));
        expect(mergeCarts(cart(), cart(), stockOf())).toEqual([]);
    });

    it('junta las líneas repetidas de un mismo carrito', () => {
        expect(mergeCarts(cart('4x2 4x5'), cart(), stockOf('4:9'))).toEqual(cart('4x5'));
    });

    it('ignora las líneas con id o cantidad no válidos', () => {
        const dirty = [
            { variantId: 4, quantity: 2 },
            { variantId: 0, quantity: 2 },
            { variantId: 7, quantity: 0 },
            { variantId: 9, quantity: 1.5 },
            { variantId: Number.NaN, quantity: 1 },
        ];
        expect(mergeCarts(dirty, cart(), stockOf('4:9 7:9 9:9'))).toEqual(cart('4x2'));
    });

    it(`se queda con las primeras ${CART_MAX_LINES} líneas`, () => {
        const extra = cart('1000x1 1001x1');
        const stocks = new Map([...fullCart(), ...extra].map((i) => [i.variantId, 9]));
        const merged = mergeCarts(fullCart(), extra, stocks);
        expect(merged).toHaveLength(CART_MAX_LINES);
        expect(merged).toEqual(fullCart());
    });

    it('las líneas descartadas no ocupan sitio: entran las siguientes', () => {
        const first = fullCart();
        // la primera no tiene stock, así que la 51.ª cabe
        const stocks = new Map([
            ...first.map((i): [number, number] => [i.variantId, i.variantId === 1 ? 0 : 9]),
            [51, 9] as [number, number],
        ]);
        const merged = mergeCarts(first, cart('51x1'), stocks);
        expect(merged).toHaveLength(CART_MAX_LINES);
        expect(merged.at(-1)).toEqual({ variantId: 51, quantity: 1 });
    });

    it('si el resultado es igual al primer carrito, devuelve ese mismo carrito', () => {
        const first = cart('4x2 7x1');
        expect(mergeCarts(first, cart(), stockOf('4:9 7:9'))).toBe(first);
        expect(mergeCarts(first, cart('7x1'), stockOf('4:9 7:9'))).toBe(first);
        expect(mergeCarts(first, first, stockOf('4:9 7:9'))).toBe(first);
    });

    it.each([
        ['otra cantidad', '4x2 7x2', '4:9 7:9'],
        ['una línea más', '4x2 7x1 9x1', '4:9 7:9 9:9'],
        ['una línea menos por falta de stock', '4x2 7x1', '4:9 7:0'],
        ['una cantidad limitada por el stock', '4x2 7x1', '4:1 7:9'],
    ])('si cambia algo (%s), devuelve un carrito nuevo', (_, second, stocks) => {
        const first = cart('4x2 7x1');
        const merged = mergeCarts(first, cart(second), stockOf(stocks));
        expect(merged).not.toBe(first);
        expect(merged).not.toEqual(first);
    });

    it('no modifica los carritos que recibe', () => {
        const a = cart('4x2');
        const b = cart('4x3 7x1');
        const snapshot = structuredClone([a, b]);
        mergeCarts(a, b, stockOf('4:9 7:9'));
        expect([a, b]).toEqual(snapshot);
    });
});
