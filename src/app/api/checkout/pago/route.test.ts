import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cartFingerprint } from '@/lib/orders/fingerprint';
import { PaymentError } from '@/lib/payments/errors';

const getSessionUserId = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUserId: () => getSessionUserId() }));

const getUserCart = vi.fn();
const getCartLines = vi.fn();
const getShippingTypeById = vi.fn();
const getUserAddress = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getUserCart: (userId: number) => getUserCart(userId),
    getCartLines: (ids: number[]) => getCartLines(ids),
    getShippingTypeById: (id: number) => getShippingTypeById(id),
    getUserAddress: (userId: number, id: number) => getUserAddress(userId, id),
}));

const createAuthorization = vi.fn();
vi.mock('@/lib/payments', async () => ({
    createAuthorization: (input: unknown) => createAuthorization(input),
    MIN_AMOUNT_CENTS: 50,
    PaymentError: (await import('@/lib/payments/errors')).PaymentError,
}));

import { POST } from './route';

const URL = 'http://localhost/api/checkout/pago';
const post = (body: string) => POST(new Request(URL, { method: 'POST', body }));
const postJson = (body: unknown) => post(JSON.stringify(body));

const request = { shippingTypeId: 2, shippingAddressId: 5 };
const cart = [
    { variantId: 4, quantity: 2 },
    { variantId: 9, quantity: 1 },
];
const lines = [
    { variantId: 4, price: '11.50', taxRate: '21.00', stock: 6 },
    { variantId: 9, price: '5.50', taxRate: '10.00', stock: 1 },
];
const shipping = { id: 2, name: 'Envío estándar', cost: '4.95' };
const address = { id: 5 };

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUserId.mockReset().mockResolvedValue(12);
    getUserCart.mockReset().mockResolvedValue(cart);
    getCartLines.mockReset().mockResolvedValue(lines);
    getShippingTypeById.mockReset().mockResolvedValue(shipping);
    getUserAddress.mockReset().mockResolvedValue(address);
    createAuthorization
        .mockReset()
        .mockResolvedValue({ id: 'pi_1', clientSecret: 'pi_1_secret_x', amountCents: 3345 });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('POST /api/checkout/pago', () => {
    it('autoriza el importe que calcula el servidor y devuelve el secreto y el presupuesto', async () => {
        const response = await postJson(request);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.clientSecret).toBe('pi_1_secret_x');
        expect(body.paymentIntentId).toBe('pi_1');
        expect(body.quote).toMatchObject({
            subtotalCents: 2850,
            shippingCents: 495,
            totalCents: 3345,
        });
        expect(body.quote.vat).toHaveLength(2);
    });

    it('crea la autorización con el total, el cliente de la sesión y la huella del carrito', async () => {
        await postJson(request);
        expect(createAuthorization).toHaveBeenCalledTimes(1);
        expect(createAuthorization).toHaveBeenCalledWith({
            amountCents: 3345,
            userId: 12,
            cartFingerprint: cartFingerprint({ lines: cart, shippingTypeId: 2, totalCents: 3345 }),
        });
    });

    it('usa el carrito, la dirección y el envío de la cuenta de la sesión', async () => {
        await postJson(request);
        expect(getUserCart).toHaveBeenCalledWith(12);
        expect(getUserAddress).toHaveBeenCalledWith(12, 5);
        expect(getShippingTypeById).toHaveBeenCalledWith(2);
        expect(getCartLines).toHaveBeenCalledWith([4, 9]);
    });

    it('el importe no sale del navegador: ignora un amount o unas líneas en el cuerpo', async () => {
        await postJson({
            ...request,
            amount: 1,
            totalCents: 1,
            items: [{ variantId: 4, quantity: 99 }],
            userId: 99,
        });
        expect(createAuthorization).toHaveBeenCalledWith(
            expect.objectContaining({ amountCents: 3345, userId: 12 }),
        );
    });

    it('no deja que se guarde la respuesta', async () => {
        expect((await postJson(request)).headers.get('Cache-Control')).toBe('no-store');
    });

    it('sin sesión responde 401 antes de leer el cuerpo ni tocar la BD', async () => {
        getSessionUserId.mockResolvedValue(null);
        const response = await post('{ no es json');
        expect(response.status).toBe(401);
        expect(getUserCart).not.toHaveBeenCalled();
        expect(createAuthorization).not.toHaveBeenCalled();
    });

    it('un cuerpo que no es JSON da 400', async () => {
        expect((await post('{ no es json')).status).toBe(400);
        expect(createAuthorization).not.toHaveBeenCalled();
    });

    it.each([
        {},
        { shippingTypeId: 2 },
        { shippingAddressId: 5 },
        { shippingTypeId: 0, shippingAddressId: 5 },
        { shippingTypeId: '2', shippingAddressId: 5 },
    ])('un cuerpo no válido (%j) da 400 con los campos', async (body) => {
        const response = await postJson(body);
        expect(response.status).toBe(400);
        expect((await response.json()).errors).toBeDefined();
        expect(createAuthorization).not.toHaveBeenCalled();
    });

    it('un carrito vacío da 400', async () => {
        getUserCart.mockResolvedValue([]);
        const response = await postJson(request);
        expect(response.status).toBe(400);
        expect((await response.json()).message).toBe('Tu carrito está vacío');
        expect(createAuthorization).not.toHaveBeenCalled();
    });

    it('un envío bloqueado o inexistente da 404', async () => {
        getShippingTypeById.mockResolvedValue(null);
        expect((await postJson(request)).status).toBe(404);
        expect(createAuthorization).not.toHaveBeenCalled();
    });

    it('una dirección que no es de la cuenta (o inexistente) da 404', async () => {
        getUserAddress.mockResolvedValue(null);
        expect((await postJson(request)).status).toBe(404);
        expect(createAuthorization).not.toHaveBeenCalled();
    });

    it('si falta stock da 409 con las líneas afectadas y no autoriza nada', async () => {
        getCartLines.mockResolvedValue([{ ...lines[0], stock: 1 }, lines[1]]);
        const response = await postJson(request);
        expect(response.status).toBe(409);
        expect((await response.json()).problems).toEqual([{ variantId: 4, available: 1 }]);
        expect(createAuthorization).not.toHaveBeenCalled();
    });

    it('una presentación que ya no se vende da 409 con 0 unidades', async () => {
        getCartLines.mockResolvedValue([lines[0]]);
        const response = await postJson(request);
        expect(response.status).toBe(409);
        expect((await response.json()).problems).toEqual([{ variantId: 9, available: 0 }]);
    });

    it('un total menor que el mínimo de la pasarela da 400', async () => {
        getUserCart.mockResolvedValue([{ variantId: 4, quantity: 1 }]);
        getCartLines.mockResolvedValue([{ ...lines[0], price: '0.10' }]);
        getShippingTypeById.mockResolvedValue({ ...shipping, cost: '0.00' });
        expect((await postJson(request)).status).toBe(400);
        expect(createAuthorization).not.toHaveBeenCalled();
    });

    it('si la pasarela falla da 502 sin filtrar el detalle', async () => {
        createAuthorization.mockRejectedValue(
            new PaymentError('No se ha podido autorizar el pago', 'api_error', {
                cause: new Error('sk_test_secreto'),
            }),
        );
        const response = await postJson(request);
        expect(response.status).toBe(502);
        expect(JSON.stringify(await response.json())).not.toContain('secreto');
    });

    it('un error de la BD da 500 sin filtrar el mensaje', async () => {
        getUserCart.mockRejectedValue(new Error('select secreto'));
        const response = await postJson(request);
        expect(response.status).toBe(500);
        expect(JSON.stringify(await response.json())).not.toContain('secreto');
    });
});
