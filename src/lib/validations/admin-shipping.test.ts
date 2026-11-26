import { describe, expect, it } from 'vitest';
import { parseShippingForm, shippingTypeSchema } from './admin-shipping';

const valid = {
    name: 'Exprés',
    cost: 9.95,
    minDeliveryDays: 1,
    maxDeliveryDays: 2,
    isBlocked: false,
};

describe('shippingTypeSchema', () => {
    it('acepta un tipo completo y la recogida sin plazos', () => {
        expect(shippingTypeSchema.safeParse(valid).success).toBe(true);
        expect(
            shippingTypeSchema.safeParse({
                ...valid,
                cost: 0,
                minDeliveryDays: null,
                maxDeliveryDays: null,
            }).success,
        ).toBe(true);
    });
    it.each([
        ['nombre vacío', { name: '  ' }],
        ['nombre de más de 50', { name: 'x'.repeat(51) }],
        ['coste negativo', { cost: -1 }],
        ['coste con tres decimales', { cost: 1.234 }],
        ['plazo no entero', { minDeliveryDays: 1.5 }],
        ['plazo de más de 255', { maxDeliveryDays: 256 }],
        ['mínimo mayor que el máximo', { minDeliveryDays: 5, maxDeliveryDays: 3 }],
        ['campo de más', { id: 1 }],
    ])('rechaza %s', (_, patch) => {
        expect(shippingTypeSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
    });
    it('acepta solo un extremo', () => {
        expect(shippingTypeSchema.safeParse({ ...valid, minDeliveryDays: null }).success).toBe(
            true,
        );
    });
});

describe('parseShippingForm', () => {
    const form = {
        name: 'Exprés',
        cost: '9,95',
        minDeliveryDays: '1',
        maxDeliveryDays: '2',
        isActive: true,
    };
    it('convierte el texto: coma decimal y activo → isBlocked false', () => {
        expect(parseShippingForm(form)).toEqual({ data: valid });
    });
    it('precio y plazos vacíos: gratis y sin plazo; inactivo → bloqueado', () => {
        expect(
            parseShippingForm({
                ...form,
                cost: '',
                minDeliveryDays: '',
                maxDeliveryDays: '',
                isActive: false,
            }),
        ).toEqual({
            data: {
                ...valid,
                cost: 0,
                minDeliveryDays: null,
                maxDeliveryDays: null,
                isBlocked: true,
            },
        });
    });
    it('errores por campo', () => {
        const result = parseShippingForm({
            ...form,
            name: '',
            cost: 'abc',
        });
        expect(result).toHaveProperty('errors');
        const { errors } = result as { errors: Record<string, string> };
        expect(errors.name).toBeTruthy();
        expect(errors.cost).toBeTruthy();
    });
    it('plazo máximo menor que el mínimo: error en el máximo', () => {
        const result = parseShippingForm({ ...form, minDeliveryDays: '5', maxDeliveryDays: '3' });
        expect(result).toEqual({
            errors: { maxDeliveryDays: 'El plazo máximo debe ser igual o mayor que el mínimo' },
        });
    });
});
