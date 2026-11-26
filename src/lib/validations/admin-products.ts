/**
 * Esquemas de validación del catálogo de productos del panel (CU9). `productFormSchema` es único y
 * lo usan el formulario (cliente) y las rutas `/api/admin/productos` (servidor): lo que el
 * formulario deja pasar es lo que la API acepta.
 */
import '@/lib/validations/locale';
import { z } from 'zod';
import {
    PRODUCT_IMAGE_FOLDER,
    PRODUCT_STATUSES,
    type AdminProductFilters,
} from '@/lib/admin/products';
import { MAX_ID } from '@/lib/validations/ids';

/** Página más alta que se acepta en el listado: evita un `offset` enorme. */
export const ADMIN_PRODUCTS_MAX_PAGE = 10_000;

/** Texto de búsqueda máximo (el nombre de un producto cabe de sobra). */
const SEARCH_MAX = 100;

/** Un parámetro opcional: si no es válido (o viene repetido), no filtra en lugar de dar error. */
const optional = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

const idParam = z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(MAX_ID));

const searchParamsSchema = z.object({
    pagina: optional(
        z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .pipe(z.number().int().min(1).max(ADMIN_PRODUCTS_MAX_PAGE)),
    ),
    tipologia: optional(idParam),
    denominacion: optional(idParam),
    bodega: optional(idParam),
    estado: optional(z.enum(PRODUCT_STATUSES)),
    q: optional(z.string().trim().min(1).max(SEARCH_MAX)),
});

/**
 * Lee los `searchParams` de `/admin/productos` (`?pagina=2&tipologia=3&estado=Activo&q=reserva`).
 * Nunca falla: lo que no es válido (página `0`, un id que no es número, un estado que no existe,
 * un parámetro repetido, una búsqueda vacía o demasiado larga) se ignora.
 *
 * @param input - `searchParams` de la página.
 * @returns La página (1 por defecto) y los filtros que sí eran válidos.
 */
export function parseAdminProductParams(
    input: Record<string, string | string[] | undefined>,
): AdminProductFilters & { page: number } {
    const parsed = searchParamsSchema.parse(input);
    return {
        page: parsed.pagina ?? 1,
        ...(parsed.tipologia && { typologyId: parsed.tipologia }),
        ...(parsed.denominacion && { guaranteeOfOriginId: parsed.denominacion }),
        ...(parsed.bodega && { wineryId: parsed.bodega }),
        ...(parsed.estado && { status: parsed.estado }),
        ...(parsed.q && { q: parsed.q }),
    };
}

/** Un id elegido en un selector: entero positivo; `null` mientras no se ha elegido. */
const chosenId = (message: string) =>
    z.number({ error: message }).int(message).min(1, message).max(MAX_ID, message);

/** Importe con como mucho dos decimales (céntimos exactos). */
const money = (message: string) =>
    z
        .number({ error: message })
        .min(0, 'El precio no puede ser negativo')
        .max(99_999_999.99, 'El precio es demasiado alto')
        .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
            message: 'Usa como mucho dos decimales',
        });

/** Una uva del producto con su porcentaje (`product_grapes`). */
export const productGrapeSchema = z.object({
    grapeId: chosenId('Elige la variedad'),
    percentage: z
        .number({ error: 'Escribe el porcentaje' })
        .gt(0, 'El porcentaje debe ser mayor que 0')
        .max(100, 'El porcentaje no puede pasar de 100')
        .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
            message: 'Usa como mucho dos decimales',
        }),
});

