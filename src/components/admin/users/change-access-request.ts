import type { Role } from '@/types/auth';

/** Resultado de pedir un cambio de rol o de estado a `PATCH /api/admin/usuarios/[id]`. */
export type ChangeAccessOutcome =
    | { kind: 'changed'; changed: boolean }
    /** 409: el cambio dejaría la tienda sin ningún administrador activo. */
    | { kind: 'last_admin' }
    /** Rechazo con motivo (404 la cuenta ya no existe, 400 datos no válidos). */
    | { kind: 'rejected'; message: string }
    /** Cualquier otro fallo (sin red, sesión caducada, 500). */
    | { kind: 'error' };

/**
 * Pide a la API de administración que cambie el rol o el estado de una cuenta. Las reglas (incluida
 * la del último administrador) las comprueba el servidor; aquí solo se interpreta la respuesta.
 *
 * @param userId - `users.user_id`.
 * @param change - Rol y/o estado nuevos.
 * @param request - `fetch` (inyectable para las pruebas).
 * @returns El resultado, sin lanzar nunca.
 */
export async function changeAccessRequest(
    userId: number,
    change: { role?: Role; isActive?: boolean },
    request: typeof fetch = fetch,
): Promise<ChangeAccessOutcome> {
    try {
        const response = await request(`/api/admin/usuarios/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(change),
        });
        const body = (await response.json().catch(() => null)) as {
            message?: unknown;
            changed?: unknown;
        } | null;
        if (response.ok) return { kind: 'changed', changed: body?.changed === true };
        if (response.status === 409) return { kind: 'last_admin' };
        if (
            (response.status === 404 || response.status === 400) &&
            typeof body?.message === 'string'
        )
            return { kind: 'rejected', message: body.message };
        return { kind: 'error' };
    } catch {
        return { kind: 'error' };
    }
}
