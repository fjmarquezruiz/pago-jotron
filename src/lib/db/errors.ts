/**
 * Indica si un error de la BD es que el usuario del carrito ya no existe: la clave foránea
 * `fk_cartproduct_user` de `cart_products` rechaza la fila (MySQL 1452, `ER_NO_REFERENCED_ROW_2`).
 * Pasa con una sesión (JWT) de una cuenta que se borró o con una BD restaurada o rellenada de nuevo.
 *
 * La otra clave foránea de la tabla (`fk_cartproduct_variant`, una presentación que desaparece
 * entre el saneado y el guardado) da el mismo código: se distingue por el nombre de la restricción.
 * Drizzle envuelve el error del driver, así que se mira también su `cause`.
 *
 * @param error - Lo capturado en un `catch`.
 * @returns `true` si falló `fk_cartproduct_user`.
 *
 * @example
 * try { await saveUserCart(userId, items); } catch (error) { if (isMissingUserError(error)) ... }
 */
export function isMissingUserError(error: unknown): boolean {
    for (let current = error, depth = 0; current && depth < 3; depth += 1) {
        const { code, errno, sqlMessage, message, cause } = current as {
            code?: unknown;
            errno?: unknown;
            sqlMessage?: unknown;
            message?: unknown;
            cause?: unknown;
        };
        const isForeignKey = code === 'ER_NO_REFERENCED_ROW_2' || errno === 1452;
        const text = `${typeof sqlMessage === 'string' ? sqlMessage : ''} ${typeof message === 'string' ? message : ''}`;
        if (isForeignKey && text.includes('fk_cartproduct_user')) return true;
        current = cause;
    }
    return false;
}
