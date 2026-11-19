import { describe, expect, it, vi } from 'vitest';
import {
    EMPTY_CARD_FIELDS,
    LOGIN_URL,
    REJECTED_URL,
    buildOrderBody,
    buildPaymentBody,
    canPlaceOrder,
    classifyCardResult,
    confirmationUrl,
    mapOrderResponse,
    parseAuthorization,
    parseOrderId,
    placeOrder,
    type CanPlaceOrderInput,
    type OrderSelection,
    type PaymentFetch,
} from '@/lib/checkout/payment';

const selection: OrderSelection = {
    shippingTypeId: 2,
    shippingAddressId: 5,
    billingSameAsShipping: true,
    billingAddressId: null,
};

const READY: CanPlaceOrderInput = {
    method: 'Tarjeta',
    hasQuote: true,
    shippingTypeId: 2,
    shippingAddressId: 5,
    billingSameAsShipping: true,
    billingAddressId: null,
    stripeReady: true,
    cardFields: { number: true, expiry: true, cvc: true },
    holderName: 'Ana García',
    submitting: false,
};

describe('canPlaceOrder', () => {
    it('con tarjeta completa, nombre y todo lo demás, se puede', () => {
        expect(canPlaceOrder(READY)).toBe(true);
    });

    it.each([
        ['Stripe sin cargar', { stripeReady: false }],
        ['número incompleto', { cardFields: { number: false, expiry: true, cvc: true } }],
        ['caducidad incompleta', { cardFields: { number: true, expiry: false, cvc: true } }],
        ['CVC incompleto', { cardFields: { number: true, expiry: true, cvc: false } }],
        ['nombre vacío', { holderName: '' }],
        ['nombre solo con espacios', { holderName: '   ' }],
        ['enviando', { submitting: true }],
        ['sin presupuesto', { hasQuote: false }],
        ['sin envío', { shippingTypeId: null }],
        ['sin dirección', { shippingAddressId: null }],
        ['facturación distinta sin elegir', { billingSameAsShipping: false }],
    ] as const)('con tarjeta, no se puede con %s', (_name, patch) => {
        expect(canPlaceOrder({ ...READY, ...patch })).toBe(false);
    });

    it('con facturación distinta ya elegida, se puede', () => {
        expect(canPlaceOrder({ ...READY, billingSameAsShipping: false, billingAddressId: 9 })).toBe(
            true,
        );
    });

    it('con transferencia no hace falta tarjeta ni nombre ni Stripe', () => {
        expect(
            canPlaceOrder({
                ...READY,
                method: 'Transferencia',
                stripeReady: false,
                cardFields: EMPTY_CARD_FIELDS,
                holderName: '',
            }),
        ).toBe(true);
    });

    it('con transferencia sigue haciendo falta envío, dirección y que no haya nada en vuelo', () => {
        const transfer = { ...READY, method: 'Transferencia' } as const;
        expect(canPlaceOrder({ ...transfer, shippingAddressId: null })).toBe(false);
        expect(canPlaceOrder({ ...transfer, submitting: true })).toBe(false);
    });
});

describe('classifyCardResult', () => {
    it('requires_capture es autorizado', () => {
        expect(
            classifyCardResult({ paymentIntent: { id: 'pi_1', status: 'requires_capture' } }),
        ).toEqual({ kind: 'authorized', paymentIntentId: 'pi_1' });
    });

    it.each(['card_error', 'validation_error'])('el error %s es un rechazo', (type) => {
        expect(classifyCardResult({ error: { type } })).toEqual({ kind: 'declined' });
    });

    it('el fallo de autenticación 3-D Secure es un rechazo', () => {
        expect(
            classifyCardResult({
                error: {
                    type: 'invalid_request_error',
                    code: 'payment_intent_authentication_failure',
                },
            }),
        ).toEqual({ kind: 'declined' });
    });

    it('un intento devuelto en requires_payment_method es un rechazo', () => {
        expect(
            classifyCardResult({
                paymentIntent: { id: 'pi_1', status: 'requires_payment_method' },
            }),
        ).toEqual({ kind: 'declined' });
    });

    it.each(['api_connection_error', 'api_error', 'rate_limit_error', 'invalid_request_error'])(
        'el error %s es un fallo, no un rechazo',
        (type) => {
            expect(classifyCardResult({ error: { type } })).toEqual({ kind: 'failed' });
        },
    );

    it.each(['succeeded', 'processing', 'requires_action', 'canceled'])(
        'el estado %s es inesperado con captura manual: fallo',
        (status) => {
            expect(classifyCardResult({ paymentIntent: { id: 'pi_1', status } })).toEqual({
                kind: 'failed',
            });
        },
    );

    it('sin resultado o vacío es un fallo', () => {
        expect(classifyCardResult(undefined)).toEqual({ kind: 'failed' });
        expect(classifyCardResult({})).toEqual({ kind: 'failed' });
    });
});

