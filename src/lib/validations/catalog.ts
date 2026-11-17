import { z } from 'zod';

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

/** El `int` de MySQL más alto: un id mayor no puede existir en las tablas. */
const MAX_ID = 2_147_483_647;

/**
 * Un filtro opcional: si el valor no pasa `schema` (o hay varios, `?uva=1&uva=2`) no da error,
 * simplemente no filtra. Así una URL manipulada o caducada nunca rompe la página.
 */
function optionalParam<T extends z.ZodType>(schema: T) {
    return schema.optional().catch(undefined);
}

/**
 * Id de una fila (`?bodega=2`): solo dígitos, entero entre 1 y el máximo de un `int` de MySQL.
 * Rechaza `0`, `-1`, `1.5`, `1e3`, `0x10`, ` 2`, vacío o texto, que `z.coerce.number()` aceptaría
 * o convertiría en otro número.
 */
const idSchema = z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(MAX_ID));

/** Añada (`?anada=2023`): cuatro dígitos dentro de `VINTAGE_MIN`..`VINTAGE_MAX`. */
const vintageSchema = z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number)
    .pipe(z.number().int().min(VINTAGE_MIN).max(VINTAGE_MAX));

/**
 * Parámetros de la URL del listado (`/productos?page=2&tipologia=1&orden=precio-asc`). Ninguno
 * da error: lo que no sea válido se corrige (`page` y `orden` toman su valor por defecto) o se
 * ignora (los filtros quedan en `undefined`, es decir, no filtran). Lo desconocido se descarta.
 *
 * - `page`: entero >= 1 (por defecto, 1).
 * - `q`: texto de búsqueda, sin espacios en los extremos, de 1 a `SEARCH_MAX_LENGTH` caracteres.
 * - `do`: id de la denominación de origen (`guarantees_of_origin`).
 * - `bodega`: id de la bodega (`wineries`).
 * - `uva`: id de la uva (`grapes`); filtra por las uvas de la elaboración del producto.
 * - `tipologia`: id de la tipología (`typologies`).
 * - `precio`: uno de `PRICE_RANGES`.
 * - `anada`: año de la añada (`products.vintage`).
 * - `orden`: uno de `CATALOG_SORTS` (por defecto, `recientes`).
 *
 * Cada filtro admite un solo valor: si se repite (`?uva=1&uva=2`) no se aplica ninguno.
 * Los ids solo se comprueban en su forma; que la bodega o la uva existan lo decide la consulta
 * (un id sin filas devuelve un listado vacío).
 *
 * @example
 * catalogSearchParamsSchema.parse({ tipologia: '1', precio: '10-15', orden: 'x' });
 * // { page: 1, tipologia: 1, precio: '10-15', orden: 'recientes' }
 */
export const catalogSearchParamsSchema = z.object({
    page: z.coerce.number().int().min(1).catch(1),
    q: optionalParam(z.string().trim().min(1).max(SEARCH_MAX_LENGTH)),
    do: optionalParam(idSchema),
    bodega: optionalParam(idSchema),
    uva: optionalParam(idSchema),
    tipologia: optionalParam(idSchema),
    precio: optionalParam(z.enum(PRICE_RANGES)),
    anada: optionalParam(vintageSchema),
    orden: z.enum(CATALOG_SORTS).catch(DEFAULT_CATALOG_SORT),
});

/** Parámetros del listado ya validados. */
export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>;

/** Los filtros del listado: los parámetros que reducen el conjunto de productos, sin `page` ni `orden`. */
export type CatalogFilters = Omit<CatalogSearchParams, 'page' | 'orden'>;
