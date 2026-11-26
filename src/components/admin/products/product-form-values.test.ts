import { describe, expect, it } from 'vitest';
import type { AdminProduct } from '@/lib/db/admin-products';
import { productFormSchema } from '@/lib/validations/admin-products';
import {
    emptyProductForm,
    emptyVariant,
    inputToNumber,
    numberToInput,
    productToFormValues,
} from './product-form-values';

describe('emptyProductForm', () => {
    it('arranca sin elegir nada y con una presentación en blanco, y el esquema lo rechaza', () => {
        const form = emptyProductForm();
        expect(form.variants).toHaveLength(1);
        expect(productFormSchema.safeParse(form).success).toBe(false);
    });
    it('la unidad de una presentación nueva es la propuesta', () => {
        expect(emptyVariant('g').capacityUnit).toBe('g');
    });
});

describe('productToFormValues', () => {
    const product: AdminProduct = {
        id: 5,
        name: 'Jotrón',
        slug: 'jotron-2019',
        wineryId: 1,
        guaranteeOfOriginId: 2,
        typologyId: 3,
        vintage: 2019,
        image: null,
        description: null,
        isBlocked: false,
        wineryName: 'Pago',
        grapes: [{ grapeId: 4, percentage: '70.00' }],
        variants: [
            {
                id: 10,
                format: 'Botella',
                capacity: 750,
                capacityUnit: 'ml',
                price: '24.50',
                stock: 12,
                isBlocked: false,
            },
        ],
    };
    it('pasa decimales a número y guarda el stock leído', () => {
        const values = productToFormValues(product);
        expect(values.description).toBe('');
        expect(values.grapes).toEqual([{ grapeId: 4, percentage: 70 }]);
        expect(values.variants[0]).toMatchObject({
            variantId: 10,
            price: 24.5,
            stock: 12,
            loadedStock: 12,
        });
        expect(productFormSchema.safeParse(values).success).toBe(true);
    });
});

describe('campos numéricos', () => {
    it('vacío es NaN y NaN se pinta vacío', () => {
        expect(Number.isNaN(inputToNumber(' '))).toBe(true);
        expect(inputToNumber('12.5')).toBe(12.5);
        expect(numberToInput(Number.NaN)).toBe('');
        expect(numberToInput(null)).toBe('');
        expect(numberToInput(0)).toBe('0');
    });
});
