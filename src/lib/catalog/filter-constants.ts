// Constantes de la búsqueda y los filtros del listado, sin dependencias: las usan tanto el esquema
// de Zod (`validations/catalog.ts`, que las reexporta) como los componentes del navegador, a los que
// no conviene meterles `zod` en el bundle.

/** Tramos de precio del filtro `precio`, de menor a mayor (valores de la URL). */
export const PRICE_RANGES = ['hasta-10', '10-15', '15-25', 'mas-25'] as const;

/**
 * Tramo de precio (`?precio=10-15`). Se mide sobre el precio mínimo de las presentaciones del
 * producto, en euros, con el extremo inferior incluido y el superior excluido para que no haya
 * huecos ni solapes: `hasta-10` es < 10, `10-15` es >= 10 y < 15, `15-25` es >= 15 y < 25 y
 * `mas-25` es >= 25.
 */
export type PriceRange = (typeof PRICE_RANGES)[number];

/** Criterios de orden del listado (`?orden=precio-asc`). El primero es el que se aplica por defecto. */
export const CATALOG_SORTS = ['recientes', 'precio-asc', 'precio-desc', 'nombre'] as const;

/** Criterio de orden: más recientes, precio de menor a mayor o de mayor a menor, y nombre A→Z. */
export type CatalogSort = (typeof CATALOG_SORTS)[number];

/** Orden que se aplica cuando falta `orden` o su valor no es uno de `CATALOG_SORTS`. */
export const DEFAULT_CATALOG_SORT: CatalogSort = CATALOG_SORTS[0];

/** Longitud máxima del texto de `q`: una búsqueda más larga se descarta. */
export const SEARCH_MAX_LENGTH = 100;

/** Añadas que acepta `anada`: fuera de este rango no puede haber un vino y se descarta. */
export const VINTAGE_MIN = 1900;
export const VINTAGE_MAX = 2100;

/** Los filtros que se eligen en un select, en el orden en que se pintan (Figma: WinesFilter). */
export const SELECT_FILTER_KEYS = ['tipologia', 'do', 'bodega', 'uva', 'anada', 'precio'] as const;

/** Un filtro de los selects: su clave en la URL (`?tipologia=`, `?do=`...). */
export type SelectFilterKey = (typeof SELECT_FILTER_KEYS)[number];
