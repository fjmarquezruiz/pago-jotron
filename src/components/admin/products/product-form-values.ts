/**
 * Paso entre el producto de la BD y los valores del formulario (y al revés para «sin cambios»).
 * Puro, para poder probarlo.
 */
import type { AdminProduct } from '@/lib/db/admin-products';
import type { ProductFormValues } from '@/lib/validations/admin-products';

/**
 * Valores de un formulario de producto nuevo. Lo que aún no se ha elegido es `0` (un id) o `NaN`
 * (un número), que el esquema rechaza con su mensaje; los campos numéricos vacíos se pintan en
 * blanco. Arranca con una presentación en blanco, que el esquema exige.
 */
export function emptyProductForm(): ProductFormValues {
    return {
        name: '',
        wineryId: 0,
        guaranteeOfOriginId: 0,
        typologyId: 0,
        vintage: null,
        description: '',
        image: null,
        grapes: [],
        variants: [emptyVariant('ml')],
    };
}

/**
 * Una presentación nueva y vacía.
 *
 * @param unit - Unidad propuesta (`defaultCapacityUnit` de `@/lib/admin/products`, según la tipología elegida).
 */
export function emptyVariant(unit: 'ml' | 'g'): ProductFormValues['variants'][number] {
    return {
        format: '',
        capacity: Number.NaN,
        capacityUnit: unit,
        price: Number.NaN,
        stock: 0,
        isBlocked: false,
    };
}

/**
 * Valores del formulario de edición a partir del producto guardado. Cada presentación lleva
 * `loadedStock` (lo leído ahora) para el control optimista del stock al guardar.
 *
 * @param product - El producto de `getAdminProduct`.
 */
export function productToFormValues(product: AdminProduct): ProductFormValues {
    return {
        name: product.name,
        wineryId: product.wineryId,
        guaranteeOfOriginId: product.guaranteeOfOriginId,
        typologyId: product.typologyId,
        vintage: product.vintage,
        description: product.description ?? '',
        image: product.image,
        grapes: product.grapes.map((grape) => ({
            grapeId: grape.grapeId,
            percentage: Number(grape.percentage),
        })),
        variants: product.variants.map((variant) => ({
            variantId: variant.id,
            format: variant.format,
            capacity: variant.capacity,
            capacityUnit: variant.capacityUnit,
            price: Number(variant.price),
            stock: variant.stock,
            loadedStock: variant.stock,
            isBlocked: variant.isBlocked,
        })),
    };
}

/** Un valor numérico del formulario como texto del `<input>`: `NaN` es el campo vacío. */
export function numberToInput(value: number | null | undefined): string {
    return value === null || value === undefined || Number.isNaN(value) ? '' : String(value);
}

/** Texto de un `<input type="number">` como valor del formulario: vacío es `NaN`. */
export function inputToNumber(text: string): number {
    return text.trim() === '' ? Number.NaN : Number(text);
}
