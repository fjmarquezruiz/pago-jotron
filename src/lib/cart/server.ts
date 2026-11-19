/**
 * Lógica del carrito guardado (RF6) que comparten las rutas `PUT /api/carrito` y
 * `POST /api/carrito/fusionar`. Aquí solo se lee de la BD (stock actual y carrito guardado):
 * guardar (`saveUserCart`) es cosa de cada ruta.
 */

import { mergeCarts, type Cart } from '@/lib/cart/cart';
import { getCartLines, getUserCart } from '@/lib/db/queries';

/**
 * Stock actual de unas presentaciones (`variantId` → unidades), de `getCartLines`. Solo salen las
 * que se pueden comprar: bloqueadas o borradas no aparecen, y `mergeCarts` las descarta. Sin ids,
 * no consulta la BD.
 */
async function stockByVariant(variantIds: readonly number[]): Promise<Map<number, number>> {
    if (variantIds.length === 0) return new Map();
    const lines = await getCartLines(variantIds);
    return new Map(lines.map((line) => [line.variantId, line.stock]));
}

/**
 * Sanea un carrito antes de guardarlo: quita lo que no se puede comprar (presentaciones
 * bloqueadas, borradas o de un producto, bodega o D.O. bloqueados, y las agotadas), limita cada
 * cantidad al stock de ahora y deja las líneas en el mismo orden. Con el carrito vacío no consulta
 * la BD. Así `cart_products` nunca guarda un id que la clave foránea rechace ni más unidades que
 * el stock (que aun así puede bajar después: el carrito se vuelve a limitar al enseñarlo).
 *
 * @param items - El carrito que manda el cliente, ya validado (`cartSchema`).
 * @returns El carrito saneado; el propio `items` si no cambia nada.
 *
 * @example
 * await normalizeCart([{ variantId: 4, quantity: 9 }, { variantId: 7, quantity: 1 }]);
 * // [{ variantId: 4, quantity: 6 }]: la 4 solo tiene 6 de stock y la 7 está bloqueada
 */
export async function normalizeCart(items: Cart): Promise<Cart> {
    const stock = await stockByVariant(items.map(({ variantId }) => variantId));
    return mergeCarts(items, [], stock);
}

/**
 * Une el carrito anónimo del navegador con el que el usuario ya tiene guardado, al iniciar
 * sesión. Por cada presentación se queda con la MAYOR de las dos cantidades (no la suma), así que
 * repetir la fusión con el mismo carrito no cambia nada. Después limita cada línea al stock de
 * ahora y descarta lo que no se puede comprar. Las líneas guardadas van primero (son más
 * antiguas) y, detrás, las nuevas del navegador; con más de `CART_MAX_LINES` se quedan las
 * primeras.
 *
 * No guarda el resultado: eso lo hace la ruta con `saveUserCart`.
 *
 * @param userId - Id del usuario, el de la sesión (`getSessionUserId`).
 * @param local - El carrito anónimo del navegador, ya validado (`cartSchema`).
 * @returns El carrito unido y saneado.
 *
 * @example
 * // guardado: [{ variantId: 4, quantity: 2 }]; navegador: [{ variantId: 4, quantity: 3 }, { variantId: 9, quantity: 1 }]
 * await mergeWithSaved(12, local);
 * // [{ variantId: 4, quantity: 3 }, { variantId: 9, quantity: 1 }]
 */
export async function mergeWithSaved(userId: number, local: Cart): Promise<Cart> {
    const saved = await getUserCart(userId);
    const stock = await stockByVariant(
        Array.from(new Set([...saved, ...local].map(({ variantId }) => variantId))),
    );
    return mergeCarts(saved, local, stock);
}
