/** Lo que la regla necesita saber de un producto: su bloqueo y el de su bodega y su D.O. */
export interface ProductVisibilityInput {
    isBlocked: boolean;
    winery: { isBlocked: boolean };
    guaranteeOfOrigin: { isBlocked: boolean };
}

/**
 * Regla de visibilidad del catálogo (RF4): un producto se ve solo si no están bloqueados ni él,
 * ni su bodega, ni su denominación de origen. Basta uno bloqueado para ocultarlo.
 *
 * Sirve para la ficha (`notFound()` si es `false`). El listado aplica la misma regla en SQL con
 * `visibleProductsCondition` (`src/lib/db/queries.ts`): si cambia una, cambia la otra.
 *
 * @param product - El producto con el estado de bloqueo de su bodega y de su D.O.
 * @returns `true` si el catálogo público puede mostrarlo.
 *
 * @example
 * isProductVisible({ isBlocked: false, winery: { isBlocked: true }, guaranteeOfOrigin: { isBlocked: false } });
 * // false: su bodega está bloqueada
 */
export function isProductVisible({
    isBlocked,
    winery,
    guaranteeOfOrigin,
}: ProductVisibilityInput): boolean {
    return !isBlocked && !winery.isBlocked && !guaranteeOfOrigin.isBlocked;
}

/**
 * Si la ficha de un producto se puede mostrar: visible según RF4 (`isProductVisible`) y con al
 * menos una presentación a la venta. Sin presentaciones (todas bloqueadas) no hay nada que
 * vender, así que la ficha se trata como no visible.
 *
 * @param product - El producto con el estado de bloqueo de su bodega y su D.O., y sus presentaciones sin bloquear.
 * @returns `true` si la página puede mostrar la ficha; si no, debe llamar a `notFound()`.
 *
 * @example
 * if (!product || !isProductPageAvailable(product)) notFound();
 */
export function isProductPageAvailable(
    product: ProductVisibilityInput & { variants: readonly unknown[] },
): boolean {
    return isProductVisible(product) && product.variants.length > 0;
}
