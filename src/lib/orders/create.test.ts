import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cartFingerprint } from './fingerprint';

const tx = { tx: true };
const transaction = vi.fn();
vi.mock('@/db', () => ({
    db: { transaction: (run: (tx: unknown) => Promise<unknown>) => transaction(run) },
}));

const getUserCart = vi.fn();
const getCartLines = vi.fn();
const getShippingTypeById = vi.fn();
const getUserAddress = vi.fn();
const getOrderByPaymentIntent = vi.fn();
const getOrderStatusId = vi.fn();
const decrementStockQuery = vi.fn();
const insertOrderQuery = vi.fn();
const insertOrderLinesQuery = vi.fn();
const clearUserCartQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getUserCart: (...a: unknown[]) => getUserCart(...a),
    getCartLines: (...a: unknown[]) => getCartLines(...a),
    getShippingTypeById: (...a: unknown[]) => getShippingTypeById(...a),
    getUserAddress: (...a: unknown[]) => getUserAddress(...a),
    getOrderByPaymentIntent: (...a: unknown[]) => getOrderByPaymentIntent(...a),
    getOrderStatusId: (...a: unknown[]) => getOrderStatusId(...a),
    decrementStockQuery: (...a: unknown[]) => decrementStockQuery(...a),
    insertOrderQuery: (...a: unknown[]) => insertOrderQuery(...a),
    insertOrderLinesQuery: (...a: unknown[]) => insertOrderLinesQuery(...a),
    clearUserCartQuery: (...a: unknown[]) => clearUserCartQuery(...a),
}));

const getAuthorization = vi.fn();
const capture = vi.fn();
const cancel = vi.fn();
vi.mock('@/lib/payments', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/payments')>()),
    getAuthorization: (...a: unknown[]) => getAuthorization(...a),
    capture: (...a: unknown[]) => capture(...a),
    cancel: (...a: unknown[]) => cancel(...a),
}));

import { PaymentError } from '@/lib/payments';
import type { CheckoutOrderRequest } from '@/lib/validations/checkout';
import { createOrder } from './create';

const USER = 12;
// 2 x 11.50 (21 %) + 1 x 5.50 (10 %) + envío 4.95 = 33.45
const items = [
    { variantId: 9, quantity: 1 },
    { variantId: 4, quantity: 2 },
];
const lines = [
    { variantId: 9, price: '5.50', taxRate: '10.00', stock: 5 },
    { variantId: 4, price: '11.50', taxRate: '21.00', stock: 10 },
];
const TOTAL = 3345;
const fingerprint = cartFingerprint({ lines: items, shippingTypeId: 1, totalCents: TOTAL });

const card: CheckoutOrderRequest = {
    paymentMethod: 'Tarjeta',
    shippingTypeId: 1,
    shippingAddressId: 3,
    paymentIntentId: 'pi_1',
};
const transfer: CheckoutOrderRequest = {
    paymentMethod: 'Transferencia',
    shippingTypeId: 1,
    shippingAddressId: 3,
};
const authorized = {
    id: 'pi_1',
    status: 'requires_capture',
    amountCents: TOTAL,
    userId: USER,
    cartFingerprint: fingerprint,
};

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    transaction.mockReset().mockImplementation((run) => run(tx));
    getUserCart.mockReset().mockResolvedValue(items);
    getCartLines.mockReset().mockResolvedValue(lines);
    getShippingTypeById.mockReset().mockResolvedValue({ id: 1, cost: '4.95' });
    getUserAddress
        .mockReset()
        .mockImplementation(async (_user, id) =>
            id === 3
                ? { id: 3, addressType: 'Envío' }
                : id === 8
                  ? { id: 8, addressType: 'Facturación' }
                  : null,
        );
    getOrderByPaymentIntent.mockReset().mockResolvedValue(null);
    getOrderStatusId
        .mockReset()
        .mockImplementation(async (name) => (name === 'Confirmado' ? 2 : 1));
    decrementStockQuery.mockReset().mockResolvedValue([{ affectedRows: 1 }]);
    insertOrderQuery.mockReset().mockResolvedValue([{ insertId: 12 }]);
    insertOrderLinesQuery.mockReset().mockResolvedValue(undefined);
    clearUserCartQuery.mockReset().mockResolvedValue(undefined);
    getAuthorization.mockReset().mockResolvedValue(authorized);
    capture.mockReset().mockResolvedValue({ id: 'pi_1', status: 'succeeded', amountCents: TOTAL });
    cancel.mockReset().mockResolvedValue({ id: 'pi_1', status: 'canceled', amountCents: TOTAL });
});

