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
