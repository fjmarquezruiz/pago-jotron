import { describe, expect, it } from 'vitest';
import {
    cardOrderText,
    confirmationVariant,
    formatEstimatedDelivery,
    greetingName,
    lineLabel,
    orderSummary,
    parseConfirmationParams,
    rejectedSummary,
    rejectionSubtitle,
    thanksText,
    today,
    transferParagraphs,
} from './confirmation';
import { calendarDate } from '@/lib/orders/delivery';
import type { ConfirmationOrder } from '@/lib/validations/order-response';

const address = {
    recipientName: 'María Pérez',
    phone: '600000000',
    streetType: 'Calle' as const,
    streetName: 'de la Encina',
    number: '12',
    floor: '4B',
    postalCode: '29001',
    city: 'Málaga',
    country: 'España',
};

const order: ConfirmationOrder = {
    id: 12,
    number: 'PJ-12',
    status: 'Confirmado',
    paymentMethod: 'Tarjeta',
    createdAt: '2026-10-16 18:30:00',
    shippingAddress: { ...address, province: 'Málaga' },
    shippingType: { name: 'Estándar', cost: '4.95', minDeliveryDays: 1, maxDeliveryDays: 2 },
    estimatedDelivery: '2026-10-20',
    lines: [
        {
            variantId: 4,
            name: 'Tinto Roble',
            vintage: 2020,
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            quantity: 2,
            unitPrice: '11.50',
        },
        {
            variantId: 9,
            name: 'Dulce',
            vintage: null,
            format: 'Botella',
            capacity: 500,
            capacityUnit: 'ml',
            quantity: 1,
            unitPrice: '5.50',
        },
    ],
    quote: { subtotalCents: 2850, shippingCents: 495, totalCents: 3345 },
};

describe('parseConfirmationParams', () => {
    it('un pedido válido', () => {
        expect(parseConfirmationParams({ pedido: '4521' })).toEqual({
            kind: 'order',
            orderId: 4521,
        });
    });

    it('el rechazo', () => {
        expect(parseConfirmationParams({ resultado: 'rechazado' })).toEqual({
            kind: 'rejected',
        });
    });

    it('el pedido manda sobre el rechazo', () => {
        expect(parseConfirmationParams({ pedido: '3', resultado: 'rechazado' })).toEqual({
            kind: 'order',
            orderId: 3,
        });
    });

    it('un pedido no válido cae al rechazo si lo hay, y si no es inválido', () => {
        expect(parseConfirmationParams({ pedido: 'abc', resultado: 'rechazado' })).toEqual({
            kind: 'rejected',
        });
        for (const pedido of ['abc', '0', '-1', '1.5', '', '99999999999999999999'])
            expect(parseConfirmationParams({ pedido })).toEqual({ kind: 'invalid' });
    });

    it('sin parámetros o con otro resultado es inválido', () => {
        expect(parseConfirmationParams({})).toEqual({ kind: 'invalid' });
        expect(parseConfirmationParams({ resultado: 'ok' })).toEqual({ kind: 'invalid' });
    });

    it('con un parámetro repetido usa el primero', () => {
        expect(parseConfirmationParams({ pedido: ['7', '8'] })).toEqual({
            kind: 'order',
            orderId: 7,
        });
    });
});

describe('confirmationVariant', () => {
    it('tarjeta confirmada y transferencia pendiente', () => {
        expect(confirmationVariant({ paymentMethod: 'Tarjeta', status: 'Confirmado' })).toBe(
            'card',
        );
        expect(
            confirmationVariant({ paymentMethod: 'Transferencia', status: 'Pendiente de pago' }),
        ).toBe('transfer');
    });

    it('lo demás no tiene variante', () => {
        expect(confirmationVariant({ paymentMethod: 'Tarjeta', status: 'Cancelado' })).toBeNull();
        expect(
            confirmationVariant({ paymentMethod: 'Transferencia', status: 'Confirmado' }),
        ).toBeNull();
        expect(confirmationVariant({ paymentMethod: 'PayPal', status: 'Confirmado' })).toBeNull();
    });
});