describe('createOrder con tarjeta', () => {
    it('crea el pedido Confirmado, descuenta stock, vacía el carrito y captura', async () => {
        const result = await createOrder(USER, card);

        expect(result).toEqual({
            ok: true,
            created: true,
            order: {
                orderId: 12,
                orderNumber: 'PJ-12',
                status: 'Confirmado',
                paymentMethod: 'Tarjeta',
            },
        });
        // Por presentación ascendente, con la transacción.
        expect(decrementStockQuery.mock.calls).toEqual([
            [tx, 4, 2],
            [tx, 9, 1],
        ]);
        expect(insertOrderQuery).toHaveBeenCalledWith(tx, {
            userId: USER,
            shippingAddressId: 3,
            billingAddressId: 3,
            paymentMethod: 'Tarjeta',
            shippingTypeId: 1,
            shippingCost: '4.95',
            total: '33.45',
            statusId: 2,
            paymentIntentId: 'pi_1',
        });
        expect(insertOrderLinesQuery).toHaveBeenCalledWith(tx, 12, [
            { variantId: 9, quantity: 1, unitPrice: '5.50', taxRate: '10.00' },
            { variantId: 4, quantity: 2, unitPrice: '11.50', taxRate: '21.00' },
        ]);
        expect(clearUserCartQuery).toHaveBeenCalledWith(tx, USER);
        expect(capture).toHaveBeenCalledWith('pi_1');
        expect(cancel).not.toHaveBeenCalled();
    });

    it('captura lo último, después de escribir en la BD', async () => {
        const order: string[] = [];
        clearUserCartQuery.mockImplementation(async () => order.push('carrito'));
        capture.mockImplementation(async () => order.push('captura'));
        await createOrder(USER, card);
        expect(order).toEqual(['carrito', 'captura']);
    });

    it('es idempotente: si ya hay un pedido de ese pago, lo devuelve sin tocar nada', async () => {
        getOrderByPaymentIntent.mockResolvedValue({
            id: 7,
            userId: USER,
            status: 'Confirmado',
            paymentMethod: 'Tarjeta',
        });

        expect(await createOrder(USER, card)).toEqual({
            ok: true,
            created: false,
            order: {
                orderId: 7,
                orderNumber: 'PJ-7',
                status: 'Confirmado',
                paymentMethod: 'Tarjeta',
            },
        });
        expect(getAuthorization).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
        expect(capture).not.toHaveBeenCalled();
    });

    it('si el pedido de ese pago es de otra cuenta, 403 y no cancela', async () => {
        getOrderByPaymentIntent.mockResolvedValue({ id: 7, userId: 99, status: 'Confirmado' });
        expect(await createOrder(USER, card)).toMatchObject({
            ok: false,
            code: 'payment_forbidden',
        });
        expect(cancel).not.toHaveBeenCalled();
    });

    it('si la autorización es de otra cuenta, no la cancela ni crea nada', async () => {
        getAuthorization.mockResolvedValue({ ...authorized, userId: 99 });
        getUserCart.mockResolvedValue([]);
        expect(await createOrder(USER, card)).toMatchObject({
            ok: false,
            code: 'payment_forbidden',
        });
        expect(cancel).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
    });

    it('si el PaymentIntent no existe en Stripe, payment_not_found', async () => {
        getAuthorization.mockRejectedValue(new PaymentError('x', 'resource_missing'));
        expect(await createOrder(USER, card)).toMatchObject({
            ok: false,
            code: 'payment_not_found',
        });
    });

    it('un fallo de Stripe al leer la autorización se propaga', async () => {
        getAuthorization.mockRejectedValue(new PaymentError('x', 'api_connection_error'));
        await expect(createOrder(USER, card)).rejects.toBeInstanceOf(PaymentError);
    });

    it('con falta de stock responde stock con los problemas y cancela la autorización', async () => {
        getCartLines.mockResolvedValue([{ ...lines[0], stock: 0 }, lines[1]]);
        const result = await createOrder(USER, card);
        expect(result).toEqual({
            ok: false,
            code: 'stock',
            message: 'Hay productos sin stock suficiente',
            problems: [{ variantId: 9, available: 0 }],
        });
        expect(cancel).toHaveBeenCalledWith('pi_1');
        expect(transaction).not.toHaveBeenCalled();
    });

    it('si el descuento atómico no afecta filas, revierte, cancela y da stock', async () => {
        decrementStockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 }])
            .mockResolvedValueOnce([{ affectedRows: 0 }]);
        getCartLines
            .mockResolvedValueOnce(lines)
            .mockResolvedValueOnce([lines[0], { ...lines[1], stock: 1 }]);

        const result = await createOrder(USER, card);

        expect(result).toMatchObject({
            ok: false,
            code: 'stock',
            problems: [{ variantId: 4, available: 1 }],
        });
        expect(insertOrderQuery).not.toHaveBeenCalled();
        expect(capture).not.toHaveBeenCalled();
        expect(cancel).toHaveBeenCalledWith('pi_1');
    });

    it('si la huella no coincide, cancela y responde payment_mismatch', async () => {
        getAuthorization.mockResolvedValue({ ...authorized, cartFingerprint: 'b'.repeat(64) });
        expect(await createOrder(USER, card)).toMatchObject({
            ok: false,
            code: 'payment_mismatch',
        });
        expect(cancel).toHaveBeenCalledWith('pi_1');
        expect(transaction).not.toHaveBeenCalled();
    });

    it('si el importe autorizado no coincide, cancela', async () => {
        getAuthorization.mockResolvedValue({ ...authorized, amountCents: TOTAL - 1 });
        expect(await createOrder(USER, card)).toMatchObject({
            ok: false,
            code: 'payment_mismatch',
        });
        expect(cancel).toHaveBeenCalledWith('pi_1');
    });

    it('si el pago no está en requires_capture, payment_mismatch', async () => {
        getAuthorization.mockResolvedValue({ ...authorized, status: 'requires_payment_method' });
        expect(await createOrder(USER, card)).toMatchObject({
            ok: false,
            code: 'payment_mismatch',
        });
        expect(cancel).toHaveBeenCalledWith('pi_1');
    });

    it('un pago ya cobrado o cancelado no se intenta cancelar', async () => {
        getAuthorization.mockResolvedValue({ ...authorized, status: 'canceled' });
        await createOrder(USER, card);
        expect(cancel).not.toHaveBeenCalled();
    });

    it('si cancelar falla, el motivo real sigue siendo el que se devuelve', async () => {
        cancel.mockRejectedValue(new PaymentError('x', 'unknown'));
        getAuthorization.mockResolvedValue({ ...authorized, cartFingerprint: 'b'.repeat(64) });
        expect(await createOrder(USER, card)).toMatchObject({ code: 'payment_mismatch' });
        expect(consoleError).toHaveBeenCalled();
    });

    it('si la captura falla, la transacción se revierte, cancela y da payment_failed', async () => {
        capture.mockRejectedValue(new PaymentError('x', 'card_declined'));
        const result = await createOrder(USER, card);
        expect(result).toMatchObject({ ok: false, code: 'payment_failed' });
        expect(cancel).toHaveBeenCalledWith('pi_1');
        // El error salió de la transacción (rollback), así que no se devuelve ningún pedido.
        expect(result).not.toHaveProperty('order');
    });

    it('una colisión del PaymentIntent único devuelve el pedido de la otra petición', async () => {
        insertOrderQuery.mockRejectedValue({
            code: 'ER_DUP_ENTRY',
            sqlMessage: "Duplicate entry 'pi_1' for key 'orders.payment_intent_id'",
        });
        getOrderByPaymentIntent.mockResolvedValueOnce(null).mockResolvedValueOnce({
            id: 5,
            userId: USER,
            status: 'Confirmado',
            paymentMethod: 'Tarjeta',
        });

        const result = await createOrder(USER, card);

        expect(result).toMatchObject({ ok: true, created: false, order: { orderId: 5 } });
        expect(capture).not.toHaveBeenCalled();
    });

    it('un error inesperado de la BD se propaga', async () => {
        insertOrderQuery.mockRejectedValue(new Error('boom'));
        await expect(createOrder(USER, card)).rejects.toThrow('boom');
        expect(capture).not.toHaveBeenCalled();
    });

    it('con el carrito vacío, cancela y responde empty_cart', async () => {
        getUserCart.mockResolvedValue([]);
        expect(await createOrder(USER, card)).toMatchObject({ ok: false, code: 'empty_cart' });
        expect(cancel).toHaveBeenCalledWith('pi_1');
    });
});

