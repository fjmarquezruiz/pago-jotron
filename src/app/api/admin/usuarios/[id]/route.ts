import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { changeUserAccess } from '@/lib/users/change-access';
import { accessChangeSchema } from '@/lib/validations/admin-users';
import { MAX_ID } from '@/lib/validations/ids';
import type { Role } from '@/types/auth';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Respuesta JSON que ningún navegador ni intermediario guarda. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Administración cambia el rol o activa/desactiva una cuenta (CU12, RF12). Solo `Administrador`;
 * se comprueba aquí, en el servidor, además de en el middleware.
 *
 * Cuerpo: `{ role?, isActive? }` (al menos uno). Nunca deja la tienda sin un administrador activo:
 * degradar o desactivar al último, a otro o a uno mismo, responde 409. Cada cambio queda en
 * `audit_logs` en la misma transacción. Es efectivo ya: las páginas y las API leen el rol y el
 * estado de la BD en cada petición, no del token.
 *
 * Respuestas: 200 `{ changed }`; 400 id o cuerpo no válidos; 401 sin sesión; 403 sin el rol; 404 no
 * existe; 409 dejaría la tienda sin administrador; 500 error interno.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await requireRole(['Administrador']);
        if ('response' in auth) return auth.response;
        const { user } = auth;

        const targetId = /^\d+$/.test(params.id) ? Number(params.id) : NaN;
        if (!Number.isSafeInteger(targetId) || targetId < 1 || targetId > MAX_ID)
            return respond({ message: 'El identificador del usuario no es válido' }, 400);

        const body = await request.json().catch(() => undefined);
        if (body === undefined)
            return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);
        const parsed = accessChangeSchema.safeParse(body);
        if (!parsed.success)
            return respond(
                { message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
                400,
            );

        const result = await changeUserAccess(user.id, targetId, {
            role: parsed.data.role as Role | undefined,
            isActive: parsed.data.isActive,
        });
        if (!result.ok)
            return respond({ message: result.message }, result.code === 'not_found' ? 404 : 409);
        return respond({ changed: result.changed });
    } catch (error) {
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
