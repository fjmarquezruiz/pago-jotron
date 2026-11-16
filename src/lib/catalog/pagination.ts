/** Productos por página del listado: 4 columnas × 3 filas, como en Figma. */
export const CATALOG_PAGE_SIZE = 12;

/** Resultado de calcular la paginación de un listado. */
export interface Pagination {
    /** Página a mostrar, ya ajustada al rango `1..totalPages`. */
    page: number;
    /** Productos por página (entero >= 1). */
    pageSize: number;
    /** Número de páginas: al menos 1, aunque no haya resultados. */
    totalPages: number;
    /** `true` si la página pedida no existe (pasa de la última): conviene redirigir a `page`. */
    outOfRange: boolean;
    hasPrevious: boolean;
    hasNext: boolean;
}

/**
 * Entero >= 1: un valor inválido (`0`, negativo, decimal o `NaN`) se corrige en lugar de romper
 * un `limit`/`offset` o una división.
 *
 * @param value - Número de entrada, normalmente salido de la URL.
 * @returns El entero por debajo del valor, nunca menor que 1 (`1` si no es un número finito).
 *
 * @example
 * toPositiveInt(2.9); // 2
 */
export function toPositiveInt(value: number): number {
    return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

/**
 * Calcula la paginación de un listado: cuántas páginas hay y qué página mostrar. La página pedida
 * se ajusta al rango válido; si se pasaba de la última, `outOfRange` avisa para que la página
 * redirija en vez de pintar una rejilla vacía.
 *
 * @param input.page - Página pedida (desde 1), tal como llega de la URL.
 * @param input.pageSize - Productos por página.
 * @param input.total - Total de productos del listado (el de `getCatalogPage`).
 * @returns La página ajustada, el número de páginas y si hay anterior y siguiente.
 *
 * @example
 * getPagination({ page: 9, pageSize: 12, total: 30 });
 * // { page: 3, pageSize: 12, totalPages: 3, outOfRange: true, hasPrevious: true, hasNext: false }
 */
export function getPagination(input: {
    page: number;
    pageSize: number;
    total: number;
}): Pagination {
    const pageSize = toPositiveInt(input.pageSize);
    const total = Number.isFinite(input.total) ? Math.max(0, Math.floor(input.total)) : 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const requested = toPositiveInt(input.page);
    const page = Math.min(requested, totalPages);

    return {
        page,
        pageSize,
        totalPages,
        outOfRange: requested > totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages,
    };
}

/** Un número de página o un hueco (`…`) de la paginación. */
export type PageWindowItem = number | 'ellipsis';

/**
 * Números de página que enseña la paginación (variante `full` del sistema de diseño): siempre la
 * primera, la última y las cercanas a la actual, con `…` en los saltos. Con 7 páginas o menos se
 * ven todas. Con más, la lista mide siempre 7 huecos para que la paginación no cambie de ancho al
 * pasar de página.
 *
 * @param page - Página actual (ya ajustada con `getPagination`).
 * @param totalPages - Número total de páginas.
 * @returns Los números y los huecos, en orden.
 *
 * @example
 * getPageWindow(3, 10); // [1, 2, 3, 4, 5, 'ellipsis', 10]
 * getPageWindow(6, 10); // [1, 'ellipsis', 5, 6, 7, 'ellipsis', 10]
 */
export function getPageWindow(page: number, totalPages: number): PageWindowItem[] {
    const last = toPositiveInt(totalPages);
    const current = Math.min(toPositiveInt(page), last);
    if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', last];
    if (current >= last - 3) return [1, 'ellipsis', last - 4, last - 3, last - 2, last - 1, last];
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', last];
}