describe('createOrder con transferencia', () => {
    it('crea el pedido Pendiente de pago, sin tocar Stripe', async () => {
        const result = await createOrder(USER, transfer);

        expect(result).toEqual({
            ok: true,
            created: true,
            order: {
                orderId: 12,
                orderNumber: 'PJ-12',
                status: 'Pendiente de pago',
                paymentMethod: 'Transferencia',
            },
        });
        expect(insertOrderQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({ statusId: 1, paymentIntentId: null, total: '33.45' }),
        );
        expect(decrementStockQuery).toHaveBeenCalledTimes(2);
        expect(clearUserCartQuery).toHaveBeenCalled();
        expect(getOrderByPaymentIntent).not.toHaveBeenCalled();
        for (const fn of [getAuthorization, capture, cancel]) expect(fn).not.toHaveBeenCalled();
    });

    it('con falta de stock responde 409 sin llamar a Stripe', async () => {
        getCartLines.mockResolvedValue([{ ...lines[0], stock: 0 }, lines[1]]);
        expect(await createOrder(USER, transfer)).toMatchObject({ ok: false, code: 'stock' });
        expect(cancel).not.toHaveBeenCalled();
    });

    it('si falta el estado en la BD, lanza un error', async () => {
        getOrderStatusId.mockResolvedValue(null);
        await expect(createOrder(USER, transfer)).rejects.toThrow('Pendiente de pago');
    });
});

