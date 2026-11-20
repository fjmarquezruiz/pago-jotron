import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { createOrder, type CreateOrderFailureCode } from '@/lib/orders/create';
import { PaymentError } from '@/lib/payments';
import { checkoutOrderRequestSchema } from '@/lib/validations/checkout';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Respuesta JSON que ningún navegador ni intermediario guarda. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Código HTTP de cada motivo por el que no se pudo crear el pedido. */
const FAILURE_STATUS: Record<CreateOrderFailureCode, number> = {
    method_unavailable: 400,
    empty_cart: 400,
    shipping_not_found: 404,
    address_not_found: 404,
    billing_not_found: 404,
    payment_not_found: 404,
    payment_forbidden: 403,
    stock: 409,
    payment_mismatch: 409,
    payment_failed: 402,
};

/**
 * Crea el pedido del carrito del cliente (RF7). Todo sale del servidor (ver `createOrder`): el
 * carrito guardado, los precios, el envío y, con tarjeta, el importe y la huella autorizados en
 * `/api/checkout/pago`. Con tarjeta confirma primero la transacción que descuenta el stock y crea
 * el pedido y DESPUÉS cobra (captura); si el cobro falla, una transacción de compensación devuelve
 * el stock y anula el pedido. Con transferencia (apagada salvo `BANK_TRANSFER_ENABLED=true`, es de
 * MVP2) deja el pedido 'Pendiente de pago' con el stock reservado.
 *
 * Cuerpo: `{ paymentMethod: 'Tarjeta' | 'Transferencia', shippingTypeId, shippingAddressId,
 * billingAddressId?, paymentIntentId? }` (`paymentIntentId` obligatorio con tarjeta y prohibido
 * con transferencia). Respuestas: 201 `{ orderId, orderNumber, status, paymentMethod }`; 200 lo
 * mismo si ya existía un pedido de ese pago (reintento idempotente); 400 cuerpo no válido o
 * carrito vacío o transferencia no disponible; 401 sin sesión (antes de leer el cuerpo); 402 no se
 * pudo cobrar (pedido anulado y stock devuelto, sin cargo); 403 el pago es de otra cuenta; 404 envío, dirección o pago inexistentes; 409 falta
 * stock (`{ problems }`) o la autorización no coincide con el carrito (en ambos casos con tarjeta
 * se cancela la reserva antes de responder); 502 la pasarela falla; 500 error interno.
 */
export async function POST(request: Request) {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond({ message: 'Inicia sesión para continuar' }, 401);

        const body = await request.json().catch(() => undefined);
        if (body === undefined)
            return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);

        const parsed = checkoutOrderRequestSchema.safeParse(body);
        if (!parsed.success) {
            return respond(
                {
                    message: 'Datos del pedido inválidos',
                    errors: parsed.error.flatten().fieldErrors,
                },
                400,
            );
        }

        const result = await createOrder(userId, parsed.data);
        if (!result.ok) {
            return respond(
                { message: result.message, ...(result.problems && { problems: result.problems }) },
                FAILURE_STATUS[result.code],
            );
        }
        return respond(result.order, result.created ? 201 : 200);
    } catch (error) {
        if (error instanceof PaymentError) {
            console.error(error, error.cause);
            return respond(
                { message: 'No se ha podido comprobar el pago. Inténtalo de nuevo.' },
                502,
            );
        }
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
