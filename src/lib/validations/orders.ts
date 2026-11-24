import '@/lib/validations/locale';
import { z } from 'zod';
import { ORDER_STATUS } from '@/lib/orders/status';

/** Pedidos por página del historial (Figma: "Mostrando 1–10 de 142"). */
export const ORDER_HISTORY_PAGE_SIZE = 10;

/** Página más alta que se acepta: más allá no hay historial real y evita un `offset` enorme. */
export const ORDER_HISTORY_MAX_PAGE = 10_000;

/** Estados que se pueden filtrar: los del pedido, por su nombre. */
const STATUS_NAMES = Object.values(ORDER_STATUS) as [string, ...string[]];

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
            .pipe(z.number().int().min(1).max(ORDER_HISTORY_MAX_PAGE)),
    ),
    estado: optional(z.enum(STATUS_NAMES)),
    desde: optional(isoDate),
    hasta: optional(isoDate),
});

/** Filtros y página del historial de pedidos, ya saneados. */
export interface OrderHistoryParams {
    /** Página a mostrar (desde 1). */
    page: number;
    /** Nombre del estado, si se filtra. */
    status?: string;
    /** Primer día incluido, `AAAA-MM-DD`. */
    from?: string;
    /** Último día incluido, `AAAA-MM-DD`. */
    to?: string;
}

/**
 * Lee los `searchParams` de `/cuenta/pedidos` (`?pagina=2&estado=Enviado&desde=2026-01-01&hasta=2026-03-31`).
 * Nunca falla: lo que no es válido (página `0` o `abc`, un estado que no existe, una fecha
 * imposible, un parámetro repetido) se ignora, y si el rango está al revés (`desde` > `hasta`) se
 * descartan las dos fechas, porque no se puede saber cuál es la buena.
 *
 * @param input - `searchParams` de la página (un valor, varios o ninguno por clave).
 * @returns La página (1 por defecto) y los filtros que sí eran válidos.
 *
 * @example
 * parseOrderHistoryParams({ pagina: '2', estado: 'Enviado', desde: 'ayer' });
 * // { page: 2, status: 'Enviado' }
 */
export function parseOrderHistoryParams(
    input: Record<string, string | string[] | undefined>,
): OrderHistoryParams {
    const parsed = searchParamsSchema.parse(input);
    const range = parsed.desde && parsed.hasta && parsed.desde > parsed.hasta ? {} : parsed;
    return {
        page: parsed.pagina ?? 1,
        ...(parsed.estado && { status: parsed.estado }),
        ...(range.desde && { from: range.desde }),
        ...(range.hasta && { to: range.hasta }),
    };
}

/** Texto de búsqueda máximo del listado de administración (un correo cabe de sobra). */
const ADMIN_SEARCH_MAX = 100;

/**
 * Lee los `searchParams` de `/admin/pedidos`: los mismos que el historial del cliente más `q`
 * (número de pedido o correo del cliente). Nunca falla: un `q` vacío, repetido o demasiado largo
 * se ignora.
 *
 * @param input - `searchParams` de la página.
 * @returns La página (1 por defecto) y los filtros válidos.
 */
export function parseAdminOrderParams(
    input: Record<string, string | string[] | undefined>,
): OrderHistoryParams & { q?: string } {
    const base = parseOrderHistoryParams(input);
    const raw = typeof input.q === 'string' ? input.q.trim() : '';
    return raw && raw.length <= ADMIN_SEARCH_MAX ? { ...base, q: raw } : base;
}
