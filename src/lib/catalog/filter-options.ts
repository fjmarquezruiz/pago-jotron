import type { CatalogFilters } from '@/lib/validations/catalog';

/** Una opción de un select de filtro: el valor que va a la URL (`id`) y lo que se lee (`name`). */
export interface FilterOption {
    id: number;
    name: string;
}

/** Las opciones de los selects del listado, cada lista con sus valores ya ordenados. */
export interface CatalogFilterOptions {
    /** Denominaciones de origen (`?do=`), por nombre. */
    origins: FilterOption[];
    /** Bodegas (`?bodega=`), por nombre. */
    wineries: FilterOption[];
    /** Uvas (`?uva=`), por nombre. */
    grapes: FilterOption[];
    /** Tipologías (`?tipologia=`), en el orden pensado para el filtro (`filter_order`). */
    typologies: FilterOption[];
    /** Añadas (`?anada=`): `id` es el año y `name` el año como texto; la más reciente primero. */
    vintages: FilterOption[];
}

/**
 * Opciones del select de añadas a partir de los años de los productos: el año es a la vez el valor
 * de la URL (`?anada=2023`) y el texto. Los productos sin añada (vinos sin cosecha, pasas) no son
 * una opción. Conserva el orden de entrada y no repite años.
 *
 * @param years - Años de `products.vintage`, con `null` para los que no tienen.
 * @returns Una opción por año distinto, en el orden recibido.
 *
 * @example
 * toVintageOptions([2025, null, 2023]); // [{ id: 2025, name: '2025' }, { id: 2023, name: '2023' }]
 */
export function toVintageOptions(years: readonly (number | null)[]): FilterOption[] {
    const seen = new Set<number>();
    const options: FilterOption[] = [];
    for (const year of years) {
        if (year === null || seen.has(year)) continue;
        seen.add(year);
        options.push({ id: year, name: String(year) });
    }
    return options;
}

/** `id` si es el de alguna opción de la lista; si no, `undefined`. */
function knownId(id: number | undefined, options: readonly FilterOption[]): number | undefined {
    return id !== undefined && options.some((option) => option.id === id) ? id : undefined;
}

/**
 * Deja solo los filtros de la URL que se pueden elegir: un id que no está en las opciones (una
 * bodega que no existe, una D.O. bloqueada o sin productos, una URL vieja o manipulada) se
 * descarta, en vez de filtrar por algo que el listado ni deja quitar desde los selects. `q` y
 * `precio` ya vienen validados por el esquema y pasan tal cual.
 *
 * @param filters - Filtros ya validados (`catalogSearchParamsSchema`).
 * @param options - Opciones de los selects (`getCatalogFilterOptions`).
 * @returns Los mismos filtros sin los ids desconocidos.
 *
 * @example
 * sanitizeFilters({ bodega: 999, tipologia: 1 }, options); // { tipologia: 1 }
 */
export function sanitizeFilters(
    filters: CatalogFilters,
    options: CatalogFilterOptions,
): CatalogFilters {
    return {
        q: filters.q,
        do: knownId(filters.do, options.origins),
        bodega: knownId(filters.bodega, options.wineries),
        uva: knownId(filters.uva, options.grapes),
        tipologia: knownId(filters.tipologia, options.typologies),
        precio: filters.precio,
        anada: knownId(filters.anada, options.vintages),
    };
}
