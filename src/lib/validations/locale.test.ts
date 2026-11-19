import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { checkoutPaymentRequestSchema } from './checkout';

const firstError = (schema: z.ZodType, value: unknown) => {
    const result = schema.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
};

describe('mensajes de Zod en español', () => {
    it('un tipo equivocado sale en español', () => {
        expect(firstError(z.number(), 'x')).toBe(
            'Entrada inválida: se esperaba número, recibido texto',
        );
    });

    it('un campo que falta sale en español', () => {
        expect(firstError(checkoutPaymentRequestSchema, {})).toMatch(
            /^Entrada inválida: se esperaba número/,
        );
    });

    it('un valor demasiado pequeño o grande sale en español', () => {
        expect(firstError(z.number().min(1), 0)).toMatch(/^Demasiado pequeño/);
        expect(firstError(z.array(z.number()).max(1), [1, 2])).toMatch(/^Demasiado grande/);
    });

    it('ningún mensaje por defecto queda en inglés', () => {
        const messages = [
            firstError(z.string(), 1),
            firstError(z.number().int(), 1.5),
            firstError(z.enum(['a']), 'b'),
            firstError(z.string().email(), 'no'),
            firstError(checkoutPaymentRequestSchema, { shippingTypeId: 0, shippingAddressId: 5 }),
        ];
        for (const message of messages)
            expect(message).not.toMatch(/Invalid|expected|Too (small|big)/);
    });

    it('el mensaje propio de un esquema tiene prioridad', () => {
        expect(firstError(z.string().min(3, 'Muy corto'), 'a')).toBe('Muy corto');
    });
});
