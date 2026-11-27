/**
 * Reglas del registro de actividad del panel (RF12). Funciones puras: lo que el listado enseña y
 * cómo se filtra sale de aquí. `audit_logs` no guarda el tipo: se deduce del principio de `action`
 * (sin migración), que es como lo componen los servicios (`Pedido PJ-4521: …`, `Bodega 3: …`).
 */
import { formatShortDate } from '@/lib/orders/dates';

/** Ruta del registro de actividad del panel. */
export const ADMIN_AUDIT_PATH = '/admin/auditoria';

/** Asientos por página (Figma: "Mostrando 1–10 de 142 registros"). */
export const ADMIN_AUDIT_PAGE_SIZE = 10;

/**
 * Tipos de asiento, en el orden en que se ofrecen, con el principio de `action` que los identifica
 * y el color del punto (tokens del sistema: el diseño usa hex sueltos y estos son los más cercanos).
 * `Sistema` es todo lo que no empieza por ninguno de los demás (avisos críticos, como un
 * reembolso pendiente).
 */
export const AUDIT_KINDS = [
    { kind: 'Pedido', prefixes: ['Pedido'], dot: 'bg-info' },
    {
        kind: 'Catálogo',
        prefixes: ['Producto ', 'Denominación de origen ', 'Variedad de uva ', 'Tipología '],
        dot: 'bg-wine-sweet',
    },
    { kind: 'Bodega', prefixes: ['Bodega '], dot: 'bg-wine-red' },
    { kind: 'Usuario', prefixes: ['Usuario '], dot: 'bg-success' },
    { kind: 'Envío', prefixes: ['Tipo de envío '], dot: 'bg-warning' },
    { kind: 'Sistema', prefixes: [], dot: 'bg-muted-foreground' },
] as const;

export type AuditKind = (typeof AUDIT_KINDS)[number]['kind'];

/** Nombres de los tipos, en orden. */
export const AUDIT_KIND_NAMES = AUDIT_KINDS.map((item) => item.kind) as [AuditKind, ...AuditKind[]];

/**
 * Tipo de un asiento, por el principio de su acción.
 *
 * @param action - `audit_logs.action`.
 * @returns El tipo; `Sistema` si no encaja en ninguno.
 * @example
 * auditKind('Pedido PJ-4521: Confirmado → En proceso'); // 'Pedido'
 * auditKind('Reembolso pendiente'); // 'Sistema'
 */
export function auditKind(action: string): AuditKind {
    const found = AUDIT_KINDS.find(({ prefixes }) =>
        prefixes.some((prefix) => action.startsWith(prefix)),
    );
    return found?.kind ?? 'Sistema';
}

/** Clase del punto de color de un tipo. */
export function auditDotClass(kind: AuditKind): string {
    return AUDIT_KINDS.find((item) => item.kind === kind)!.dot;
}

/** Filtros del registro tal como viajan en la URL (`desde`, `hasta`, `usuario`, `tipo`, `q`). */
export interface AdminAuditFilters {
    /** Primer día incluido, `AAAA-MM-DD`. */
    from?: string;
    /** Último día incluido, `AAAA-MM-DD`. */
    to?: string;
    /** `users.user_id` de quien hizo la acción. */
    userId?: number;
    kind?: AuditKind;
    /** Texto buscado en la acción y en el detalle. */
    q?: string;
}

/** `true` si hay algún filtro puesto. */
export function hasAdminAuditFilters({ from, to, userId, kind, q }: AdminAuditFilters): boolean {
    return Boolean(from || to || userId || kind || q);
}

/**
 * Enlace a una página del registro conservando los filtros:
 * `/admin/auditoria?pagina=2&tipo=Pedido`. La página 1 va sin `pagina`.
 */
export function adminAuditHref({
    page = 1,
    from,
    to,
    userId,
    kind,
    q,
}: AdminAuditFilters & { page?: number }): string {
    const query = new URLSearchParams();
    if (page > 1) query.set('pagina', String(page));
    if (from) query.set('desde', from);
    if (to) query.set('hasta', to);
    if (userId) query.set('usuario', String(userId));
    if (kind) query.set('tipo', kind);
    if (q) query.set('q', q);
    const text = query.toString();
    return text ? `${ADMIN_AUDIT_PATH}?${text}` : ADMIN_AUDIT_PATH;
}

const day = (iso: string) => formatShortDate(`${iso} 12:00:00`);

/**
 * Texto de los chips de "Filtros activos" (Figma: `Fechas: …` y `Usuarios: todos`), más el del tipo
 * y la búsqueda tal cual.
 *
 * @param filters - Filtros vigentes.
 * @param userName - Nombre de la cuenta filtrada, si se filtra por una.
 */
export function adminAuditFilterLabels(
    { from, to, userId, kind, q }: AdminAuditFilters,
    userName?: string,
): { date: string; user: string; kind: string; search?: string } {
    let date = 'todas';
    if (from && to) date = `${day(from)} – ${day(to)}`;
    else if (from) date = `desde ${day(from)}`;
    else if (to) date = `hasta ${day(to)}`;
    return {
        date: `Fechas: ${date}`,
        user: `Usuarios: ${userId ? (userName ?? `cuenta ${userId}`) : 'todos'}`,
        kind: `Tipo: ${kind ? kind.toLowerCase() : 'todos'}`,
        ...(q && { search: q }),
    };
}

/**
 * Pie de la tabla. Sin filtros, `Mostrando 1–10 de 142 registros`; con filtros, `Mostrando 3
 * registros filtrados de 142`; sin resultados, `Mostrando 0 de 0`.
 */
export function adminAuditRangeText({
    page,
    pageSize,
    shown,
    total,
    overall,
    filtered,
}: {
    page: number;
    pageSize: number;
    shown: number;
    total: number;
    overall: number;
    filtered: boolean;
}): string {
    if (shown === 0) return 'Mostrando 0 de 0';
    if (filtered)
        return `Mostrando ${total} ${total === 1 ? 'registro filtrado' : 'registros filtrados'} de ${overall}`;
    const first = (page - 1) * pageSize + 1;
    return `Mostrando ${first}–${first + shown - 1} de ${total} registros`;
}