describe('createOrder: validaciones comunes', () => {
    it('carrito vacío', async () => {
        getUserCart.mockResolvedValue([]);
        expect(await createOrder(USER, transfer)).toMatchObject({ ok: false, code: 'empty_cart' });
    });

    it('envío bloqueado o inexistente', async () => {
        getShippingTypeById.mockResolvedValue(null);
        expect(await createOrder(USER, transfer)).toMatchObject({
            ok: false,
            code: 'shipping_not_found',
        });
    });

    it('dirección de envío que no es del cliente', async () => {
        getUserAddress.mockResolvedValue(null);
        expect(await createOrder(USER, transfer)).toMatchObject({
            ok: false,
            code: 'address_not_found',
        });
        expect(getUserAddress).toHaveBeenCalledWith(USER, 3);
    });

    it('facturación igual a envío guarda el id del envío y no la consulta aparte', async () => {
        await createOrder(USER, { ...transfer, billingAddressId: 3 });
        expect(insertOrderQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({ billingAddressId: 3 }),
        );
        expect(getUserAddress).toHaveBeenCalledTimes(1);
    });

    it('facturación distinta: debe ser una dirección de tipo Facturación del cliente', async () => {
        await createOrder(USER, { ...transfer, billingAddressId: 8 });
        expect(getUserAddress).toHaveBeenCalledWith(USER, 8);
        expect(insertOrderQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({ shippingAddressId: 3, billingAddressId: 8 }),
        );
    });

    it('facturación que es de tipo Envío o no existe', async () => {
        getUserAddress.mockImplementation(async (_u, id) => ({ id, addressType: 'Envío' }));
        expect(await createOrder(USER, { ...transfer, billingAddressId: 8 })).toMatchObject({
            ok: false,
            code: 'billing_not_found',
        });
        getUserAddress.mockImplementation(async (_u, id) => (id === 3 ? { id } : null));
        expect(await createOrder(USER, { ...transfer, billingAddressId: 9 })).toMatchObject({
            code: 'billing_not_found',
        });
    });
});
