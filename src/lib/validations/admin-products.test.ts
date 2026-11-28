import { describe, expect, it } from 'vitest';
import {
    parseAdminProductParams,
    productFormSchema,
    productSalesSchema,
    type ProductFormValues,
} from './admin-products';

const valid = (): ProductFormValues => ({
    name: ' Jotrón Reserva ',
    wineryId: 1,
    guaranteeOfOriginId: 2,
    typologyId: 3,
    vintage: 2019,
    description: '',
    image: 'pago-jotron/productos/jotron-reserva-2019',
    grapes: [
        { grapeId: 1, percentage: 70 },
        { grapeId: 2, percentage: 30 },
    ],
    variants: [
        {
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            price: 24.5,
            stock: 10,
            isBlocked: false,
        },
    ],
    categories: [],
    tastingTags: [],
    visualNote: '',
    aromaNote: '',
    palateNote: '',
    foodPairing: '',
    alcoholContent: null,
    minTemperature: null,
    maxTemperature: null,
    agingTime: '',
    agingMethod: '',
    production: '',
    soilType: '',
    vineyardAltitude: null,
    yield: null,
    steps: [],
});

const errorsOf = (input: unknown) => {
    const result = productFormSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((i) => [i.path.join('.'), i.message]);
};

describe('productFormSchema: ficha (3b)', () => {
    it('acepta la ficha completa', () => {
        expect(
            productFormSchema.safeParse({
                ...valid(),
                categories: ['Tintos', 'Ecológico'],
                tastingTags: ['Afrutado'],
                visualNote: ' Rojo picota ',
                alcoholContent: 14.5,
                minTemperature: 14,
                maxTemperature: 16,
                vineyardAltitude: 850,
                yield: 4500,
                steps: [{ title: 'Vendimia', description: '' }],
            }).success,
        ).toBe(true);
    });
    it('no repite categorías ni etiquetas, sin distinguir mayúsculas', () => {
        const errors = errorsOf({
            ...valid(),
            categories: ['Tintos', 'tintos'],
            tastingTags: ['Salino', 'SALINO'],
        });
        expect(errors).toContainEqual(['categories.1', 'Esa categoría ya está añadida']);
        expect(errors).toContainEqual(['tastingTags.1', 'Esa etiqueta ya está añadida']);
    });
    it('límites de nombre: vacío y demasiado largo', () => {
        const errors = errorsOf({
            ...valid(),
            categories: [' '],
            tastingTags: ['x'.repeat(51)],
        });
        expect(errors).toContainEqual(['categories.0', 'Escribe el nombre de la categoría']);
        expect(errors).toContainEqual([
            'tastingTags.0',
            'El nombre admite como máximo 50 caracteres',
        ]);
    });
    it('la temperatura máxima no es menor que la mínima', () => {
        expect(errorsOf({ ...valid(), minTemperature: 16, maxTemperature: 14 })).toContainEqual([
            'maxTemperature',
            'La temperatura máxima no puede ser menor que la mínima',
        ]);
        expect(
            productFormSchema.safeParse({ ...valid(), minTemperature: 14, maxTemperature: null })
                .success,
        ).toBe(true);
    });
    it('graduación y temperaturas: entre 0 y 100 y con dos decimales', () => {
        expect(errorsOf({ ...valid(), alcoholContent: 101 })).toContainEqual([
            'alcoholContent',
            'La graduación debe estar entre 0 y 100',
        ]);
        expect(errorsOf({ ...valid(), minTemperature: 14.123 })).toContainEqual([
            'minTemperature',
            'Usa como mucho dos decimales',
        ]);
    });
    it('altitud y rendimiento son enteros: altitud ≥ 0 y rendimiento > 0', () => {
        const errors = errorsOf({ ...valid(), vineyardAltitude: -1, yield: 0 });
        expect(errors).toContainEqual(['vineyardAltitude', 'La altitud no puede ser negativa']);
        expect(errors).toContainEqual(['yield', 'El rendimiento debe ser mayor que 0']);
        expect(errorsOf({ ...valid(), yield: 1.5 })).toContainEqual([
            'yield',
            'El rendimiento es un número entero',
        ]);
    });
    it('los pasos llevan título y límites de longitud', () => {
        const errors = errorsOf({
            ...valid(),
            steps: [{ title: ' ', description: 'x'.repeat(2001) }],
            production: 'x'.repeat(51),
        });
        expect(errors).toContainEqual(['steps.0.title', 'Escribe el título del paso']);
        expect(errors).toContainEqual([
            'steps.0.description',
            'La descripción del paso es demasiado larga',
        ]);
        expect(errors).toContainEqual([
            'production',
            'La producción admite como máximo 50 caracteres',
        ]);
    });
});

