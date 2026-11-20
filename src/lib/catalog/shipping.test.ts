import { describe, expect, it } from 'vitest';
import {
    cheapestDelivery,
    deliveryOptions,
    formatBusinessDeliveryTime,
    formatDeliveryTime,
    formatShippingChoice,
    formatShippingOption,
} from './shipping';

describe('formatDeliveryTime', () => {
    it.each([
        [3, 5, '3-5 días'],
        [1, 1, '1 día'],
        [2, 2, '2 días'],
        [4, null, '4 días'],
        [null, 1, '1 día'],
        [null, null, null],
    ] as const)('%s / %s → %s', (min, max, expected) => {
        expect(formatDeliveryTime(min, max)).toBe(expected);
    });
});

describe('formatShippingOption', () => {
    // El espacio antes del € es un espacio duro (U+00A0), como lo da formatEuros.
    it.each([
        [
            { name: 'Envío estándar', cost: '4.95', minDeliveryDays: 3, maxDeliveryDays: 5 },
            'Envío estándar: 3-5 días (4,95\u00a0€).',
        ],
        [
            { name: 'Envío exprés 24 h', cost: '9.95', minDeliveryDays: 1, maxDeliveryDays: 1 },
            'Envío exprés 24 h: 1 día (9,95\u00a0€).',
        ],
        [
            {
                name: 'Recogida en bodega',
                cost: '0.00',
                minDeliveryDays: null,
                maxDeliveryDays: null,
            },
            'Recogida en bodega (gratis).',
        ],
        [
            { name: 'Envío gratis', cost: '0.00', minDeliveryDays: 2, maxDeliveryDays: 3 },
            'Envío gratis: 2-3 días (gratis).',
        ],
    ] as const)('%j → %j', (option, expected) => {
        expect(formatShippingOption(option)).toBe(expected);
    });
});

