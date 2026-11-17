import { DEFAULT_CATALOG_SORT, type CatalogSort } from '@/lib/catalog/filter-constants';
import { toPositiveInt } from '@/lib/catalog/pagination';
import type { CatalogFilters } from '@/lib/validations/catalog';

/** Ruta del listado de productos. */
export const CATALOG_PATH = '/productos';

/** `id` de la sección de resultados del listado: el destino del ancla de la paginación. */
export const CATALOG_RESULTS_ID = 'resultados';

/** Búsqueda, filtros y orden que se conservan en la URL del listado. */
export interface CatalogUrlState {
    filters?: CatalogFilters;
    orden?: CatalogSort;
}

/** Filtros con un valor propio en la URL, en el orden en que se escriben (`q` va antes). */
const FILTER_PARAMS = ['do', 'bodega', 'uva', 'tipologia', 'precio', 'anada'] as const;

/**
 * URL de una página del listado, con su búsqueda, sus filtros y su orden. Cada listado tiene una
 * sola URL (indexable y sin duplicados): solo aparece lo que no es el valor por defecto, así que
 * la primera página sin filtros es `/productos`, sin `?page=1`, y el orden `recientes` no se
 * escribe. Los parámetros salen siempre en el mismo orden. Una página inválida cuenta como la
 * primera.
 *
 * @param page - Número de página (desde 1).
 * @param state - Búsqueda, filtros y orden activos. Para cambiarlos, pasa los nuevos y la página 1.
 * @returns `/productos`, `/productos?page=N` o con los parámetros que haya.
 *
 * @example
 * catalogPageHref(3); // '/productos?page=3'
 * catalogPageHref(1); // '/productos'
 * catalogPageHref(2, { filters: { tipologia: 1, precio: '10-15' }, orden: 'precio-asc' });
 * // '/productos?tipologia=1&precio=10-15&orden=precio-asc&page=2'
 */
export function catalogPageHref(
    page: number,
    { filters = {}, orden }: CatalogUrlState = {},
): string {
    const params = new URLSearchParams();

    const q = filters.q?.trim();
    if (q) params.set('q', q);
    for (const key of FILTER_PARAMS) {
        const value = filters[key];
        if (value !== undefined) params.set(key, String(value));
    }
    if (orden && orden !== DEFAULT_CATALOG_SORT) params.set('orden', orden);

    const target = toPositiveInt(page);
    if (target > 1) params.set('page', String(target));

    const query = params.toString();
    return query ? `${CATALOG_PATH}?${query}` : CATALOG_PATH;
}

/**
 * URL de una página del listado con el ancla de los resultados (`#resultados`). Es la de la
 * paginación: al pasar de página el navegador baja a los resultados en vez de volver al inicio,
 * por encima del hero. Es un ancla normal: también baja a los resultados al abrir el enlace en otra
 * pestaña o al recargar la página.
 *
 * @param page - Número de página (desde 1).
 * @param state - Búsqueda, filtros y orden activos.
 * @returns Lo mismo que `catalogPageHref`, terminado en `#resultados`.
 *
 * @example
 * catalogResultsHref(2, { filters: { tipologia: 1 } }); // '/productos?tipologia=1&page=2#resultados'
 */
export function catalogResultsHref(page: number, state: CatalogUrlState = {}): string {
    return `${catalogPageHref(page, state)}#${CATALOG_RESULTS_ID}`;
}
