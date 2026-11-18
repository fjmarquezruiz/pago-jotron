/**
 * Pone las filas que devuelve la BD en el orden del carrito. La BD no garantiza ningún orden y
 * puede no devolver algunas presentaciones (bloqueadas o borradas): se omiten sin más. Los ids
 * repetidos dan una sola fila.
 *
 * @param variantIds - Ids de presentaciones en el orden del carrito.
 * @param rows - Filas con su `variantId`, en cualquier orden.
 * @returns Las filas cuyo id está en `variantIds`, en ese orden y sin repetir.
 *
 * @example
 * orderLinesByVariantIds([7, 4, 9], [{ variantId: 4 }, { variantId: 7 }]);
 * // [{ variantId: 7 }, { variantId: 4 }]: la 9 no volvió
 */
export function orderLinesByVariantIds<T extends { variantId: number }>(
    variantIds: readonly number[],
    rows: readonly T[],
): T[] {
    const byId = new Map(rows.map((row) => [row.variantId, row]));
    return Array.from(new Set(variantIds)).flatMap((id) => byId.get(id) ?? []);
}
