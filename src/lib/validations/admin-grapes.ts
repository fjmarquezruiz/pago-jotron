import '@/lib/validations/locale';
import { z } from 'zod';
import { GRAPE_COLORS, type AdminGrapeFilters } from '@/lib/admin/grapes';

/** Página más alta que se acepta: más allá no hay listado real y evita un `offset` enorme. */
export const ADMIN_GRAPES_MAX_PAGE = 10_000;

/** Texto de búsqueda máximo (el nombre de una uva cabe de sobra). */
const SEARCH_MAX = 100;

/** Un parámetro opcional: si no es válido (o viene repetido), no filtra en lugar de dar error. */
const optional = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

const searchParamsSchema = z.object({
    pagina: optional(
        z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .pipe(z.number().int().min(1).max(ADMIN_GRAPES_MAX_PAGE)),
    ),
    color: optional(z.enum(GRAPE_COLORS)),
    q: optional(z.string().trim().min(1).max(SEARCH_MAX)),
});

/**
 * Lee los `searchParams` de `/admin/uvas` (`?pagina=2&color=Tinta&q=temp`). Nunca falla: lo que no
 * es válido (página `0`, un color que no existe, un parámetro repetido, una búsqueda vacía o
 * demasiado larga) se ignora.
 *
 * @param input - `searchParams` de la página.
 * @returns La página (1 por defecto) y los filtros que sí eran válidos.
 */
export function parseAdminGrapeParams(
    input: Record<string, string | string[] | undefined>,
): AdminGrapeFilters & { page: number } {
    const parsed = searchParamsSchema.parse(input);
    return {
        page: parsed.pagina ?? 1,
        ...(parsed.color && { color: parsed.color }),
        ...(parsed.q && { q: parsed.q }),
    };
}

/**
 * Cuerpo de `POST /api/admin/uvas` y `PATCH /api/admin/uvas/[id]`, y esquema del formulario del
 * modal (`grapes.name` es `varchar(100)` único y `color`, el enum). Los mismos campos que enseña
 * Figma: nombre y color.
 */
export const grapeSchema = z
    .object({
        name: z
            .string({ error: 'Escribe el nombre de la variedad' })
            .trim()
            .min(1, 'Escribe el nombre de la variedad')
            .max(100, 'El nombre no puede pasar de 100 caracteres'),
        color: z.enum(GRAPE_COLORS, { error: 'Elige el color' }),
    })
    .strict();

export type GrapeInput = z.infer<typeof grapeSchema>;
