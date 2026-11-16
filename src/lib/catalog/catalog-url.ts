import { toPositiveInt } from '@/lib/catalog/pagination';

/** Ruta del listado de productos. */
export const CATALOG_PATH = '/productos';

/**
 * URL de una página del listado. La primera es `/productos`, sin `?page=1`, para que cada página
 * tenga una sola URL (indexable y sin duplicados). Una página inválida cuenta como la primera.
 *
 * @param page - Número de página (desde 1).
 * @returns `/productos` o `/productos?page=N`.
 *
 * @example
 * catalogPageHref(3); // '/productos?page=3'
 * catalogPageHref(1); // '/productos'
 */
export function catalogPageHref(page: number): string {
    const target = toPositiveInt(page);
    return target === 1 ? CATALOG_PATH : `${CATALOG_PATH}?page=${target}`;
}
