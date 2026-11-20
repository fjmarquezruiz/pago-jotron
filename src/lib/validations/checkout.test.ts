import { describe, expect, it } from 'vitest';
import { checkoutOrderRequestSchema, checkoutPaymentRequestSchema } from './checkout';

const base = { shippingTypeId: 1, shippingAddressId: 3 };

describe('checkoutPaymentRequestSchema', () => {
    it('sigue aceptando solo envío y dirección, e ignora lo demás', () => {
        expect(checkoutPaymentRequestSchema.parse({ ...base, amount: 1 })).toEqual(base);
    });
});

describe('checkoutOrderRequestSchema', () => {
    it('acepta tarjeta con paymentIntentId', () => {
        const body = { ...base, paymentMethod: 'Tarjeta', paymentIntentId: 'pi_3Abc123_xyz' };
        expect(checkoutOrderRequestSchema.parse(body)).toEqual(body);
    });

    it('acepta transferencia sin paymentIntentId, con o sin facturación', () => {
        expect(
            checkoutOrderRequestSchema.safeParse({ ...base, paymentMethod: 'Transferencia' })
                .success,
        ).toBe(true);
        const withBilling = { ...base, paymentMethod: 'Transferencia', billingAddressId: 4 };
        expect(checkoutOrderRequestSchema.parse(withBilling)).toEqual(withBilling);
    });

    it('la tarjeta exige el paymentIntentId', () => {
        const result = checkoutOrderRequestSchema.safeParse({ ...base, paymentMethod: 'Tarjeta' });
        expect(result.success).toBe(false);
    });

    it('la transferencia no admite paymentIntentId', () => {
        const result = checkoutOrderRequestSchema.safeParse({
            ...base,
            paymentMethod: 'Transferencia',
            paymentIntentId: 'pi_123',
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(
            'Una transferencia no lleva identificador de pago',
        );
    });

    it.each(['', 'pi_', 'xx_123', 'pi_12 3', 'pi_ñ', `pi_${'a'.repeat(62)}`, 12])(
        'rechaza el paymentIntentId %j',
        (paymentIntentId) => {
            const result = checkoutOrderRequestSchema.safeParse({
                ...base,
                paymentMethod: 'Tarjeta',
                paymentIntentId,
            });
            expect(result.success).toBe(false);
        },
    );

    it('acepta un paymentIntentId de 64 caracteres', () => {
        const paymentIntentId = `pi_${'a'.repeat(61)}`;
        expect(
            checkoutOrderRequestSchema.safeParse({
                ...base,
                paymentMethod: 'Tarjeta',
                paymentIntentId,
            }).success,
        ).toBe(true);
    });

    it.each([undefined, 'PayPal', 'Bizum', null, 1])(
        'rechaza el método de pago %j con un mensaje en español',
        (paymentMethod) => {
            const result = checkoutOrderRequestSchema.safeParse({ ...base, paymentMethod });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe(
                'Elige un método de pago válido: Tarjeta o Transferencia',
            );
        },
    );

    it.each([
        { shippingTypeId: 0 },
        { shippingTypeId: 1.5 },
        { shippingTypeId: '1' },
        { shippingAddressId: -1 },
        { shippingAddressId: undefined },
        { billingAddressId: 0 },
    ])('rechaza ids no válidos %j', (override) => {
        const result = checkoutOrderRequestSchema.safeParse({
            ...base,
            paymentMethod: 'Transferencia',
            ...override,
        });
        expect(result.success).toBe(false);
    });

    it('ignora campos de más como el importe', () => {
        const data = checkoutOrderRequestSchema.parse({
            ...base,
            paymentMethod: 'Transferencia',
            amount: 1,
            userId: 99,
        });
        expect(data).not.toHaveProperty('amount');
        expect(data).not.toHaveProperty('userId');
    });
});