describe('textos', () => {
    it('el nombre de pila sale del perfil', () => {
        expect(greetingName({ name: ' María ' })).toBe('María');
        expect(greetingName({ name: '  ' })).toBeNull();
        expect(greetingName(null)).toBeNull();
    });

    it('el saludo y el rechazo, con y sin nombre', () => {
        expect(thanksText('María')).toBe('Gracias por tu compra, María.');
        expect(thanksText(null)).toBe('Gracias por tu compra.');
        expect(rejectionSubtitle('María')).toBe(
            'Lo sentimos, María. Hubo un problema con la transacción.',
        );
        expect(rejectionSubtitle(null)).toBe('Lo sentimos. Hubo un problema con la transacción.');
    });

    it('el texto del pedido con tarjeta lleva número y correo', () => {
        expect(cardOrderText('PJ-4521', 'maria@ejemplo.com')).toBe(
            'Tu pedido #PJ-4521 ha sido registrado y se procesará pronto. Recibirás un correo de confirmación en maria@ejemplo.com.',
        );
        expect(cardOrderText('PJ-4521', null)).toBe(
            'Tu pedido #PJ-4521 ha sido registrado y se procesará pronto.',
        );
    });

    it('la transferencia lleva titular, IBAN y el número de pedido como concepto', () => {
        expect(
            transferParagraphs('PJ-4521', { holder: 'Pago de Jotrón S.L.', iban: 'ES12' }),
        ).toEqual([
            'Tu pedido #PJ-4521 está pendiente de pago. Haz la transferencia con estos datos y lo prepararemos en cuanto confirmemos el cobro.',
            'Titular: Pago de Jotrón S.L.',
            'IBAN: ES12',
            'Concepto: PJ-4521',
        ]);
    });

    it('sin datos bancarios se omiten titular e IBAN', () => {
        expect(transferParagraphs('PJ-4521', null)).toEqual([
            'Tu pedido #PJ-4521 está pendiente de pago. Haz la transferencia y lo prepararemos en cuanto confirmemos el cobro.',
            'Concepto: PJ-4521',
        ]);
    });
});

describe('formatEstimatedDelivery', () => {
    it('da el formato del diseño', () => {
        expect(formatEstimatedDelivery('2026-10-15')).toBe('Jue, 15 oct');
    });

    it('sin fecha o con una fecha inválida, nada', () => {
        expect(formatEstimatedDelivery(null)).toBeNull();
        expect(formatEstimatedDelivery('mañana')).toBeNull();
    });
});

describe('lineLabel', () => {
    it('pone la presentación entre paréntesis', () => {
        expect(
            lineLabel({ name: 'Tinto', format: 'Botella', capacity: 750, capacityUnit: 'ml' }),
        ).toBe('Tinto (Botella 75 cl)');
    });
});

describe('orderSummary', () => {
    it('pasa el pedido a céntimos enteros y toma el envío y el total del servidor', () => {
        expect(orderSummary(order)).toEqual({
            address: order.shippingAddress,
            estimatedDelivery: 'Mar, 20 oct',
            items: [
                {
                    id: 4,
                    name: 'Tinto Roble (Botella 75 cl)',
                    quantity: 2,
                    unitCents: 1150,
                    totalCents: 2300,
                },
                {
                    id: 9,
                    name: 'Dulce (Botella 50 cl)',
                    quantity: 1,
                    unitCents: 550,
                    totalCents: 550,
                },
            ],
            shipping: { name: 'Estándar', cents: 495 },
            totalCents: 3345,
        });
    });

    it('sin plazo no hay fecha', () => {
        expect(orderSummary({ ...order, estimatedDelivery: null }).estimatedDelivery).toBeNull();
    });
});

describe('rejectedSummary', () => {
    const lines = [
        {
            variantId: 4,
            name: 'Tinto',
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml' as const,
            price: '11.50',
        },
        {
            variantId: 9,
            name: 'Dulce',
            format: 'Botella',
            capacity: 500,
            capacityUnit: 'ml' as const,
            price: '5.50',
        },
    ];
    const base = {
        lines,
        address,
        shippingType: { name: 'Estándar', cost: '4.95', maxDeliveryDays: 2 },
        today: calendarDate('2026-10-16'),
    };

    it('suma el carrito más el envío y estima la entrega', () => {
        const summary = rejectedSummary({
            ...base,
            cart: [
                { variantId: 4, quantity: 2 },
                { variantId: 9, quantity: 1 },
            ],
        });
        expect(summary?.items.map((item) => item.totalCents)).toEqual([2300, 550]);
        expect(summary?.shipping).toEqual({ name: 'Estándar', cents: 495 });
        expect(summary?.totalCents).toBe(3345);
        // Viernes 16 + 2 laborables = martes 20.
        expect(summary?.estimatedDelivery).toBe('Mar, 20 oct');
    });

    it('ignora lo que ya no está en el catálogo y devuelve null si no queda nada', () => {
        expect(
            rejectedSummary({
                ...base,
                cart: [
                    { variantId: 4, quantity: 1 },
                    { variantId: 77, quantity: 3 },
                ],
            })?.totalCents,
        ).toBe(1150 + 495);
        expect(rejectedSummary({ ...base, cart: [{ variantId: 77, quantity: 1 }] })).toBeNull();
        expect(rejectedSummary({ ...base, cart: [] })).toBeNull();
    });

    it('una modalidad sin plazo no tiene fecha', () => {
        const summary = rejectedSummary({
            ...base,
            cart: [{ variantId: 4, quantity: 1 }],
            shippingType: { name: 'Recogida', cost: '0.00', maxDeliveryDays: null },
        });
        expect(summary?.estimatedDelivery).toBeNull();
        expect(summary?.totalCents).toBe(1150);
    });
});

describe('today', () => {
    it('es el día de calendario en UTC', () => {
        expect(today(new Date('2026-10-16T23:59:00Z')).toISOString()).toBe(
            '2026-10-16T00:00:00.000Z',
        );
    });
});
