/** Clave foránea de `cart_products.user_id` hacia `users`. */
const CART_USER_FK = 'fk_cartproduct_user';
/** Clave foránea de `addresses.user_id` hacia `users`. */
export const ADDRESS_USER_FK = 'addresses_user_id_users_user_id_fk';

/**
 * Indica si un error de la BD es que el usuario del carrito ya no existe: la clave foránea
 * `fk_cartproduct_user` de `cart_products` rechaza la fila (MySQL 1452, `ER_NO_REFERENCED_ROW_2`).
 * Pasa con una sesión (JWT) de una cuenta que se borró o con una BD restaurada o rellenada de nuevo.
 *
 * La otra clave foránea de la tabla (`fk_cartproduct_variant`, una presentación que desaparece
 * entre el saneado y el guardado) da el mismo código: se distingue por el nombre de la restricción.
 * Drizzle envuelve el error del driver, así que se mira también su `cause`.
 *
 * Otras tablas con usuario usan el mismo código con su propia restricción (por ejemplo
 * `addresses_user_id_users_user_id_fk`): se pasa en `constraint`.
 *
 * @param error - Lo capturado en un `catch`.
 * @param constraint - Nombre de la clave foránea hacia `users`; por defecto la del carrito.
 * @returns `true` si falló esa clave foránea.
 *
 * @example
 * try { await saveUserCart(userId, items); } catch (error) { if (isMissingUserError(error)) ... }
 * isMissingUserError(error, ADDRESS_USER_FK);
 */
export function isMissingUserError(error: unknown, constraint = CART_USER_FK): boolean {
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
        if (isForeignKey && text.includes(constraint)) return true;
        current = cause;
    }
    return false;
}

/**
 * Indica si un error de la BD es una clave duplicada (MySQL 1062, `ER_DUP_ENTRY`): una restricción
 * `unique` rechaza la fila. Se usa con `users.id_card` (el NIF ya es de otra cuenta) y con
 * `orders.payment_intent_id` (el pedido de ese pago ya existe).
 *
 * Si se pasa `key`, solo cuenta el duplicado de ese índice: MySQL nombra la clave al final del
 * mensaje (`Duplicate entry 'x' for key 'users.id_card'`). Drizzle envuelve el error del driver,
 * así que se mira también su `cause`.
 *
 * @param error - Lo capturado en un `catch`.
 * @param key - Texto que debe aparecer en el mensaje (nombre del índice o de la columna); opcional.
 * @returns `true` si es una clave duplicada (de `key`, si se indica).
 *
 * @example
 * try { await updateUserProfile(userId, input); } catch (error) { if (isDuplicateEntryError(error, 'id_card')) ... }
 */
export function isDuplicateEntryError(error: unknown, key?: string): boolean {
    for (let current = error, depth = 0; current && depth < 3; depth += 1) {
        const { code, errno, sqlMessage, message, cause } = current as {
            code?: unknown;
            errno?: unknown;
            sqlMessage?: unknown;
            message?: unknown;
            cause?: unknown;
        };
        const isDuplicate = code === 'ER_DUP_ENTRY' || errno === 1062;
        const text = `${typeof sqlMessage === 'string' ? sqlMessage : ''} ${typeof message === 'string' ? message : ''}`;
        if (isDuplicate && (key === undefined || text.includes(key))) return true;
        current = cause;
    }
    return false;
}
