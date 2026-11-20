import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { getCartLines, getShippingTypeById, getUserAddress, getUserCart } from '@/lib/db/queries';
import { cartFingerprint } from '@/lib/orders/fingerprint';
import { quoteOrder } from '@/lib/orders/quote';
import { findStockProblems } from '@/lib/orders/stock';
import { createAuthorization, MIN_AMOUNT_CENTS, PaymentError } from '@/lib/payments';
import { checkoutPaymentRequestSchema } from '@/lib/validations/checkout';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Respuesta JSON que ningún navegador ni intermediario guarda: lleva el secreto de un pago. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Autoriza el pago del carrito del cliente (RF7): reserva el importe en su tarjeta sin cobrarlo.
 * Todo se calcula aquí, con lo que dice la BD: lee el carrito guardado de la cuenta de la sesión,
 * comprueba que hay stock de cada línea, vuelve a calcular el presupuesto (`quoteOrder`) con el
 * precio, el IVA y el coste de envío de ahora, y crea un PaymentIntent de captura manual con ese
 * importe y la huella del carrito. El navegador solo dice el envío y la dirección elegidos. El
 * cobro y el pedido vienen después: capturar, descontar el stock y vaciar el carrito.
 *
 * Cuerpo: `{ shippingTypeId, shippingAddressId }`. Respuestas: 200 `{ clientSecret,
 * paymentIntentId, quote }` (el secreto para que el Payment Element confirme la tarjeta, y el
 * presupuesto en céntimos para el resumen); 400 cuerpo no válido o carrito vacío; 401 sin sesión
 * (antes de leer el cuerpo); 404 envío bloqueado o inexistente, o dirección que no es de este
 * cliente; 409 falta stock (`{ problems: [{ variantId, available }] }`, no se autoriza nada);
 * 502 la pasarela falla; 500 error interno.
 */
export async function POST(request: Request) {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond({ message: 'Inicia sesión para continuar' }, 401);

        const body = await request.json().catch(() => undefined);
        if (body === undefined)
            return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);

        const parsed = checkoutPaymentRequestSchema.safeParse(body);
        if (!parsed.success) {
            return respond(
                {
                    message: 'Datos del pago inválidos',
                    errors: parsed.error.flatten().fieldErrors,
                },
                400,
            );
        }
        const { shippingTypeId, shippingAddressId } = parsed.data;

        const items = await getUserCart(userId);
        if (items.length === 0) return respond({ message: 'Tu carrito está vacío' }, 400);

        const [shipping, address, lines] = await Promise.all([
            getShippingTypeById(shippingTypeId),
            getUserAddress(userId, shippingAddressId),
            getCartLines(items.map(({ variantId }) => variantId)),
        ]);
        if (!shipping) return respond({ message: 'El tipo de envío no está disponible' }, 404);
        if (!address) return respond({ message: 'La dirección de envío no existe' }, 404);

        const problems = findStockProblems(items, lines);
        if (problems.length > 0) {
            return respond({ message: 'Hay productos sin stock suficiente', problems }, 409);
        }

        const priceByVariant = new Map(lines.map((line) => [line.variantId, line]));
        const quote = quoteOrder(
            items.map(({ variantId, quantity }) => {
                // `findStockProblems` ya garantizó que la línea existe.
                const { price, taxRate } = priceByVariant.get(variantId)!;
                return { quantity, price, taxRate };
            }),
            shipping.cost,
        );
        if (quote.totalCents < MIN_AMOUNT_CENTS)
            return respond({ message: 'El importe es demasiado bajo para pagar con tarjeta' }, 400);

        const authorization = await createAuthorization({
            amountCents: quote.totalCents,
            userId,
            cartFingerprint: cartFingerprint({
                lines: items,
                shippingTypeId,
                totalCents: quote.totalCents,
            }),
        });
        return respond({
            clientSecret: authorization.clientSecret,
            paymentIntentId: authorization.id,
            quote,
        });
    } catch (error) {
        if (error instanceof PaymentError) {
            console.error(error, error.cause);
            return respond(
                { message: 'No se ha podido iniciar el pago. Inténtalo de nuevo.' },
                502,
            );
        }
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
