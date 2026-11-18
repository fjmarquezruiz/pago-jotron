import { describe, expect, it } from 'vitest';
import type { Cart } from './cart';
import {
    cartSubtotalCents,
    cartUnits,
    formatCents,
    formatItemCount,
    lineTotalCents,
    priceToCents,
} from './totals';

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

describe('cartUnits', () => {
    it.each([
        ['', 0], // carrito vacío
        ['4x1', 1],
        ['4x2', 2],
        ['4x2 7x3', 5], // suma cantidades, no cuenta líneas
        ['4x2 7x1 9x10', 13],
    ])('[%s] → %s unidades', (items, expected) => {
        expect(cartUnits(cart(items))).toBe(expected);
    });

    it('no modifica el carrito', () => {
        const before = cart('4x2 7x3');
        const snapshot = structuredClone(before);
        cartUnits(before);
        expect(before).toEqual(snapshot);
    });
});

describe('priceToCents', () => {
    it.each([
        ['9.50', 950],
        ['9.5', 950], // un decimal
        ['9.05', 905], // el cero a la izquierda del decimal cuenta
        ['9.5', 950],
        ['12', 1200], // sin decimales
        ['0.00', 0],
        ['0', 0],
        ['0.01', 1],
        ['0.10', 10],
        ['00.50', 50], // ceros a la izquierda
        ['1234.56', 123456],
        ['4.95', 495],
        ['19.99', 1999],
        ['0.29', 29], // con floats, 0.29 * 100 = 28.999999999999996
        ['1.15', 115], // con floats, 1.15 * 100 = 114.99999999999999
        ['8.2', 820],
    ])('%j → %s céntimos', (price, expected) => {
        expect(priceToCents(price)).toBe(expected);
    });

    it.each([
        ['vacío', ''],
        ['solo espacios', '   '],
        ['letras', 'abc'],
        ['negativo', '-1'],
        ['negativo con decimales', '-1.50'],
        ['con signo más', '+1'],
        ['tres decimales', '1.234'],
        ['coma decimal', '1,50'],
        ['separador de miles', '1,234.50'],
        ['punto sin decimales', '1.'],
        ['sin parte entera', '.5'],
        ['con espacios alrededor', ' 1.50 '],
        ['con el símbolo', '1.50 €'],
        ['notación científica', '1e3'],
        ['NaN', 'NaN'],
        ['Infinity', 'Infinity'],
        ['hexadecimal', '0x10'],
        ['dos puntos', '1.2.3'],
    ])('lanza RangeError con un importe %s (%j)', (_, price) => {
        expect(() => priceToCents(price)).toThrow(RangeError);
        expect(() => priceToCents(price)).toThrow(`Importe no válido: ${price}`);
    });

    it('lanza RangeError si el importe no cabe en un entero seguro', () => {
        expect(() => priceToCents('99999999999999999999')).toThrow(RangeError);
    });
});

describe('lineTotalCents', () => {
    it.each([
        ['9.50', 3, 2850],
        ['9.5', 1, 950],
        ['12', 2, 2400],
        ['0.00', 5, 0], // gratis
        ['4.95', 0, 0], // sin unidades
        ['0.29', 100, 2900], // sin errores de coma flotante
        ['1234.56', 2, 246912],
    ])('precio %j × %s → %s céntimos', (price, quantity, expected) => {
        expect(lineTotalCents(price, quantity)).toBe(expected);
    });

    it.each(['', 'abc', '-1', '1.234', '1,50'])('lanza RangeError con el precio %j', (price) => {
        expect(() => lineTotalCents(price, 2)).toThrow(RangeError);
    });
});

describe('cartSubtotalCents', () => {
    it.each([
        // carrito, precios del servidor → céntimos
        ['', [{ variantId: 4, price: '9.50' }], 0], // carrito vacío
        ['4x2', [], 0], // sin líneas del servidor
        ['', [], 0],
        ['4x2', [{ variantId: 4, price: '9.50' }], 1900],
        [
            '4x2 7x1',
            [
                { variantId: 4, price: '9.50' },
                { variantId: 7, price: '12' },
            ],
            3100,
        ],
        [
            '4x2 9x1',
            [{ variantId: 4, price: '9.5' }],
            1900, // la 9 no está en `lines`: se salta
        ],
        [
            '4x1 7x1 9x1',
            [
                { variantId: 9, price: '0.10' },
                { variantId: 4, price: '0.20' },
                { variantId: 7, price: '0.30' },
            ],
            60, // el orden de `lines` da igual y no hay errores de coma flotante
        ],
        [
            '4x3',
            [
                { variantId: 4, price: '0.00' },
                { variantId: 7, price: '99.99' }, // otra presentación que no está en el carrito
            ],
            0,
        ],
    ] as const)('[%s] con %j → %s céntimos', (items, lines, expected) => {
        expect(cartSubtotalCents(cart(items), lines)).toBe(expected);
    });

    it('lanza RangeError si el precio de una línea que se suma no es válido', () => {
        expect(() => cartSubtotalCents(cart('4x1'), [{ variantId: 4, price: '1,50' }])).toThrow(
            RangeError,
        );
    });

    it('no revisa el precio de lo que no está en el carrito', () => {
        expect(cartSubtotalCents(cart('4x1'), [{ variantId: 7, price: 'abc' }])).toBe(0);
    });

    it('no modifica el carrito ni las líneas', () => {
        const before = cart('4x2 7x1');
        const lines = [
            { variantId: 4, price: '9.50' },
            { variantId: 7, price: '12' },
        ];
        const snapshot = structuredClone([before, lines]);
        cartSubtotalCents(before, lines);
        expect([before, lines]).toEqual(snapshot);
    });
});

describe('formatCents', () => {
    // El espacio antes del € es un espacio duro (U+00A0), como lo da formatEuros.
    it.each([
        [4690, '46,90 €'],
        [0, '0,00 €'],
        [5, '0,05 €'],
        [950, '9,50 €'],
        [123456, '1234,56 €'],
        [100000, '1000,00 €'],
    ])('%s céntimos → %j', (cents, expected) => {
        expect(formatCents(cents)).toBe(expected);
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY])('lanza RangeError con %s', (cents) => {
        expect(() => formatCents(cents)).toThrow(RangeError);
    });
});

describe('formatItemCount', () => {
    it.each([
        [0, '0 artículos'],
        [1, '1 artículo'],
        [2, '2 artículos'],
        [3, '3 artículos'],
        [10, '10 artículos'],
        [99, '99 artículos'],
    ])('%s → %j', (units, expected) => {
        expect(formatItemCount(units)).toBe(expected);
    });
});
