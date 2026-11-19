import Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn();
const capturePI = vi.fn();
const cancelPI = vi.fn();
vi.mock('./stripe', () => ({
    getStripe: () => ({ paymentIntents: { create, capture: capturePI, cancel: cancelPI } }),
}));

import { cancel, capture, createAuthorization, MIN_AMOUNT_CENTS, PaymentError } from './index';

const input = { amountCents: 3345, userId: 12, cartFingerprint: 'a'.repeat(64) };
const stripeError = (code?: string) =>
    new Stripe.errors.StripeError({ message: 'detalle interno', type: 'api_error', code });

beforeEach(() => {
    create
        .mockReset()
        .mockResolvedValue({ id: 'pi_1', client_secret: 'pi_1_secret_x', amount: 3345 });
    capturePI.mockReset().mockResolvedValue({ id: 'pi_1', amount_received: 3345 });
    cancelPI.mockReset().mockResolvedValue({ id: 'pi_1', amount: 3345 });
});

describe('createAuthorization', () => {
    it('crea un PaymentIntent de captura manual, en euros y solo con tarjeta', async () => {
        await createAuthorization(input);
        expect(create).toHaveBeenCalledTimes(1);
        expect(create).toHaveBeenCalledWith({
            amount: 3345,
            currency: 'eur',
            capture_method: 'manual',
            allowed_payment_method_types: ['card'],
            metadata: { userId: '12', cartFingerprint: 'a'.repeat(64) },
        });
    });

    it('devuelve el id, el secreto del cliente y el importe', async () => {
        await expect(createAuthorization(input)).resolves.toEqual({
            id: 'pi_1',
            clientSecret: 'pi_1_secret_x',
            amountCents: 3345,
        });
    });

    it.each([0, 49, -100, 10.5, Number.NaN])(
        'rechaza el importe %s sin llamar a Stripe',
        async (amountCents) => {
            await expect(createAuthorization({ ...input, amountCents })).rejects.toThrow(
                RangeError,
            );
            expect(create).not.toHaveBeenCalled();
        },
    );

    it('acepta justo el importe mínimo', async () => {
        await expect(
            createAuthorization({ ...input, amountCents: MIN_AMOUNT_CENTS }),
        ).resolves.toBeDefined();
    });

    it('si Stripe no da secreto, falla con un PaymentError', async () => {
        create.mockResolvedValue({ id: 'pi_1', client_secret: null, amount: 3345 });
        await expect(createAuthorization(input)).rejects.toMatchObject({
            name: 'PaymentError',
            code: 'missing_client_secret',
        });
    });

    it('un fallo de Stripe sale como PaymentError con mensaje genérico y su código', async () => {
        create.mockRejectedValue(stripeError('amount_too_small'));
        const error = await createAuthorization(input).catch((e) => e);
        expect(error).toBeInstanceOf(PaymentError);
        expect(error.code).toBe('amount_too_small');
        expect(error.message).toBe('No se ha podido autorizar el pago');
        expect(error.message).not.toContain('detalle interno');
        expect(error.cause).toBeInstanceOf(Stripe.errors.StripeError);
    });

    it('un error que no es de Stripe se propaga tal cual', async () => {
        const boom = new TypeError('bug');
        create.mockRejectedValue(boom);
        await expect(createAuthorization(input)).rejects.toBe(boom);
    });
});

describe('capture', () => {
    it('cobra la reserva y devuelve lo cobrado', async () => {
        await expect(capture('pi_1')).resolves.toEqual({
            id: 'pi_1',
            status: 'succeeded',
            amountCents: 3345,
        });
        expect(capturePI).toHaveBeenCalledWith('pi_1');
    });

    it('si no se puede capturar, sale como PaymentError', async () => {
        capturePI.mockRejectedValue(stripeError('payment_intent_unexpected_state'));
        await expect(capture('pi_1')).rejects.toMatchObject({
            name: 'PaymentError',
            code: 'payment_intent_unexpected_state',
            message: 'No se ha podido cobrar el pago',
        });
    });
});

describe('cancel', () => {
    it('cancela la reserva sin cobrar', async () => {
        await expect(cancel('pi_1')).resolves.toEqual({
            id: 'pi_1',
            status: 'canceled',
            amountCents: 3345,
        });
        expect(cancelPI).toHaveBeenCalledWith('pi_1');
        expect(capturePI).not.toHaveBeenCalled();
    });

    it('si Stripe falla, sale como PaymentError', async () => {
        cancelPI.mockRejectedValue(stripeError());
        await expect(cancel('pi_1')).rejects.toMatchObject({
            name: 'PaymentError',
            code: 'api_error',
            message: 'No se ha podido cancelar el pago',
        });
    });
});
