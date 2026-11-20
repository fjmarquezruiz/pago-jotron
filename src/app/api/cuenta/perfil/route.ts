import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { isDuplicateEntryError } from '@/lib/db/errors';
import { getUserProfile, updateUserProfile } from '@/lib/db/queries';
import { profileSchema } from '@/lib/validations/profile';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Respuesta JSON que ningún navegador ni intermediario guarda: son datos personales de una cuenta. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

const NO_SESSION = { message: 'Inicia sesión para continuar' };

/**
 * Perfil de contacto del cliente (RF3): nombre, apellidos, correo, teléfono y NIF de la cuenta de
 * la sesión (`getSessionUserId`), nunca un id que mande el navegador. Lo que no se ha rellenado
 * sale como `null`. Ruta privada: el middleware ya responde 401 sin sesión, y aquí se vuelve a
 * comprobar.
 *
 * Respuestas: 200 `{ profile: { name, lastName, email, phone, idCard } }`; 401 sin sesión o con
 * una sesión de una cuenta que ya no existe; 500 error interno.
 */
export async function GET() {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond(NO_SESSION, 401);

        const profile = await getUserProfile(userId);
        if (profile === null) return respond(NO_SESSION, 401);
        return respond({ profile });
    } catch (error) {
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}

/**
 * Actualiza los datos de contacto del cliente (RF3).
 *
 * Cuerpo: `{ name, lastName, phone, idCard? }` (ver `profileSchema`). El NIF vacío o ausente borra
 * el que hubiera. El correo no se puede cambiar: si llega, se ignora, igual que cualquier otro
 * campo. Respuestas: 200 `{ profile }` con el perfil guardado; 400 cuerpo no válido; 401 sin
 * sesión (antes de leer el cuerpo); 409 el NIF ya lo usa otra cuenta; 500 error interno.
 */
export async function PATCH(request: Request) {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond(NO_SESSION, 401);

        const body = await request.json().catch(() => undefined);
        if (body === undefined)
            return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);

        const parsed = profileSchema.safeParse(body);
        if (!parsed.success) {
            return respond(
                {
                    message: 'Datos del perfil inválidos',
                    errors: parsed.error.flatten().fieldErrors,
                },
                400,
            );
        }

        const profile = await updateUserProfile(userId, parsed.data);
        if (profile === null) return respond(NO_SESSION, 401);
        return respond({ profile });
    } catch (error) {
        if (isDuplicateEntryError(error, 'id_card'))
            return respond({ message: 'Ese NIF ya está registrado en otra cuenta' }, 409);
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
