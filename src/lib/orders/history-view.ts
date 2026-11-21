import { formatShortDate } from './dates';

/** Filtros del historial tal como viajan en la URL (`estado`, `desde`, `hasta`). */
export interface HistoryFilters {
    /** Nombre del estado. */
    status?: string;
    /** Primer día incluido, `AAAA-MM-DD`. */
    from?: string;
    /** Último día incluido, `AAAA-MM-DD`. */
    to?: string;
}

/** Ruta del historial de pedidos. */
export const ORDER_HISTORY_PATH = '/cuenta/pedidos';

/**
 * Enlace a una página del historial conservando los filtros: `/cuenta/pedidos?pagina=2&estado=Enviado`.
 * La página 1 va sin `pagina` y, sin nada que añadir, es la ruta a secas.
 *
 * @param params - Página (desde 1) y filtros.
 * @returns La ruta con su cadena de consulta.
 *
 * @example
 * orderHistoryHref({ page: 2, status: 'Enviado' }); // '/cuenta/pedidos?pagina=2&estado=Enviado'
 */
export function orderHistoryHref({
    page = 1,
    status,
    from,
    to,
}: HistoryFilters & { page?: number }): string {
    const query = new URLSearchParams();
    if (page > 1) query.set('pagina', String(page));
    if (status) query.set('estado', status);
    if (from) query.set('desde', from);
    if (to) query.set('hasta', to);
    const text = query.toString();
    return text ? `${ORDER_HISTORY_PATH}?${text}` : ORDER_HISTORY_PATH;
}

/** `true` si hay algún filtro puesto. */
export function hasHistoryFilters({ status, from, to }: HistoryFilters): boolean {
    return Boolean(status || from || to);
}

/** Un `AAAA-MM-DD` como `10 jul 2025` (al mediodía UTC, para que ninguna zona cambie el día). */
const day = (iso: string) => formatShortDate(`${iso} 12:00:00`);

/**
 * Texto de cada chip de "Filtros activos": `Estado: Todos` o el estado elegido, y `Fecha: Todas`,
 * `Fecha: desde 1 jul 2026`, `Fecha: hasta 31 jul 2026` o el rango `1 jul 2026 – 31 jul 2026`.
 *
 * @param filters - Filtros saneados (`parseOrderHistoryParams`).
 * @returns Los dos textos.
 */
export function historyFilterLabels({ status, from, to }: HistoryFilters): {
    status: string;
    date: string;
} {
    let date = 'Todas';
    if (from && to) date = `${day(from)} – ${day(to)}`;
    else if (from) date = `desde ${day(from)}`;
    else if (to) date = `hasta ${day(to)}`;
    return { status: `Estado: ${status ?? 'Todos'}`, date: `Fecha: ${date}` };
}

/**
 * Texto del pie de la tabla: `Mostrando 11–20 de 142`. Sin resultados, `Mostrando 0 de 0`.
 *
 * @param input.page - Página mostrada (desde 1).
 * @param input.pageSize - Pedidos por página.
 * @param input.shown - Cuántos salen en esta página.
 * @param input.total - Total de pedidos con los filtros puestos.
 */
export function historyRangeText({
    page,
    pageSize,
    shown,
    total,
}: {
    page: number;
    pageSize: number;
    shown: number;
    total: number;
}): string {
    if (shown === 0) return 'Mostrando 0 de 0';
    const first = (page - 1) * pageSize + 1;
    return `Mostrando ${first}–${first + shown - 1} de ${total}`;
}
