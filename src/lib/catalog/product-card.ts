import { formatEuros } from '@/lib/utils';

/** Badge que lleva una tarjeta de producto: agotado, nuevo o ninguno. */
export type ProductCardBadge = 'sold-out' | 'new' | null;

/**
 * Qué badge pinta la tarjeta. Solo lleva uno, en el mismo hueco: "Agotado" gana a "¡NUEVO!",
 * porque un producto que no se puede comprar no debe presumir de novedad.
 *
 * @param product.totalStock - Stock sumado de todas las presentaciones; 0 = agotado.
 * @param product.isNew - Si el producto es nuevo (`isNewCondition` en `queries.ts`).
 * @returns `'sold-out'`, `'new'` o `null` si no lleva badge.
 *
 * @example
 * productCardBadge({ totalStock: 0, isNew: true }); // 'sold-out'
 */
export function productCardBadge(product: {
    totalStock: number;
    isNew: boolean;
}): ProductCardBadge {
    if (product.totalStock === 0) return 'sold-out';
    return product.isNew ? 'new' : null;
}

/**
 * Texto del precio de la tarjeta: el precio más bajo del producto. Con más de una presentación
 * lleva "Desde" delante, porque ese precio no es el de todas.
 *
 * @param minPrice - Precio más bajo entre sus presentaciones, como el texto con el que Drizzle devuelve un `decimal`.
 * @param variantCount - Número de presentaciones a la venta.
 * @returns El precio formateado, con o sin el prefijo.
 * @throws Si `minPrice` no es un número (lo comprueba `formatEuros`).
 *
 * @example
 * productCardPrice('7.50', 2); // 'Desde 7,50 €'
 */
export function productCardPrice(minPrice: string, variantCount: number): string {
    const price = formatEuros(minPrice);
    return variantCount > 1 ? `Desde ${price}` : price;
}
