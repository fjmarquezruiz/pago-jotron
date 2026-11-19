import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { isMissingUserError } from '@/lib/db/errors';
import { normalizeCart } from '@/lib/cart/server';
import { getUserCart, saveUserCart } from '@/lib/db/queries';
import { cartItemsRequestSchema } from '@/lib/validations/cart';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Respuesta JSON que ningún navegador ni intermediario guarda: el carrito es de una cuenta y cambia. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Carrito guardado del cliente en la cuenta (RF6): se recupera en cualquier dispositivo. La cuenta
 * es siempre la de la sesión (`getSessionUserId`), nunca un id que mande el navegador. Aunque
 * `/api/carrito` es una ruta pública en el middleware (la usa también el invitado), esta
 * comprueba la sesión por su cuenta.
 *
 * Respuestas: 200 `{ userId, items }` con las líneas guardadas, tal cual están en la BD (sin
 * normalizar: el stock y el precio se piden aparte, a `/api/carrito/lineas`); 500 error interno.
 *
 * Sin sesión responde 200 `{ userId: null, items: [] }`, no 401: es la comprobación que hace cada
 * visitante anónimo en cada página, y un 4xx llenaría de errores la consola del navegador y las
 * métricas. Las que escriben (`PUT`, `POST /fusionar`) sí dan 401.
 */
export async function GET() {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond({ userId: null, items: [] });

        const items = await getUserCart(userId);
        return respond({ userId, items });
    } catch (error) {
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}

/**
 * Guarda el carrito del cliente en su cuenta (RF6): REEMPLAZA el que había. El servidor sanea lo
 * que llega (`normalizeCart`): quita lo que ya no se puede comprar y limita cada cantidad al
 * stock, y guarda y devuelve el resultado, que el navegador debe adoptar.
 *
 * Cuerpo: `{ items: { variantId, quantity }[] }` (como mucho `CART_MAX_LINES`, sin presentaciones
 * repetidas; puede ir vacío para vaciar el carrito). Si trae más campos, como un `userId`, se
 * ignoran. Respuestas: 200 `{ items }` con lo guardado; 400 cuerpo no válido; 401 sin sesión
 * (antes de leer el cuerpo); 500 error interno.
 */
export async function PUT(request: Request) {
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

        const saved = await normalizeCart(parsed.data.items);
        await saveUserCart(userId, saved);
        return respond({ items: saved });
    } catch (error) {
        // La sesión es de una cuenta que ya no existe: para el carrito es como no tener sesión.
        if (isMissingUserError(error))
            return respond({ message: 'Inicia sesión para continuar' }, 401);
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
