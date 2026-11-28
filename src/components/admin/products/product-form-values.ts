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
        categories: product.categories,
        tastingTags: product.tastingTags,
        visualNote: product.visualNote ?? '',
        aromaNote: product.aromaNote ?? '',
        palateNote: product.palateNote ?? '',
        foodPairing: product.foodPairing ?? '',
        alcoholContent: decimalToNumber(product.alcoholContent),
        minTemperature: decimalToNumber(product.minTemperature),
        maxTemperature: decimalToNumber(product.maxTemperature),
        agingTime: product.agingTime ?? '',
        agingMethod: product.agingMethod ?? '',
        production: product.production ?? '',
        soilType: product.soilType ?? '',
        vineyardAltitude: product.vineyardAltitude,
        yield: product.yield,
        steps: product.steps.map((step) => ({
            title: step.title,
            description: step.description ?? '',
        })),
    };
}

/** Un decimal de la BD (texto) como número; `null` si no hay. */
function decimalToNumber(value: string | null): number | null {
    return value === null ? null : Number(value);
}

/** Un valor numérico del formulario como texto del `<input>`: `NaN` es el campo vacío. */
export function numberToInput(value: number | null | undefined): string {
    return value === null || value === undefined || Number.isNaN(value) ? '' : String(value);
}

/** Texto de un `<input type="number">` como valor del formulario: vacío es `NaN`. */
export function inputToNumber(text: string): number {
    return text.trim() === '' ? Number.NaN : Number(text);
}

/**
 * Los valores de un producto de pasas: sin los campos que solo tiene el vino (notas de vista,
 * nariz y boca, etiquetas de cata, ficha técnica, datos clave y pasos de elaboración), que el
 * formulario de pasas no muestra (Figma: catalogue-create - pasas). Así, cambiar la tipología de
 * vino a pasas no guarda lo que quedó escrito en secciones ocultas.
 *
 * @param values - Valores del formulario.
 */
export function withoutWineSections(values: ProductFormValues): ProductFormValues {
    return {
        ...values,
        visualNote: '',
        aromaNote: '',
        palateNote: '',
        tastingTags: [],
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
    };
}
