import {
    PRICE_RANGES,
    SELECT_FILTER_KEYS,
    type PriceRange,
    type SelectFilterKey,
} from '@/lib/catalog/filter-constants';
import { PRICE_RANGE_LABELS } from '@/lib/catalog/filter-labels';
import type { CatalogFilterOptions } from '@/lib/catalog/filter-options';
import type { CatalogFilters } from '@/lib/validations/catalog';

/** Un filtro del listado: el buscador (`q`) o uno de los selects. */
export type FilterKey = 'q' | SelectFilterKey;

/** Una opción de un select tal como la pinta el desplegable: valor de la URL y texto. */
export interface FilterChoice {
    value: string;
    label: string;
}

/**
 * Opciones de un select de filtro. Los ids van como texto porque es lo que maneja un `Select`.
 * Las de precio son fijas (`PRICE_RANGES`); el resto salen de la BD (`getCatalogFilterOptions`).
 *
 * @param key - El filtro.
 * @param options - Opciones de la BD.
 * @returns Las opciones, en el orden recibido.
 */
export function filterChoices(key: SelectFilterKey, options: CatalogFilterOptions): FilterChoice[] {
    if (key === 'precio') {
        return PRICE_RANGES.map((range) => ({ value: range, label: PRICE_RANGE_LABELS[range] }));
    }
    const list = {
        tipologia: options.typologies,
        do: options.origins,
        bodega: options.wineries,
        uva: options.grapes,
        anada: options.vintages,
    }[key];
    return list.map(({ id, name }) => ({ value: String(id), label: name }));
}

/**
 * Valor de un select de filtro como texto, o `undefined` si el filtro no está activo.
 *
 * @example
 * filterValue({ tipologia: 1 }, 'tipologia'); // '1'
 */
export function filterValue(filters: CatalogFilters, key: SelectFilterKey): string | undefined {
    const value = filters[key];
    return value === undefined ? undefined : String(value);
}

/**
 * Los filtros con un filtro cambiado. Un valor que no es válido para ese filtro (un id que no es
 * un entero, un tramo de precio que no existe) lo quita, igual que un valor vacío.
 *
 * @param filters - Filtros actuales.
 * @param key - El filtro que cambia.
 * @param value - Su valor nuevo como texto, o `undefined`/vacío para quitarlo.
 * @returns Filtros nuevos; los recibidos no se modifican.
 *
 * @example
 * setFilter({ tipologia: 1 }, 'bodega', '2'); // { tipologia: 1, bodega: 2 }
 * setFilter({ tipologia: 1 }, 'tipologia', undefined); // {}
 */
export function setFilter(
    filters: CatalogFilters,
    key: FilterKey,
    value: string | undefined,
): CatalogFilters {
    const rest = { ...filters };
    delete rest[key];
    const text = value?.trim();
    if (!text) return rest;
    if (key === 'q') return { ...rest, q: text };
    if (key === 'precio') {
        return (PRICE_RANGES as readonly string[]).includes(text)
            ? { ...rest, precio: text as PriceRange }
            : rest;
    }
    return /^\d+$/.test(text) ? { ...rest, [key]: Number(text) } : rest;
}

/** Un filtro activo, para su chip. */
export interface ActiveFilter {
    key: FilterKey;
    /** Texto del chip: el buscador entre comillas ("Reserva") y, en los selects, el nombre de la opción. */
    label: string;
}

/**
 * Los filtros activos para pintar sus chips: primero el buscador y después los selects, en el
 * orden en que se pintan. Un filtro cuyo valor no está en las opciones no tiene chip.
 *
 * @param filters - Filtros activos (`sanitizeFilters`).
 * @param options - Opciones de la BD, de donde sale el nombre de cada valor.
 * @returns Un elemento por filtro activo.
 *
 * @example
 * activeFilters({ q: 'Reserva', tipologia: 1 }, options);
 * // [{ key: 'q', label: '"Reserva"' }, { key: 'tipologia', label: 'Tinto' }]
 */
export function activeFilters(
    filters: CatalogFilters,
    options: CatalogFilterOptions,
): ActiveFilter[] {
    const active: ActiveFilter[] = [];
    const q = filters.q?.trim();
    if (q) active.push({ key: 'q', label: `"${q}"` });

    for (const key of SELECT_FILTER_KEYS) {
        const value = filterValue(filters, key);
        if (value === undefined) continue;
        const choice = filterChoices(key, options).find((candidate) => candidate.value === value);
        if (choice) active.push({ key, label: choice.label });
    }
    return active;
}

/** Cuántos filtros de los selects hay activos (el buscador no cuenta): el "(n)" de "Filtros (n)". */
export function countSelectFilters(filters: CatalogFilters): number {
    return SELECT_FILTER_KEYS.filter((key) => filters[key] !== undefined).length;
}

/** `true` si hay algún filtro activo, sea el buscador o un select. */
export function hasActiveFilters(filters: CatalogFilters): boolean {
    return !!filters.q?.trim() || countSelectFilters(filters) > 0;
}