/** Una presentación del producto (`product_variants`). */
export const productVariantSchema = z.object({
    /** `variant_id` de una presentación que ya existe; ausente en las nuevas. */
    variantId: z.number().int().min(1).max(MAX_ID).optional(),
    format: z
        .string()
        .trim()
        .min(1, 'Escribe el formato')
        .max(50, 'El formato admite como máximo 50 caracteres'),
    capacity: z
        .number({ error: 'Escribe la capacidad' })
        .int('La capacidad es un número entero')
        .min(1, 'La capacidad debe ser mayor que 0')
        .max(MAX_ID, 'La capacidad es demasiado alta'),
    capacityUnit: z.enum(['ml', 'g']),
    price: money('Escribe el precio'),
    stock: z
        .number({ error: 'Escribe las existencias' })
        .int('Las existencias son un número entero')
        .min(0, 'Las existencias no pueden ser negativas')
        .max(MAX_ID, 'Las existencias son demasiadas'),
    /**
     * Existencias que se leyeron al abrir el formulario (control optimista). Solo en las
     * presentaciones que ya existen: el servidor escribe `stock` únicamente si difiere de ellas y
     * la fila sigue teniendo ese valor.
     */
    loadedStock: z.number().int().min(0).max(MAX_ID).optional(),
    /** Baja lógica de la presentación (`is_blocked`): no se borra, deja de ofrecerse. */
    isBlocked: z.boolean(),
});

/**
 * Datos del formulario de producto, para crear y para editar. Reglas:
 * - Las uvas no se repiten y sus porcentajes suman como máximo 100 %.
 * - Hay al menos una presentación y no se repite el par formato + capacidad (índice único de la
 *   BD `uq_variant_format`).
 * - La imagen, si hay, es un `public_id` de la carpeta de productos de Cloudinary.
 */
export const productFormSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'Escribe el nombre del producto')
            .max(100, 'El nombre admite como máximo 100 caracteres'),
        wineryId: chosenId('Elige la bodega'),
        guaranteeOfOriginId: chosenId('Elige la denominación de origen'),
        typologyId: chosenId('Elige la tipología'),
        vintage: z
            .number({ error: 'La añada es un año' })
            .int('La añada es un año')
            .min(1900, 'La añada debe ser desde 1900')
            .max(2100, 'La añada debe ser hasta 2100')
            .nullable(),
        description: z.string().trim().max(5000, 'La descripción es demasiado larga'),
        image: z
            .string()
            .max(255)
            .startsWith(`${PRODUCT_IMAGE_FOLDER}/`, 'La imagen no es válida')
            .nullable(),
        grapes: z.array(productGrapeSchema).max(20, 'Demasiadas variedades'),
        variants: z.array(productVariantSchema).min(1, 'Añade al menos una presentación').max(30),
    })
    .superRefine((value, ctx) => {
        const seenGrapes = new Set<number>();
        value.grapes.forEach(({ grapeId }, index) => {
            if (seenGrapes.has(grapeId))
                ctx.addIssue({
                    code: 'custom',
                    path: ['grapes', index, 'grapeId'],
                    message: 'Esa variedad ya está añadida',
                });
            seenGrapes.add(grapeId);
        });
        const cents = value.grapes.reduce((sum, g) => sum + Math.round(g.percentage * 100), 0);
        if (cents > 10_000)
            ctx.addIssue({
                code: 'custom',
                path: ['grapes'],
                message: 'Los porcentajes de uva no pueden sumar más de 100 %',
            });
        const seenVariants = new Set<string>();
        value.variants.forEach((variant, index) => {
            const key = `${variant.format.trim().toLowerCase()}|${variant.capacity}`;
            if (seenVariants.has(key))
                ctx.addIssue({
                    code: 'custom',
                    path: ['variants', index, 'format'],
                    message: 'Ya hay una presentación con ese formato y capacidad',
                });
            seenVariants.add(key);
        });
    });

/** Lo que el formulario edita: la forma de `productFormSchema` ya validada. */
export type ProductFormValues = z.infer<typeof productFormSchema>;

/** Cuerpo de `PATCH /api/admin/productos/[id]/estado`: el estado de venta nuevo. */
export const productSalesSchema = z.object({ isBlocked: z.boolean() }).strict();
