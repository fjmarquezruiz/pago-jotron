import { describe, expect, it } from 'vitest';
import type { AdminProduct } from '@/lib/db/admin-products';
import { productFormSchema } from '@/lib/validations/admin-products';
import {
    emptyProductForm,
    emptyVariant,
    inputToNumber,
    numberToInput,
    productToFormValues,
    withoutWineSections,
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
        visualNote: 'Rojo picota',
        aromaNote: null,
        palateNote: null,
        foodPairing: null,
        alcoholContent: '14.50',
        minTemperature: '14.00',
        maxTemperature: null,
        agingTime: null,
        agingMethod: null,
        production: null,
        soilType: null,
        vineyardAltitude: 850,
        yield: null,
        categories: ['Tintos'],
        tastingTags: ['Afrutado'],
        steps: [{ title: 'Vendimia', description: null }],
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
    it('pasa la ficha: decimales a número, nulos a null o vacío', () => {
        const values = productToFormValues(product);
        expect(values).toMatchObject({
            visualNote: 'Rojo picota',
            aromaNote: '',
            alcoholContent: 14.5,
            minTemperature: 14,
            maxTemperature: null,
            vineyardAltitude: 850,
            yield: null,
            categories: ['Tintos'],
            tastingTags: ['Afrutado'],
            steps: [{ title: 'Vendimia', description: '' }],
        });
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

describe('withoutWineSections', () => {
    it('vacía los campos de vino y conserva el resto', () => {
        const values = {
            ...emptyProductForm(),
            name: 'Pasas',
            foodPairing: 'Quesos',
            visualNote: 'Rojo',
            tastingTags: ['Afrutado'],
            alcoholContent: 14,
            steps: [{ title: 'Vendimia', description: 'Manual' }],
        };
        const result = withoutWineSections(values);
        expect(result).toMatchObject({
            name: 'Pasas',
            foodPairing: 'Quesos',
            visualNote: '',
            tastingTags: [],
            alcoholContent: null,
            steps: [],
        });
    });
});
