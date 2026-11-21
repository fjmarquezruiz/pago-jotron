import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { changeOrderStatus } from '@/lib/orders/change-status';
import { ORDER_STATUS } from '@/lib/orders/status';
import { CHANGE_STATUS_HTTP } from '@/lib/orders/status-http';
import { MAX_ID } from '@/lib/validations/ids';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Respuesta JSON que ningún navegador ni intermediario guarda. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * El cliente cancela su pedido (RF8, CU7). El dueño sale de la sesión y el plazo se comprueba en
 * el servidor (RNF3): en Pendiente de pago siempre, y en Confirmado o En proceso solo durante las
 * primeras 24 h. Devuelve el stock y, si era de tarjeta, reembolsa (ver `changeOrderStatus`). No
 * lleva cuerpo: un cliente no elige el motivo.
 *
 * Respuestas: 200 `{ status, refund }` (`refund`: `none`, `done` o `failed`; si falla, el pedido
 * queda anulado y el reembolso, anotado para reintentarlo); 400 el id no es válido; 401 sin
 * sesión; 404 no existe o es de otra cuenta; 409 ya no se puede cancelar (plazo o estado) o el
 * pedido cambió a la vez; 500 error interno.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond({ message: 'Inicia sesión para continuar' }, 401);

        const orderId = /^\d+$/.test(params.id) ? Number(params.id) : NaN;
        if (!Number.isSafeInteger(orderId) || orderId < 1 || orderId > MAX_ID)
            return respond({ message: 'El identificador del pedido no es válido' }, 400);

        const result = await changeOrderStatus(orderId, ORDER_STATUS.CANCELLED, {
            role: 'Cliente',
            userId,
        });
        if (!result.ok)
            return respond({ message: result.message }, CHANGE_STATUS_HTTP[result.code]);
        return respond({ status: result.to, refund: result.refund });
    } catch (error) {
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