describe('cuerpos de las peticiones', () => {
    it('el de /pago lleva solo envío y dirección', () => {
        expect(buildPaymentBody({ ...selection, billingAddressId: 8 })).toEqual({
            shippingTypeId: 2,
            shippingAddressId: 5,
        });
    });

    it('el pedido con tarjeta lleva el PaymentIntent y no la facturación si es la misma', () => {
        expect(buildOrderBody('Tarjeta', selection, 'pi_9')).toEqual({
            paymentMethod: 'Tarjeta',
            shippingTypeId: 2,
            shippingAddressId: 5,
            paymentIntentId: 'pi_9',
        });
    });

    it('con la casilla desmarcada lleva la dirección de facturación', () => {
        expect(
            buildOrderBody(
                'Tarjeta',
                { ...selection, billingSameAsShipping: false, billingAddressId: 8 },
                'pi_9',
            ),
        ).toMatchObject({ billingAddressId: 8 });
    });

    it('con la casilla marcada no manda la facturación aunque quede una guardada', () => {
        expect(
            buildOrderBody('Tarjeta', { ...selection, billingAddressId: 8 }, 'pi_9'),
        ).not.toHaveProperty('billingAddressId');
    });

    it('la transferencia nunca lleva paymentIntentId', () => {
        expect(buildOrderBody('Transferencia', selection, 'pi_9')).toEqual({
            paymentMethod: 'Transferencia',
            shippingTypeId: 2,
            shippingAddressId: 5,
        });
    });
});

describe('parseAuthorization y parseOrderId', () => {
    const body = {
        clientSecret: 'pi_1_secret_x',
        paymentIntentId: 'pi_1',
        quote: { subtotalCents: 4000, shippingCents: 495, totalCents: 4495, vat: [] },
    };

    it('acepta la respuesta del servidor', () => {
        expect(parseAuthorization(body)).toEqual({
            clientSecret: 'pi_1_secret_x',
            paymentIntentId: 'pi_1',
            quote: { subtotalCents: 4000, shippingCents: 495, totalCents: 4495 },
        });
    });

    it.each([
        ['null', null],
        ['sin presupuesto', { ...body, quote: undefined }],
        ['secreto numérico', { ...body, clientSecret: 1 }],
        ['importe decimal', { ...body, quote: { ...body.quote, totalCents: 44.95 } }],
    ])('rechaza %s', (_name, value) => {
        expect(parseAuthorization(value)).toBeNull();
    });

    it('lee el orderId solo si es un entero positivo', () => {
        expect(parseOrderId({ orderId: 12 })).toBe(12);
        expect(parseOrderId({ orderId: '12' })).toBeNull();
        expect(parseOrderId({ orderId: 0 })).toBeNull();
        expect(parseOrderId(undefined)).toBeNull();
    });
});

