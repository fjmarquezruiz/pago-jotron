import type { PriceRange } from '@/lib/validations/catalog';

/** Extremos de un tramo de precio, en euros: `from` incluido y `to` excluido. Sin uno, no hay límite por ese lado. */
export interface PriceBounds {
    from?: number;
    to?: number;
}

/**
 * Extremos de cada tramo de `?precio=` (`PRICE_RANGES`). Cada tramo empieza donde acaba el anterior
 * y el extremo inferior entra en el tramo, así que un precio de 10 € es de `10-15` y uno de
 * 25 € es de `mas-25`: no hay huecos ni solapes. `Record<PriceRange, …>` obliga a definir los
 * extremos de cualquier tramo nuevo.
 */
export const PRICE_RANGE_BOUNDS: Record<PriceRange, PriceBounds> = {
    'hasta-10': { to: 10 },
    '10-15': { from: 10, to: 15 },
    '15-25': { from: 15, to: 25 },
    'mas-25': { from: 25 },
};

/**
 * Extremos de un tramo de precio, para compararlos con el precio mínimo de un producto.
 *
 * @param range - Tramo de `?precio=`.
 * @returns `from` (incluido) y `to` (excluido), o solo uno de los dos en los tramos abiertos.
 *
 * @example
 * priceRangeBounds('10-15'); // { from: 10, to: 15 }
 */
export function priceRangeBounds(range: PriceRange): PriceBounds {
    return PRICE_RANGE_BOUNDS[range];
}
