import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import type { Role } from '@/types/auth';

/** Usuario que ha pasado la comprobación de rol. */
export interface AuthorizedUser {
    id: number;
    role: Role;
}

/**
 * Comprueba en el servidor que hay sesión, que la cuenta está activa y que su rol es uno de los
 * permitidos (RNF3). Cada API de administración la llama por su cuenta: el middleware filtra, pero
 * ocultar un enlace o confiar solo en él no protege nada.
 *
 * @param roles - Roles que pueden hacer la acción.
 * @returns `{ user }` si entra, o `{ response }` con el 401 (sin sesión o cuenta desactivada) o el
 * 403 (rol insuficiente), con el mensaje en español, para devolverlo tal cual.
 *
 * @example
 * const auth = await requireRole(['Administrador']);
 * if ('response' in auth) return auth.response;
 * const { user } = auth;
 */
export async function requireRole(
    roles: readonly Role[],
): Promise<{ user: AuthorizedUser } | { response: NextResponse }> {
    const user = await getSessionUser();
    if (user === null)
        return {
            response: NextResponse.json(
                { message: 'Inicia sesión para continuar' },
                { status: 401, headers: { 'Cache-Control': 'no-store' } },
            ),
        };
    if (!roles.includes(user.role))
        return {
            response: NextResponse.json(
                { message: 'No tienes permiso para esta acción' },
                { status: 403, headers: { 'Cache-Control': 'no-store' } },
            ),
        };
    return { user };
}
