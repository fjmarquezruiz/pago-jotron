import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { ADDRESS_USER_FK, isMissingUserError } from '@/lib/db/errors';
import { createUserAddress, getUserAddresses } from '@/lib/db/queries';
import { createAddressRequestSchema } from '@/lib/validations/address';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Respuesta JSON que ningún navegador ni intermediario guarda: son datos personales de una cuenta. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

const NO_SESSION = { message: 'Inicia sesión para continuar' };

/**
 * Direcciones vigentes del cliente (RF3, RF7). La cuenta es siempre la de la sesión
 * (`getSessionUserId`), nunca un id que mande el navegador. Esta ruta es privada: el middleware
 * ya responde 401 sin sesión, y aquí se vuelve a comprobar.
 *
 * Respuestas: 200 `{ addresses }` (las vigentes, de la más antigua a la más reciente; las
 * sustituidas no salen); 401 sin sesión; 500 error interno.
 */
export async function GET() {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond(NO_SESSION, 401);

        return respond({ addresses: await getUserAddresses(userId) });
    } catch (error) {
        if (isMissingUserError(error, ADDRESS_USER_FK)) return respond(NO_SESSION, 401);
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}

/**
 * Crea una dirección del cliente (RF3, RF7). Para editar una dirección se crea otra con
 * `replaces` (el id de la anterior): la anterior pasa a `is_active = false` en la misma
 * transacción, para que un pedido antiguo no cambie su dirección.
 *
 * Cuerpo: los campos de `addressSchema` y, si edita, `replaces`. Si trae más campos, como un
 * `userId`, se ignoran. Respuestas: 201 `{ address }` con la dirección creada; 400 cuerpo no
 * válido; 401 sin sesión (antes de leer el cuerpo); 404 `replaces` no es una dirección vigente de
 * este cliente (no se crea nada); 500 error interno.
 */
export async function POST(request: Request) {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond(NO_SESSION, 401);

        const body = await request.json().catch(() => undefined);
        if (body === undefined)
            return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);

        const parsed = createAddressRequestSchema.safeParse(body);
        if (!parsed.success) {
            return respond(
                {
                    message: 'Datos de la dirección inválidos',
                    errors: parsed.error.flatten().fieldErrors,
                },
                400,
            );
        }

        const { replaces, ...input } = parsed.data;
        const address = await createUserAddress(userId, input, replaces);
        if (address === null)
            return respond({ message: 'La dirección que quieres sustituir no existe' }, 404);
        return respond({ address }, 201);
    } catch (error) {
        // La sesión es de una cuenta que ya no existe: para las direcciones es como no tener sesión.
        if (isMissingUserError(error, ADDRESS_USER_FK)) return respond(NO_SESSION, 401);
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