describe('mapOrderResponse', () => {
    it('201 y 200 van a la confirmación', () => {
        const done = { kind: 'done', url: confirmationUrl(12) };
        expect(
            mapOrderResponse('Tarjeta', { status: 201, ok: true, json: { orderId: 12 } }),
        ).toEqual(done);
        expect(
            mapOrderResponse('Transferencia', { status: 200, ok: true, json: { orderId: 12 } }),
        ).toEqual(done);
    });

    it('401 va al login con cualquier método', () => {
        for (const method of ['Tarjeta', 'Transferencia'] as const) {
            expect(mapOrderResponse(method, { status: 401, ok: false, json: {} })).toEqual({
                kind: 'login',
                url: LOGIN_URL,
            });
        }
    });

    it.each([402, 409, 500, 502])(
        'con tarjeta, %s va a la pantalla roja de Confirmar',
        (status) => {
            expect(mapOrderResponse('Tarjeta', { status, ok: false, json: {} })).toEqual({
                kind: 'rejected',
                url: REJECTED_URL,
            });
        },
    );

    it('con tarjeta, un 201 sin orderId también es rechazo', () => {
        expect(mapOrderResponse('Tarjeta', { status: 201, ok: true, json: {} })).toEqual({
            kind: 'rejected',
            url: REJECTED_URL,
        });
    });

    it('con transferencia, un fallo deja la página en estado de error', () => {
        expect(mapOrderResponse('Transferencia', { status: 409, ok: false, json: {} })).toEqual({
            kind: 'error',
            reason: 'failed',
        });
    });
});

/** `fetch` que responde en orden con (estado, cuerpo). */
function fakeFetch(...responses: [number, unknown][]) {
    const queue = [...responses];
    return vi.fn<PaymentFetch>(async () => {
        const [status, body] = queue.shift() ?? [500, {}];
        return new Response(JSON.stringify(body), { status });
    });
}

const authorizationBody = {
    clientSecret: 'pi_1_secret_x',
    paymentIntentId: 'pi_1',
    quote: { subtotalCents: 4000, shippingCents: 495, totalCents: 4495 },
};
const authorized = { paymentIntent: { id: 'pi_1', status: 'requires_capture' } };

