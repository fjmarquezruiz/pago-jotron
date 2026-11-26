import '@/lib/validations/locale';
import { z } from 'zod';
import { PRODUCT_TYPES, type AdminTypologyFilters } from '@/lib/admin/typologies';

/** Texto de búsqueda máximo (el nombre de una tipología cabe de sobra). */
const SEARCH_MAX = 50;

/** Un parámetro opcional: si no es válido (o viene repetido), no filtra en lugar de dar error. */
const optional = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

const searchParamsSchema = z.object({
    tipo: optional(z.enum(PRODUCT_TYPES)),
    q: optional(z.string().trim().min(1).max(SEARCH_MAX)),
});

/**
 * Lee los `searchParams` de `/admin/tipologias` (`?tipo=Pasas&q=pasa`). Nunca falla: lo que no es
 * válido (un tipo que no existe, un parámetro repetido, una búsqueda vacía o demasiado larga) se
 * ignora.
 *
 * @param input - `searchParams` de la página.
 * @returns Los filtros que sí eran válidos.
 */
export function parseAdminTypologyParams(
    input: Record<string, string | string[] | undefined>,
): AdminTypologyFilters {
    const parsed = searchParamsSchema.parse(input);
    return {
        ...(parsed.tipo && { productType: parsed.tipo }),
        ...(parsed.q && { q: parsed.q }),
    };
}

/** Mayor valor de «Orden en filtros»: el `int` de MySQL no llega, pero 9999 sobra. */
export const FILTER_ORDER_MAX = 9999;

/**
 * Cuerpo de `POST /api/admin/tipologias` y `PATCH /api/admin/tipologias/[id]`, y esquema del
 * formulario del modal. Los campos son los de `typologies`: nombre (`varchar(50)` único), tipo de
 * producto, orden en los filtros e IVA (`decimal(5,2)`, en %, de 0 a 100 con dos decimales como
 * mucho).
 */
export const typologySchema = z
    .object({
        name: z
            .string({ error: 'Escribe el nombre de la tipología' })
            .trim()
            .min(1, 'Escribe el nombre de la tipología')
            .max(50, 'El nombre no puede pasar de 50 caracteres'),
        productType: z.enum(PRODUCT_TYPES, { error: 'Elige el tipo de producto' }),
        filterOrder: z
            .number({ error: 'Indica el orden en los filtros' })
            .int('El orden debe ser un número entero')
            .min(0, 'El orden no puede ser negativo')
            .max(FILTER_ORDER_MAX, `El orden no puede pasar de ${FILTER_ORDER_MAX}`),
        taxRate: z
            .number({ error: 'Indica el IVA' })
            .min(0, 'El IVA no puede ser negativo')
            .max(100, 'El IVA no puede pasar de 100 %')
            .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
                message: 'El IVA admite dos decimales como mucho',
            }),
    })
    .strict();

export type TypologyInput = z.infer<typeof typologySchema>;
