import '@/lib/validations/locale';
import { z } from 'zod';
import { ROLES, USER_STATUSES, type AdminUserFilters } from '@/lib/admin/users';

/** Página más alta que se acepta: más allá no hay listado real y evita un `offset` enorme. */
export const ADMIN_USERS_MAX_PAGE = 10_000;

/** Texto de búsqueda máximo (un correo cabe de sobra). */
const SEARCH_MAX = 100;

/** Un parámetro opcional: si no es válido (o viene repetido), no filtra en lugar de dar error. */
const optional = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

const searchParamsSchema = z.object({
    pagina: optional(
        z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .pipe(z.number().int().min(1).max(ADMIN_USERS_MAX_PAGE)),
    ),
    rol: optional(z.enum(ROLES as [string, ...string[]])),
    estado: optional(z.enum(USER_STATUSES)),
    q: optional(z.string().trim().min(1).max(SEARCH_MAX)),
});

/**
 * Lee los `searchParams` de `/admin/usuarios` (`?pagina=2&rol=Editor&estado=Activo&q=lucia`). Nunca
 * falla: lo que no es válido (página `0`, un rol que no existe, un parámetro repetido, una
 * búsqueda vacía o demasiado larga) se ignora.
 *
 * @param input - `searchParams` de la página.
 * @returns La página (1 por defecto) y los filtros que sí eran válidos.
 */
export function parseAdminUserParams(
    input: Record<string, string | string[] | undefined>,
): AdminUserFilters & { page: number } {
    const parsed = searchParamsSchema.parse(input);
    return {
        page: parsed.pagina ?? 1,
        ...(parsed.rol && { role: parsed.rol as AdminUserFilters['role'] }),
        ...(parsed.estado && { status: parsed.estado }),
        ...(parsed.q && { q: parsed.q }),
    };
}

/** Cuerpo de `PATCH /api/admin/usuarios/[id]`: el rol y/o el estado nuevos; al menos uno. */
export const accessChangeSchema = z
    .object({
        role: z.enum(ROLES as [string, ...string[]]).optional(),
        isActive: z.boolean().optional(),
    })
    .strict()
    .refine((value) => value.role !== undefined || value.isActive !== undefined, {
        message: 'Indica el rol o el estado',
    });
