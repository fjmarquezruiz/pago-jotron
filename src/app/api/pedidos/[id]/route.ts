import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { getUserOrder } from '@/lib/db/queries';
import { buildOrderDetail } from '@/lib/orders/detail';
import { MAX_ID } from '@/lib/validations/ids';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Respuesta JSON que ningún navegador ni intermediario guarda: son datos personales de una cuenta. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Un pedido del cliente (RF8), para la página de confirmación. Solo si es de la cuenta de la
 * sesión: el pedido de otra cuenta responde igual que uno que no existe (404), para no revelar
 * qué ids existen.
 *
 * El presupuesto (`quote`) se recalcula con `quoteOrder` sobre el precio y el IVA GUARDADOS en las
 * líneas y el coste de envío guardado en el pedido, no los vigentes: un cambio de precios
 * posterior no altera un pedido ya hecho (ver `buildOrderDetail`). `canCancel` dice si el cliente puede
 * cancelarlo ahora (`canCustomerCancel`, calculado en el servidor); `blockedFrom` es el estado que
 * tenía un pedido Bloqueado. `estimatedDelivery` es `AAAA-MM-DD`: el día de alta del
 * pedido más los días máximos laborables del tipo de envío (`estimatedDeliveryDate`), o `null` si
 * ese envío no tiene plazo definido.
 *
 * Respuestas: 200 `{ order }`; 400 el id no es un entero válido; 401 sin sesión; 404 no existe o
 * es de otra cuenta; 500 error interno.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond({ message: 'Inicia sesión para continuar' }, 401);

        const orderId = /^\d+$/.test(params.id) ? Number(params.id) : NaN;
        if (!Number.isSafeInteger(orderId) || orderId < 1 || orderId > MAX_ID)
            return respond({ message: 'El identificador del pedido no es válido' }, 400);

        const found = await getUserOrder(userId, orderId);
        if (found === null) return respond({ message: 'El pedido no existe' }, 404);
        return respond({ order: buildOrderDetail(found) });
    } catch (error) {
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
