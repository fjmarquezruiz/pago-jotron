/**
 * Reglas puras del listado y la ficha de variedades de uva del panel (CU9): colores, filtros de la
 * URL, enlaces, textos de la tabla y cuándo se puede borrar una uva. Sin acceso a la BD, para poder
 * probarlas.
 */
import { entityNumber } from '@/lib/admin/catalog';
import type { BadgeProps } from '@/components/ui/badge';

/** Ruta del listado de variedades de uva del panel. */
export const ADMIN_GRAPES_PATH = '/admin/uvas';

/** Uvas por página del listado (Figma: «Mostrando 1–10 de 30 variedades de uva»). */
export const ADMIN_GRAPES_PAGE_SIZE = 10;

/** Colores de la piel, como el enum de `grapes.color`, en el orden en que se ofrecen. */
export const GRAPE_COLORS = ['Tinta', 'Blanca', 'Rosada'] as const;
export type GrapeColor = (typeof GRAPE_COLORS)[number];

/** Filtros del listado tal como viajan en la URL (`color`, `q`). */
export interface AdminGrapeFilters {
    color?: GrapeColor;
    /** Texto buscado en el nombre. */
    q?: string;
}

/** `true` si hay algún filtro puesto. */
export function hasAdminGrapeFilters({ color, q }: AdminGrapeFilters): boolean {
    return Boolean(color || q);
}

/**
 * Id de una uva como se enseña: `GRP-001`. No hay columna: se deriva del id.
 *
 * @param id - `grapes.grape_id`.
 */
export function grapeNumber(id: number): string {
    return entityNumber('GRP', id);
}

/**
 * Tono del `Badge` del color (Figma: wine-red-subtle en Tinta); mismo tono que el tipo de vino.
 *
 * @param color - `grapes.color`.
 */
export function grapeColorTone(color: GrapeColor): NonNullable<BadgeProps['tone']> {
    return color === 'Tinta' ? 'wine-red' : color === 'Blanca' ? 'wine-white' : 'wine-rose';
}

/**
 * Enlace a una página del listado conservando los filtros: `/admin/uvas?pagina=2&color=Tinta`. La
 * página 1 va sin `pagina`.
 */
export function adminGrapesHref({
    page = 1,
    color,
    q,
}: AdminGrapeFilters & { page?: number }): string {
    const query = new URLSearchParams();
    if (page > 1) query.set('pagina', String(page));
    if (color) query.set('color', color);
    if (q) query.set('q', q);
    const text = query.toString();
    return text ? `${ADMIN_GRAPES_PATH}?${text}` : ADMIN_GRAPES_PATH;
}

/**
 * Chips de «Filtros activos:» (Figma: «Color: todas»): el color o «todas» y, aparte, la búsqueda
 * con el texto tal cual.
 */
export function adminGrapeFilterLabels({ color, q }: AdminGrapeFilters): {
    color: string;
    search?: string;
} {
    return { color: `Color: ${color ? color.toLowerCase() : 'todas'}`, ...(q && { search: q }) };
}

/**
 * Pie de la tabla. Sin filtros, `Mostrando 1–10 de 30 variedades de uva`; con filtros, `Mostrando 3
 * variedades filtradas de 30`; sin resultados, `Mostrando 0 de 0`.
 */
export function adminGrapesRangeText({
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
        return `Mostrando ${total} ${total === 1 ? 'variedad filtrada' : 'variedades filtradas'} de ${overall}`;
    const first = (page - 1) * pageSize + 1;
    return `Mostrando ${first}–${first + shown - 1} de ${total} ${total === 1 ? 'variedad de uva' : 'variedades de uva'}`;
}

/**
 * Una uva solo se borra si ningún producto la usa: `product_grapes` borra en cascada, así que
 * borrarla en uso la quitaría en silencio de las fichas.
 *
 * @param wineCount - Productos que la usan.
 */
export function canDeleteGrape(wineCount: number): boolean {
    return wineCount === 0;
}
