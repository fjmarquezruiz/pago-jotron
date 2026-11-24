import { db } from '@/db';
import { insertAuditLogQuery } from '@/lib/db/queries';
import { lockActiveAdminIds, lockUserAccess, updateUserAccess } from '@/lib/db/admin-users';
import { userNumber } from '@/lib/admin/users';
import { leavesNoAdmin, type AccessChange } from './last-admin';

export type ChangeAccessFailureCode = 'not_found' | 'last_admin';

export type ChangeAccessResult =
    { ok: true; changed: boolean } | { ok: false; code: ChangeAccessFailureCode; message: string };

const fail = (code: ChangeAccessFailureCode, message: string): ChangeAccessResult => ({
    ok: false,
    code,
    message,
});

/** Texto del asiento de auditoría: "rol Cliente → Editor", "desactivada", "reactivada". */
function describe(before: { role: string; isActive: boolean }, change: AccessChange): string[] {
    const parts: string[] = [];
    if (change.role !== undefined && change.role !== before.role)
        parts.push(`rol ${before.role} → ${change.role}`);
    if (change.isActive !== undefined && change.isActive !== before.isActive)
        parts.push(change.isActive ? 'reactivada' : 'desactivada');
    return parts;
}

/**
 * Cambia el rol o activa/desactiva una cuenta (CU12, RF12). Solo la llama una ruta que ya exigió el
 * rol Administrador.
 *
 * Todo en UNA transacción: se bloquean (`SELECT … FOR UPDATE`) los administradores activos y la
 * cuenta, se rechaza (`last_admin`) el cambio que dejaría la tienda sin ninguno (degradar,
 * desactivar a otro o a uno mismo, ver `leavesNoAdmin`), se aplica y se anota en `audit_logs`. Un
 * cambio que no cambia nada responde `ok` con `changed: false` y no deja asiento.
 *
 * @param actorId - Cuenta del administrador que lo pide (la de la sesión).
 * @param targetId - Cuenta que se cambia.
 * @param change - Rol y/o estado nuevos.
 * @returns El resultado, sin lanzar por reglas de negocio.
 * @throws Errores inesperados de la BD (la ruta responde 500).
 */
export async function changeUserAccess(
    actorId: number,
    targetId: number,
    change: AccessChange,
): Promise<ChangeAccessResult> {
    return db.transaction(async (tx) => {
        // Siempre en este orden (administradores y luego la cuenta) para que dos cambios no se bloqueen entre sí.
        const activeAdminIds = await lockActiveAdminIds(tx);
        const target = await lockUserAccess(tx, targetId);
        if (target === null) return fail('not_found', 'El usuario no existe');

        const parts = describe(target, change);
        if (parts.length === 0) return { ok: true, changed: false } as const;

        if (leavesNoAdmin({ activeAdminIds, target, change }))
            return fail('last_admin', 'Siempre debe quedar al menos un administrador');

        await updateUserAccess(tx, targetId, {
            ...(change.role !== undefined && { role: change.role }),
            ...(change.isActive !== undefined && { isActive: change.isActive }),
        });
        await insertAuditLogQuery(tx, {
            userId: actorId,
            action: `Usuario ${userNumber(targetId)}: ${parts.join(', ')}`,
            details: `cuenta ${targetId}; lo cambia Administrador (cuenta ${actorId})${
                targetId === actorId ? ' sobre su propia cuenta' : ''
            }`,
        });
        return { ok: true, changed: true } as const;
    });
}