describe('placeOrder con tarjeta', () => {
    it('autoriza, confirma y crea el pedido', async () => {
        const fetchFn = fakeFetch([200, authorizationBody], [201, { orderId: 7 }]);
        const confirmCard = vi.fn(async () => authorized);

        const result = await placeOrder({
            method: 'Tarjeta',
            selection,
            expectedTotalCents: 4495,
            confirmCard,
            fetchFn,
        });

        expect(result).toEqual({ kind: 'done', url: '/checkout/confirmacion?pedido=7' });
        expect(confirmCard).toHaveBeenCalledWith('pi_1_secret_x');
        expect(fetchFn.mock.calls.map(([url]) => url)).toEqual([
            '/api/checkout/pago',
            '/api/checkout/pedido',
        ]);
        expect(JSON.parse(String(fetchFn.mock.calls[1][1].body))).toEqual({
            paymentMethod: 'Tarjeta',
            shippingTypeId: 2,
            shippingAddressId: 5,
            paymentIntentId: 'pi_1',
        });
    });

    it('si el banco rechaza la tarjeta, se queda en Pago y no crea el pedido', async () => {
        const fetchFn = fakeFetch([200, authorizationBody]);
        const result = await placeOrder({
            method: 'Tarjeta',
            selection,
            expectedTotalCents: 4495,
            confirmCard: async () => ({ error: { type: 'card_error' } }),
            fetchFn,
        });
        expect(result).toEqual({ kind: 'error', reason: 'declined' });
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('si confirmCard lanza, es un fallo y no crea el pedido', async () => {
        const fetchFn = fakeFetch([200, authorizationBody]);
        const result = await placeOrder({
            method: 'Tarjeta',
            selection,
            expectedTotalCents: 4495,
            confirmCard: async () => {
                throw new Error('red');
            },
            fetchFn,
        });
        expect(result).toEqual({ kind: 'error', reason: 'failed' });
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('si el importe del servidor no es el que se enseñaba, no confirma la tarjeta', async () => {
        const confirmCard = vi.fn(async () => authorized);
        const result = await placeOrder({
            method: 'Tarjeta',
            selection,
            expectedTotalCents: 4000,
            confirmCard,
            fetchFn: fakeFetch([200, authorizationBody]),
        });
        expect(result).toEqual({
            kind: 'price-changed',
            quote: { subtotalCents: 4000, shippingCents: 495, totalCents: 4495 },
        });
        expect(confirmCard).not.toHaveBeenCalled();
    });

    it.each([
        [401, { kind: 'login', url: LOGIN_URL }],
        [400, { kind: 'cart', url: '/carrito' }],
        [409, { kind: 'cart', url: '/carrito' }],
        [404, { kind: 'data', url: '/checkout' }],
        [502, { kind: 'error', reason: 'failed' }],
        [500, { kind: 'error', reason: 'failed' }],
    ])('si /pago responde %s, no se confirma nada', async (status, expected) => {
        const confirmCard = vi.fn(async () => authorized);
        const result = await placeOrder({
            method: 'Tarjeta',
            selection,
            expectedTotalCents: 4495,
            confirmCard,
            fetchFn: fakeFetch([status, {}]),
        });
        expect(result).toEqual(expected);
        expect(confirmCard).not.toHaveBeenCalled();
    });

    it('si /pago no responde (red), es un fallo', async () => {
        const result = await placeOrder({
            method: 'Tarjeta',
            selection,
            expectedTotalCents: 4495,
            confirmCard: async () => authorized,
            fetchFn: async () => {
                throw new TypeError('fetch failed');
            },
        });
        expect(result).toEqual({ kind: 'error', reason: 'failed' });
    });

    it.each([409, 402, 500])(
        'si /pedido responde %s tras autorizar, va a la pantalla roja',
        async (status) => {
            const result = await placeOrder({
                method: 'Tarjeta',
                selection,
                expectedTotalCents: 4495,
                confirmCard: async () => authorized,
                fetchFn: fakeFetch([200, authorizationBody], [status, { message: 'x' }]),
            });
            expect(result).toEqual({ kind: 'rejected', url: REJECTED_URL });
        },
    );

    it('si /pedido no responde (red) tras autorizar, va a la pantalla roja', async () => {
        let calls = 0;
        const result = await placeOrder({
            method: 'Tarjeta',
            selection,
            expectedTotalCents: 4495,
            confirmCard: async () => authorized,
            fetchFn: async () => {
                calls += 1;
                if (calls === 1) {
                    return new Response(JSON.stringify(authorizationBody), { status: 200 });
                }
                throw new TypeError('fetch failed');
            },
        });
        expect(result).toEqual({ kind: 'rejected', url: REJECTED_URL });
    });
});

describe('placeOrder con transferencia', () => {
    it('crea el pedido sin pasar por /pago ni por Stripe', async () => {
        const fetchFn = fakeFetch([201, { orderId: 3 }]);
        const confirmCard = vi.fn(async () => authorized);
        const result = await placeOrder({
            method: 'Transferencia',
            selection: { ...selection, billingSameAsShipping: false, billingAddressId: 8 },
            expectedTotalCents: 4495,
            confirmCard,
            fetchFn,
        });
        expect(result).toEqual({ kind: 'done', url: '/checkout/confirmacion?pedido=3' });
        expect(confirmCard).not.toHaveBeenCalled();
        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(fetchFn.mock.calls[0][1].body))).toEqual({
            paymentMethod: 'Transferencia',
            shippingTypeId: 2,
            shippingAddressId: 5,
            billingAddressId: 8,
        });
    });

    it('un fallo deja la página en estado de error', async () => {
        const result = await placeOrder({
            method: 'Transferencia',
            selection,
            expectedTotalCents: 4495,
            confirmCard: async () => authorized,
            fetchFn: fakeFetch([409, {}]),
        });
        expect(result).toEqual({ kind: 'error', reason: 'failed' });
    });

    it('sin red, también', async () => {
        const result = await placeOrder({
            method: 'Transferencia',
            selection,
            expectedTotalCents: 4495,
            confirmCard: async () => authorized,
            fetchFn: async () => {
                throw new TypeError('fetch failed');
            },
        });
        expect(result).toEqual({ kind: 'error', reason: 'failed' });
    });
});