describe('productFormSchema', () => {
    it('acepta un producto válido y recorta el nombre', () => {
        const result = productFormSchema.safeParse(valid());
        expect(result.success && result.data.name).toBe('Jotrón Reserva');
    });
    it('acepta pasas sin añada ni uvas ni imagen', () => {
        expect(
            productFormSchema.safeParse({ ...valid(), vintage: null, grapes: [], image: null })
                .success,
        ).toBe(true);
    });
    it('pide lo que falta con su mensaje', () => {
        const errors = errorsOf({ ...valid(), name: ' ', wineryId: 0, typologyId: Number.NaN });
        expect(errors).toContainEqual(['name', 'Escribe el nombre del producto']);
        expect(errors).toContainEqual(['wineryId', 'Elige la bodega']);
        expect(errors).toContainEqual(['typologyId', 'Elige la tipología']);
    });
    it('las uvas suman como máximo 100 %', () => {
        expect(
            productFormSchema.safeParse({
                ...valid(),
                grapes: [
                    { grapeId: 1, percentage: 33.33 },
                    { grapeId: 2, percentage: 33.33 },
                    { grapeId: 3, percentage: 33.34 },
                ],
            }).success,
        ).toBe(true);
        expect(
            errorsOf({
                ...valid(),
                grapes: [
                    { grapeId: 1, percentage: 70 },
                    { grapeId: 2, percentage: 30.01 },
                ],
            }),
        ).toContainEqual(['grapes', 'Los porcentajes de uva no pueden sumar más de 100 %']);
    });
    it('una uva no se repite y su porcentaje es mayor que 0', () => {
        const errors = errorsOf({
            ...valid(),
            grapes: [
                { grapeId: 1, percentage: 50 },
                { grapeId: 1, percentage: 0 },
            ],
        });
        expect(errors).toContainEqual(['grapes.1.grapeId', 'Esa variedad ya está añadida']);
        expect(errors).toContainEqual([
            'grapes.1.percentage',
            'El porcentaje debe ser mayor que 0',
        ]);
    });
    it('exige al menos una presentación', () => {
        expect(errorsOf({ ...valid(), variants: [] })).toContainEqual([
            'variants',
            'Añade al menos una presentación',
        ]);
    });
    it('no repite formato y capacidad (UNIQUE de la BD), sin distinguir mayúsculas', () => {
        const variant = valid().variants[0];
        expect(
            errorsOf({ ...valid(), variants: [variant, { ...variant, format: ' botella ' }] }),
        ).toContainEqual([
            'variants.1.format',
            'Ya hay una presentación con ese formato y capacidad',
        ]);
        expect(
            productFormSchema.safeParse({
                ...valid(),
                variants: [variant, { ...variant, capacity: 375 }],
            }).success,
        ).toBe(true);
    });
    it('valida precio, existencias y capacidad', () => {
        const variant = valid().variants[0];
        const errors = errorsOf({
            ...valid(),
            variants: [{ ...variant, price: 1.234, stock: -1, capacity: 0 }],
        });
        expect(errors).toContainEqual(['variants.0.price', 'Usa como mucho dos decimales']);
        expect(errors).toContainEqual([
            'variants.0.stock',
            'Las existencias no pueden ser negativas',
        ]);
        expect(errors).toContainEqual(['variants.0.capacity', 'La capacidad debe ser mayor que 0']);
        expect(
            errorsOf({ ...valid(), variants: [{ ...variant, price: Number.NaN }] }),
        ).toContainEqual(['variants.0.price', 'Escribe el precio']);
    });
    it('la imagen debe estar en la carpeta de productos', () => {
        expect(errorsOf({ ...valid(), image: 'otra-carpeta/x' })).toContainEqual([
            'image',
            'La imagen no es válida',
        ]);
    });
});

describe('productSalesSchema', () => {
    it('solo acepta isBlocked booleano', () => {
        expect(productSalesSchema.safeParse({ isBlocked: true }).success).toBe(true);
        expect(productSalesSchema.safeParse({ isBlocked: 'si' }).success).toBe(false);
        expect(productSalesSchema.safeParse({ isBlocked: true, x: 1 }).success).toBe(false);
    });
});

describe('parseAdminProductParams', () => {
    it('lee página y filtros válidos', () => {
        expect(
            parseAdminProductParams({
                pagina: '2',
                tipologia: '3',
                denominacion: '4',
                bodega: '5',
                estado: 'Activo',
                q: ' reserva ',
            }),
        ).toEqual({
            page: 2,
            typologyId: 3,
            guaranteeOfOriginId: 4,
            wineryId: 5,
            status: 'Activo',
            q: 'reserva',
        });
    });
    it('ignora lo que no es válido sin fallar', () => {
        expect(
            parseAdminProductParams({
                pagina: '0',
                tipologia: 'x',
                bodega: ['1', '2'],
                estado: 'Otro',
                q: '   ',
            }),
        ).toEqual({ page: 1 });
        expect(parseAdminProductParams({})).toEqual({ page: 1 });
    });
});
