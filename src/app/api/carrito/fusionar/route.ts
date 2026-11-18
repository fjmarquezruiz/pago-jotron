import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { isMissingUserError } from '@/lib/db/errors';
import { mergeWithSaved } from '@/lib/cart/server';
import { saveUserCart } from '@/lib/db/queries';
import { cartItemsRequestSchema } from '@/lib/validations/cart';

/** Respuesta JSON que ningún navegador ni intermediario guarda: el carrito es de una cuenta y cambia. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Une el carrito anónimo del navegador con el que el cliente ya tiene guardado en su cuenta (RF6),
 * al iniciar sesión (`mergeWithSaved`): por cada presentación gana la mayor cantidad, no la suma,
 * así que repetir la petición con el mismo carrito no cambia nada. Guarda el resultado
 * (`saveUserCart`) y lo devuelve, para que el navegador lo adopte. La cuenta es siempre la de la
 * sesión (`getSessionUserId`), nunca un id que mande el navegador.
 *
 * Cuerpo: `{ items: { variantId, quantity }[] }`, el carrito del navegador (como mucho
 * `CART_MAX_LINES`, sin presentaciones repetidas; puede ir vacío). Si trae más campos, como un
 * `userId`, se ignoran. Respuestas: 200 `{ items }` con el carrito unido y guardado; 400 cuerpo
 * no válido; 401 sin sesión (antes de leer el cuerpo); 500 error interno.
 */
export async function POST(request: Request) {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond({ message: 'Inicia sesión para continuar' }, 401);

        const body = await request.json().catch(() => undefined);
        if (body === undefined)
            return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);

        const parsed = cartItemsRequestSchema.safeParse(body);
        if (!parsed.success) {
            return respond(
                {
                    message: 'Datos del carrito inválidos',
                    errors: parsed.error.flatten().fieldErrors,
                },
                400,
            );
        }

        const merged = await mergeWithSaved(userId, parsed.data.items);
        await saveUserCart(userId, merged);
        return respond({ items: merged });
    } catch (error) {
        // La sesión es de una cuenta que ya no existe: para el carrito es como no tener sesión.
        if (isMissingUserError(error))
            return respond({ message: 'Inicia sesión para continuar' }, 401);
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
