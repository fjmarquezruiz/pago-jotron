import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUserId = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUserId: () => getSessionUserId() }));

const createOrder = vi.fn();
vi.mock('@/lib/orders/create', () => ({
    createOrder: (userId: number, input: unknown) => createOrder(userId, input),
}));

import { PaymentError } from '@/lib/payments';
import { POST } from './route';

const URL = 'http://localhost/api/checkout/pedido';
const post = (body: string) => POST(new Request(URL, { method: 'POST', body }));
const postJson = (body: unknown) => post(JSON.stringify(body));

const card = {
    paymentMethod: 'Tarjeta',
    shippingTypeId: 1,
    shippingAddressId: 3,
    paymentIntentId: 'pi_1',
};
const order = {
    orderId: 12,
    orderNumber: 'PJ-12',
    status: 'Confirmado',
    paymentMethod: 'Tarjeta',
};

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUserId.mockReset().mockResolvedValue(12);
    createOrder.mockReset().mockResolvedValue({ ok: true, created: true, order });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('POST /api/checkout/pedido', () => {
    it('crea el pedido con la cuenta de la sesión y responde 201', async () => {
        const response = await postJson({ ...card, userId: 99, amount: 1 });

        expect(response.status).toBe(201);
        expect(await response.json()).toEqual(order);
        expect(createOrder).toHaveBeenCalledWith(12, card);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('un pedido que ya existía responde 200', async () => {
        createOrder.mockResolvedValue({ ok: true, created: false, order });
        const response = await postJson(card);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(order);
    });

    it('sin sesión responde 401 antes de leer el cuerpo', async () => {
        getSessionUserId.mockResolvedValue(null);
        expect((await post('no es json')).status).toBe(401);
        expect(createOrder).not.toHaveBeenCalled();
    });

    it('un cuerpo que no es JSON da 400', async () => {
        expect((await post('{no')).status).toBe(400);
        expect(createOrder).not.toHaveBeenCalled();
    });

    it('un cuerpo inválido da 400 con los errores por campo', async () => {
        const response = await postJson({ ...card, paymentIntentId: undefined });
        expect(response.status).toBe(400);
        expect((await response.json()).errors).toHaveProperty('paymentIntentId');
        expect(createOrder).not.toHaveBeenCalled();
    });

    it('la transferencia con paymentIntentId da 400', async () => {
        const response = await postJson({ ...card, paymentMethod: 'Transferencia' });
        expect(response.status).toBe(400);
    });

    it.each([
        ['empty_cart', 400],
        ['shipping_not_found', 404],
        ['address_not_found', 404],
        ['billing_not_found', 404],
        ['payment_not_found', 404],
        ['payment_forbidden', 403],
        ['stock', 409],
        ['payment_mismatch', 409],
        ['payment_failed', 402],
    ])('el fallo %s responde %i con su mensaje', async (code, status) => {
        createOrder.mockResolvedValue({ ok: false, code, message: 'Motivo' });
        const response = await postJson(card);
        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({ message: 'Motivo' });
    });

    it('el fallo de stock lleva los problemas', async () => {
        const problems = [{ variantId: 4, available: 1 }];
        createOrder.mockResolvedValue({ ok: false, code: 'stock', message: 'Sin stock', problems });
        expect(await (await postJson(card)).json()).toEqual({ message: 'Sin stock', problems });
    });

    it('un fallo de la pasarela al comprobar el pago da 502 sin filtrar detalles', async () => {
        createOrder.mockRejectedValue(new PaymentError('detalle secreto', 'api_error'));
        const response = await postJson(card);
        expect(response.status).toBe(502);
        expect(JSON.stringify(await response.json())).not.toContain('secreto');
    });

    it('un error inesperado da 500 sin filtrar detalles', async () => {
        createOrder.mockRejectedValue(new Error('insert secreto'));
        const response = await postJson(card);
        expect(response.status).toBe(500);
        expect(JSON.stringify(await response.json())).not.toContain('secreto');
    });
});
