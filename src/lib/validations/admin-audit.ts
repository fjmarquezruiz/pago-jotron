import '@/lib/validations/locale';
import { z } from 'zod';
import { AUDIT_KIND_NAMES, type AdminAuditFilters } from '@/lib/admin/audit';

/** Página más alta que se acepta: más allá no hay registro real y evita un `offset` enorme. */
export const ADMIN_AUDIT_MAX_PAGE = 10_000;

/** Texto de búsqueda máximo. */
const SEARCH_MAX = 100;

/** Día real `AAAA-MM-DD`: rechaza `2026-02-30` y formatos con hora o espacios. */
const isoDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((text) => {
        const date = new Date(`${text}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
    });

/** Un parámetro opcional: si no es válido (o viene repetido), no filtra en lugar de dar error. */
const optional = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

const searchParamsSchema = z.object({
    pagina: optional(
        z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .pipe(z.number().int().min(1).max(ADMIN_AUDIT_MAX_PAGE)),
    ),
    desde: optional(isoDate),
    hasta: optional(isoDate),
    usuario: optional(
        z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .pipe(z.number().int().min(1).max(2_147_483_647)),
    ),
    tipo: optional(z.enum(AUDIT_KIND_NAMES)),
    q: optional(z.string().trim().min(1).max(SEARCH_MAX)),
});

/**
 * Lee los `searchParams` de `/admin/auditoria`
 * (`?pagina=2&desde=2026-10-01&hasta=2026-10-31&usuario=3&tipo=Pedido&q=PJ-4521`). Nunca falla: lo
 * que no es válido (página `0`, una fecha imposible, un tipo que no existe, un parámetro repetido)
 * se ignora, y si el rango está al revés se descartan las dos fechas.
 *
 * @param input - `searchParams` de la página.
 * @returns La página (1 por defecto) y los filtros que sí eran válidos.
 */
export function parseAdminAuditParams(
    input: Record<string, string | string[] | undefined>,
): AdminAuditFilters & { page: number } {
    const parsed = searchParamsSchema.parse(input);
    const range = parsed.desde && parsed.hasta && parsed.desde > parsed.hasta ? {} : parsed;
    return {
        page: parsed.pagina ?? 1,
        ...(range.desde && { from: range.desde }),
        ...(range.hasta && { to: range.hasta }),
        ...(parsed.usuario && { userId: parsed.usuario }),
        ...(parsed.tipo && { kind: parsed.tipo }),
        ...(parsed.q && { q: parsed.q }),
    };
}
