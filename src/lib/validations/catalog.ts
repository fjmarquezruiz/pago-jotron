import { z } from 'zod';

import {
    CATALOG_SORTS,
    DEFAULT_CATALOG_SORT,
    PRICE_RANGES,
    SEARCH_MAX_LENGTH,
    VINTAGE_MAX,
    VINTAGE_MIN,
} from '@/lib/catalog/filter-constants';
import { MAX_ID } from '@/lib/validations/ids';

// Los valores y tipos de los filtros viven en `filter-constants.ts`; se reexportan para que quien
// valida la URL los tenga junto al esquema.
export {
    CATALOG_SORTS,
    DEFAULT_CATALOG_SORT,
    PRICE_RANGES,
    SEARCH_MAX_LENGTH,
    VINTAGE_MAX,
    VINTAGE_MIN,
};
export type { CatalogSort, PriceRange } from '@/lib/catalog/filter-constants';

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
