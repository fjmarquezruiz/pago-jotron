import type { CatalogSort, PriceRange, SelectFilterKey } from '@/lib/catalog/filter-constants';

/** Texto de cada select de filtro: lo que lee el placeholder y la etiqueta (Figma: WinesFilter). */
export const SELECT_FILTER_LABELS: Record<SelectFilterKey, string> = {
    tipologia: 'Tipología',
    do: 'Denominación',
    bodega: 'Bodega',
    uva: 'Uva',
    anada: 'Añada',
    precio: 'Precio',
};

/**
 * Texto de cada tramo de precio, en el select y en el chip. El importe y el € van unidos con un
 * espacio duro para que un tramo no se parta en dos líneas.
 */
export const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
    'hasta-10': 'Menos de 10 €',
    '10-15': '10 € – 15 €',
    '15-25': '15 € – 25 €',
    'mas-25': '25 € o más',
};

/** Texto de cada criterio de "Ordenar por". */
export const CATALOG_SORT_LABELS: Record<CatalogSort, string> = {
    recientes: 'Más recientes',
    'precio-asc': 'Precio: de menor a mayor',
    'precio-desc': 'Precio: de mayor a menor',
    nombre: 'Nombre: A-Z',
};

/**
 * Texto de la barra de información del listado.
 *
 * @param total - Productos que cumplen la búsqueda y los filtros (no solo los de la página).
 * @returns "Mostrando 1 producto" o "Mostrando N productos".
 */
export function resultsSummary(total: number): string {
    return total === 1 ? 'Mostrando 1 producto' : `Mostrando ${total} productos`;
}

/**
 * Texto del botón que cierra el panel de filtros del móvil, con cuántos productos quedan.
 *
 * @param total - Productos que cumplen la búsqueda y los filtros.
 * @returns "Ver 1 producto" o "Ver N productos".
 */
export function viewResultsLabel(total: number): string {
    return total === 1 ? 'Ver 1 producto' : `Ver ${total} productos`;
}

/**
 * Título y texto de apoyo del estado vacío cuando la búsqueda o los filtros no dejan ningún
 * producto. Con texto en el buscador, el del diseño (Figma: shop-search-no-results), que nombra
 * lo buscado; solo con los selects, uno que habla de los filtros.
 *
 * @param q - Texto del buscador, si lo hay.
 * @returns El título y, solo con búsqueda, el texto de apoyo.
 *
 * @example
 * emptyResultsCopy('Pago de Martinez').title; // 'Sin resultados con: “Pago de Martinez”'
 * emptyResultsCopy(undefined).title; // 'Ningún producto cumple estos filtros'
 */
export function emptyResultsCopy(q: string | undefined): { title: string; description?: string } {
    const text = q?.trim();
    return text
        ? {
              title: `Sin resultados con: “${text}”`,
              description: 'Prueba con otros términos o explora nuestras colecciones',
          }
        : { title: 'Ningún producto cumple estos filtros' };
}
