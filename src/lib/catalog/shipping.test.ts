import { describe, expect, it } from 'vitest';
import { formatDeliveryTime, formatShippingOption } from './shipping';

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