describe('cheapestDelivery', () => {
    const standard = {
        name: 'Envío estándar',
        cost: '4.95',
        minDeliveryDays: 3,
        maxDeliveryDays: 5,
    };
    const express = {
        name: 'Envío exprés 24 h',
        cost: '9.95',
        minDeliveryDays: 1,
        maxDeliveryDays: 1,
    };
    const pickup = {
        name: 'Recogida en bodega',
        cost: '0.00',
        minDeliveryDays: null,
        maxDeliveryDays: null,
    };

    it.each([
        ['los datos reales', [standard, express, pickup], standard],
        ['los datos reales en otro orden', [pickup, express, standard], standard],
        ['solo el estándar', [standard], standard],
        ['solo el exprés', [express], express],
        ['estándar y exprés', [express, standard], standard],
    ])('con %s elige la más barata con plazo', (_, options, expected) => {
        expect(cheapestDelivery(options)).toBe(expected);
    });

    it('excluye la recogida en bodega aunque sea la más barata (gratis)', () => {
        expect(cheapestDelivery([pickup, express])).toBe(express);
    });

    it.each([
        ['solo la recogida', [pickup]],
        ['varias sin plazo', [pickup, { ...pickup, name: 'Otra recogida', cost: '1.00' }]],
        ['lista vacía', []],
    ])('con %s devuelve null', (_, options) => {
        expect(cheapestDelivery(options)).toBeNull();
    });

    it.each([
        ['solo el mínimo', { ...express, minDeliveryDays: 2, maxDeliveryDays: null }],
        ['solo el máximo', { ...express, minDeliveryDays: null, maxDeliveryDays: 4 }],
    ])('una modalidad con %s sí tiene plazo', (_, option) => {
        expect(cheapestDelivery([pickup, option])).toBe(option);
    });

    it('compara los costes como importes, no como texto', () => {
        const cheap = { ...standard, name: 'Barata', cost: '9.95' };
        const dear = { ...standard, name: 'Cara', cost: '10.00' }; // como texto, '10.00' < '9.95'
        expect(cheapestDelivery([dear, cheap])).toBe(cheap);
    });

    it('compara los costes en céntimos enteros, también con distinto número de decimales', () => {
        const a = { ...standard, name: 'A', cost: '4.9' };
        const b = { ...standard, name: 'B', cost: '4.95' };
        expect(cheapestDelivery([b, a])).toBe(a);
    });

    describe('con empate de coste', () => {
        it('gana el menor plazo máximo', () => {
            const slow = { ...standard, name: 'Lento', cost: '5.00' };
            const fast = { ...standard, name: 'Rápido', cost: '5.00', maxDeliveryDays: 4 };
            expect(cheapestDelivery([slow, fast])).toBe(fast);
        });

        it('si falta el máximo, cuenta el mínimo como plazo', () => {
            const onlyMin = {
                ...standard,
                name: 'Solo mínimo',
                cost: '5.00',
                maxDeliveryDays: null,
            };
            const range = {
                ...standard,
                name: 'Rango',
                cost: '5.00',
                minDeliveryDays: 1,
                maxDeliveryDays: 4,
            };
            expect(cheapestDelivery([range, onlyMin])).toBe(onlyMin); // 3 días < hasta 4
        });

        it('con el mismo máximo, gana el menor mínimo (un mínimo nulo cuenta 0)', () => {
            const late = {
                ...standard,
                name: 'Tarde',
                cost: '5.00',
                minDeliveryDays: 3,
                maxDeliveryDays: 3,
            };
            const early = {
                ...standard,
                name: 'Pronto',
                cost: '5.00',
                minDeliveryDays: 1,
                maxDeliveryDays: 3,
            };
            const noMin = {
                ...standard,
                name: 'Sin mínimo',
                cost: '5.00',
                minDeliveryDays: null,
                maxDeliveryDays: 3,
            };
            expect(cheapestDelivery([late, early])).toBe(early);
            expect(cheapestDelivery([early, noMin])).toBe(noMin);
        });

        it('si empatan en todo, gana la primera en el orden recibido', () => {
            const first = { ...standard, name: 'Primera', cost: '5.00' };
            const second = { ...standard, name: 'Segunda', cost: '5.00' };
            expect(cheapestDelivery([first, second])).toBe(first);
            expect(cheapestDelivery([second, first])).toBe(second);
        });

        it('el coste pesa más que el plazo', () => {
            const cheapSlow = {
                ...standard,
                name: 'Barato y lento',
                cost: '2.00',
                maxDeliveryDays: 9,
            };
            const dearFast = { ...express, name: 'Caro y rápido', cost: '2.01' };
            expect(cheapestDelivery([dearFast, cheapSlow])).toBe(cheapSlow);
        });
    });

    it('devuelve el mismo objeto que recibe, con sus campos extra', () => {
        const withId = { ...standard, shippingTypeId: 1 };
        const result = cheapestDelivery([{ ...pickup, shippingTypeId: 3 }, withId]);
        expect(result).toBe(withId);
        expect(result?.shippingTypeId).toBe(1);
    });

    it('lanza RangeError si el coste de una modalidad con plazo no es válido', () => {
        expect(() => cheapestDelivery([{ ...standard, cost: '4,95' }])).toThrow(RangeError);
    });

    it('no modifica la lista que recibe', () => {
        const options = [express, pickup, standard];
        const snapshot = structuredClone(options);
        cheapestDelivery(options);
        expect(options).toEqual(snapshot);
    });
});

describe('deliveryOptions', () => {
    const standard = { name: 'Estándar', cost: '4.95', minDeliveryDays: 3, maxDeliveryDays: 5 };
    const pickup = { name: 'Recogida', cost: '0.00', minDeliveryDays: null, maxDeliveryDays: null };
    const oneEnd = { name: 'Solo máximo', cost: '6.00', minDeliveryDays: null, maxDeliveryDays: 2 };

    it('deja fuera lo que no tiene plazo y conserva el orden', () => {
        expect(deliveryOptions([pickup, standard, oneEnd])).toEqual([standard, oneEnd]);
    });

    it('devuelve una lista vacía si ninguna tiene plazo o no hay ninguna', () => {
        expect(deliveryOptions([pickup])).toEqual([]);
        expect(deliveryOptions([])).toEqual([]);
    });
});

describe('formatBusinessDeliveryTime', () => {
    it.each([
        [3, 5, '3-5 días laborables'],
        [1, 1, '1 día laborable'],
        [2, 2, '2 días laborables'],
        [null, 1, '1 día laborable'],
        [null, null, null],
    ] as const)('%s / %s → %s', (min, max, expected) => {
        expect(formatBusinessDeliveryTime(min, max)).toBe(expected);
    });
});

describe('formatShippingChoice', () => {
    it('pone el precio entre paréntesis', () => {
        expect(formatShippingChoice({ name: 'Envío estándar', cost: '4.95' })).toBe(
            'Envío estándar (4,95\u00a0€)',
        );
    });

    it('un coste de 0 es "gratis"', () => {
        expect(formatShippingChoice({ name: 'Envío gratis', cost: '0.00' })).toBe(
            'Envío gratis (gratis)',
        );
    });
});
