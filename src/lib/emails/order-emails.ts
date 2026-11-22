import { getOrderEmailData } from '@/lib/db/queries';
import { sendEmail } from './send';
import {
    orderCancelledEmail,
    orderConfirmedEmail,
    transferReceivedEmail,
    type RefundNotice,
} from './templates';

/**
 * Lee el pedido, construye el correo y lo envía. Nada de aquí lanza ni se rechaza (CU3, excepción
 * del paso 12): si el correo falla, el pedido ya está hecho y no se toca; el error queda en el log.
 */
async function notify(
    orderId: number,
    build: (order: NonNullable<Awaited<ReturnType<typeof getOrderEmailData>>>) => {
        subject: string;
        html: string;
        text: string;
    },
): Promise<void> {
    try {
        const order = await getOrderEmailData(orderId);
        if (order === null) {
            console.error(`[correo] El pedido ${orderId} no existe: no se envía el correo`);
            return;
        }
        await sendEmail({ to: order.email, ...build(order) });
    } catch (error) {
        console.error(`[correo] Fallo preparando el correo del pedido ${orderId}`, error);
    }
}

/** Avisa al cliente de que su pedido está confirmado (RF7). */
export const notifyOrderConfirmed = (orderId: number) => notify(orderId, orderConfirmedEmail);

/** Avisa al cliente de que se ha recibido su transferencia (MVP2). */
export const notifyTransferReceived = (orderId: number) => notify(orderId, transferReceivedEmail);

/** Avisa al cliente de que su pedido se ha anulado y de qué pasa con el reembolso (RF8). */
export const notifyOrderCancelled = (orderId: number, refund: RefundNotice) =>
    notify(orderId, (order) => orderCancelledEmail(order, refund));
