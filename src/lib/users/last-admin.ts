/**
 * Regla del último administrador (RF12, RNF6). Función pura: no toca la BD. Siempre debe quedar al
 * menos una cuenta con rol Administrador Y activa; si no, nadie podría volver a gestionar la tienda.
 * Cubre las tres formas de perderla: degradar a otro, desactivar a otro y hacerlo sobre uno mismo.
 */
import type { Role } from '@/types/auth';

/** La cuenta que se quiere cambiar, tal como está ahora en la BD. */
export interface AccessTarget {
    id: number;
    role: Role;
    isActive: boolean;
}

/** Lo que se quiere cambiar de la cuenta; lo que no se pone se queda como está. */
export interface AccessChange {
    role?: Role;
    isActive?: boolean;
}

/**
 * Indica si el cambio dejaría la tienda sin ningún administrador activo.
 *
 * @param input.activeAdminIds - Ids de TODAS las cuentas que ahora son Administrador y están activas
 * (la transacción las lee con `SELECT … FOR UPDATE`, para que dos cambios a la vez no se pisen).
 * @param input.target - La cuenta que se cambia.
 * @param input.change - El cambio pedido.
 * @returns `true` si tras el cambio no quedaría ninguno.
 *
 * @example
 * leavesNoAdmin({
 *     activeAdminIds: [1],
 *     target: { id: 1, role: 'Administrador', isActive: true },
 *     change: { role: 'Editor' },
 * }); // true: es el único
 */
export function leavesNoAdmin({
    activeAdminIds,
    target,
    change,
}: {
    activeAdminIds: readonly number[];
    target: AccessTarget;
    change: AccessChange;
}): boolean {
    const others = activeAdminIds.filter((id) => id !== target.id).length;
    const role = change.role ?? target.role;
    const isActive = change.isActive ?? target.isActive;
    const staysAdmin = role === 'Administrador' && isActive;
    return others + (staysAdmin ? 1 : 0) === 0;
}
