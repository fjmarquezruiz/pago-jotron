import { db } from '@/db';
import {
    cancellationTypeExists,
    changeOrderStatusQuery,
    getCancellationTypeIdByDescription,
    getInvoiceSource,
    getOrderForStatusChange,
    getOrderStatuses,
    insertAuditLogQuery,
    orderStockLinesQuery,
    restoreStockQuery,
    type OrderStatusExtras,
} from '@/lib/db/queries';
import { notifyOrderCancelled, notifyTransferReceived } from '@/lib/emails/order-emails';
import { issueInvoice } from '@/lib/invoices/issue';
import { getInvoiceIssuer } from '@/lib/invoices/issuer';
import { refund } from '@/lib/payments';
import { CUSTOMER_CANCELLATION_DESCRIPTION } from './cancellation';
import { orderNumber } from './format';
import {
    canCustomerCancel,
    canTransition,
    ORDER_STATUS,
    returnsStockOnCancel,
    type OrderStatus,
} from './status';

/** Quién pide el cambio: el cliente dueño del pedido o la administración. */
export interface StatusActor {
    role: 'Cliente' | 'Administrador';
    /** Cuenta de la sesión (`getSessionUserId`). */
    userId: number;
}

export interface ChangeStatusOptions {
    /** Motivo de la anulación (`cancellation_types`). Obligatorio al anular desde administración. */
    cancellationTypeId?: number;
    /** El pedido solo tiene visitas o catas (ver `canTransition`). */
    onlyEvents?: boolean;
    /** Reloj, para poder probar el plazo de 24 h. */
    now?: Date;
}

export type ChangeStatusFailureCode =
    | 'not_found'
    | 'forbidden'
    | 'invalid_transition'
    | 'cancel_window_closed'
    | 'invalid_cancellation_type'
    | 'conflict';

/** Qué pasó con el dinero al anular: `none` si no había nada que devolver. */
export type RefundOutcome = 'none' | 'done' | 'failed';

export type ChangeStatusResult =
    | {
          ok: true;
          from: OrderStatus;
          to: OrderStatus;
          refund: RefundOutcome;
          /** Número de la factura emitida al pasar a Entregado; `null` en cualquier otro cambio. */
          invoiceNumber: string | null;
      }
    | { ok: false; code: ChangeStatusFailureCode; message: string };

const fail = (code: ChangeStatusFailureCode, message: string): ChangeStatusResult => ({
    ok: false,
    code,
    message,
});

/** Anota en la auditoría un fallo que no ve el cliente y que alguien debe reintentar. */
async function reportCritical(userId: number, action: string, details: string): Promise<void> {
    console.error(`[CRÍTICO] ${action}: ${details}`);
    try {
        await insertAuditLogQuery(db, { userId, action, details });
    } catch (error) {
        console.error('No se pudo anotar en la auditoría', error);
    }
}

/**
 * Devuelve el dinero de un pedido de tarjeta anulado. El pedido ya está Anulado y confirmado en la
 * BD: si Stripe falla, se anota como crítico en la auditoría para reintentarlo y NO se deshace nada.
 */
async function refundQuietly(
    orderId: number,
    ownerId: number,
    paymentIntentId: string,
): Promise<RefundOutcome> {
    try {
        await refund(paymentIntentId);
        return 'done';
    } catch (error) {
        console.error('No se pudo reembolsar el pago', paymentIntentId, error);
        await reportCritical(
            ownerId,
            'Reembolso pendiente',
            `pedido ${orderId} anulado, PaymentIntent ${paymentIntentId}: el reembolso falló y hay que reintentarlo a mano`,
        );
        return 'failed';
    }
}

/**
 * Cambia el estado de un pedido (RF8, CU7, CU11). Es la única vía para hacerlo: la usan la API del
 * cliente (`/api/pedidos/[id]/cancelar`) y la de administración, y las reglas son las de `status.ts`.
 *
 * - Un solo `UPDATE … WHERE status_id = <el esperado>`: si otro proceso movió el pedido entre
 *   medias, no se pisa y se responde `conflict`.
 * - Anular: en la MISMA transacción se devuelve el stock (solo si las botellas no han salido del
 *   almacén, ver `returnsStockOnCancel`) y se guardan `cancelled_by` y
 *   `cancellation_type_id`. Después del `COMMIT`, si el pedido era de tarjeta, se reembolsa; si
 *   Stripe falla, queda anotado como crítico en la auditoría y el pedido sigue Anulado.
 * - Cada cambio queda en `audit_logs`, dentro de la transacción.
 * - El cliente solo puede anular lo suyo y dentro de plazo; un pedido de otra cuenta responde
 *   `not_found`, como uno que no existe.
 *
 * @param orderId - `orders.order_id`.
 * @param to - Estado al que pasa.
 * @param actor - Quién lo pide, con la cuenta de la sesión.
 * @param options - Motivo de anulación, pedido solo de eventos y reloj.
 * @returns El cambio hecho (con el resultado del reembolso) o el motivo del rechazo.
 * @throws Errores inesperados de la BD (la ruta responde 500).
 */
export async function changeOrderStatus(
    orderId: number,
    to: OrderStatus,
    actor: StatusActor,
    options: ChangeStatusOptions = {},
): Promise<ChangeStatusResult> {
    const { now = new Date(), onlyEvents = false } = options;

    const order = await getOrderForStatusChange(orderId);
    if (order === null) return fail('not_found', 'El pedido no existe');
    if (actor.role === 'Cliente') {
        if (order.userId !== actor.userId) return fail('not_found', 'El pedido no existe');
        if (to !== ORDER_STATUS.CANCELLED)
            return fail('forbidden', 'Solo puedes cancelar tu pedido');
    }

    const statuses = await getOrderStatuses();
    const idOf = new Map(statuses.map(({ id, name }) => [name, id]));
    const nameOf = new Map(statuses.map(({ id, name }) => [id, name as OrderStatus]));
    const from = nameOf.get(order.statusId);
    const toId = idOf.get(to);
    if (from === undefined || toId === undefined)
        throw new Error(`Falta el estado de pedido '${from === undefined ? order.statusId : to}'`);

    const blockedFrom =
        order.blockedFromStatusId === null ? null : (nameOf.get(order.blockedFromStatusId) ?? null);
    if (!canTransition(from, to, { onlyEvents, blockedFrom }))
        return fail('invalid_transition', `Un pedido '${from}' no puede pasar a '${to}'`);

    if (
        actor.role === 'Cliente' &&
        !canCustomerCancel(
            { status: from, createdAt: order.createdAt, statusUpdatedAt: order.statusUpdatedAt },
            now,
        )
    )
        return fail('cancel_window_closed', 'Ya no puedes cancelar este pedido');

    const cancelling = to === ORDER_STATUS.CANCELLED;
    let cancellationTypeId = options.cancellationTypeId;
    if (cancelling) {
        if (actor.role === 'Cliente') {
            // El cliente no elige el motivo: se busca por descripción, no por id.
            const id = await getCancellationTypeIdByDescription(CUSTOMER_CANCELLATION_DESCRIPTION);
            if (id === null) throw new Error('Falta el motivo de cancelación del cliente');
            cancellationTypeId = id;
        } else if (
            cancellationTypeId === undefined ||
            !(await cancellationTypeExists(cancellationTypeId))
        )
            return fail('invalid_cancellation_type', 'El motivo de la anulación no es válido');
    }

    const extras: OrderStatusExtras = {};
    if (cancelling) {
        extras.cancelledBy = actor.role;
        extras.cancellationTypeId = cancellationTypeId;
    }
    if (from === ORDER_STATUS.BLOCKED) extras.blockedFromStatusId = null;

    // Los datos fiscales de la tienda se leen ahora, antes de tocar la BD: si faltan, la entrega
    // falla sin cambiar nada y la factura ya nace con ellos (no se vuelve a mirar el entorno).
    const delivering = to === ORDER_STATUS.DELIVERED;
    const issuer = delivering ? getInvoiceIssuer() : null;
    // Las líneas del pedido no cambian: se leen antes de la transacción y la factura se emite dentro.
    const invoiceSource = delivering ? await getInvoiceSource(orderId) : null;
    if (delivering && invoiceSource === null) return fail('not_found', 'El pedido no existe');

    let invoiceNumber: string | null = null;
    const moved = await db.transaction(async (tx) => {
        const [result] = await changeOrderStatusQuery(tx, orderId, order.statusId, toId, extras);
        // Otro proceso ya movió el pedido: no se devuelve el stock dos veces.
        if (result.affectedRows === 0) return false;
        if (cancelling && returnsStockOnCancel(from, blockedFrom)) {
            // Por presentación, como al descontar: sin bloqueos cruzados.
            for (const { variantId, quantity } of await orderStockLinesQuery(tx, orderId))
                await restoreStockQuery(tx, variantId, quantity);
        }
        if (invoiceSource !== null && issuer !== null)
            invoiceNumber = await issueInvoice(tx, invoiceSource, issuer, now);
        await insertAuditLogQuery(tx, {
            userId: actor.userId,
            action: `Pedido ${orderNumber(orderId)}: ${from} → ${to}`,
            details: `pedido ${orderId} de la cuenta ${order.userId}; lo cambia ${actor.role} (cuenta ${actor.userId})${
                cancelling
                    ? `; motivo ${cancellationTypeId}${
                          from === ORDER_STATUS.BLOCKED
                              ? `; bloqueado desde ${blockedFrom ?? 'un estado desconocido'}`
                              : ''
                      }`
                    : ''
            }${invoiceNumber ? `; factura ${invoiceNumber}` : ''}`,
        });
        return true;
    });
    if (!moved) return fail('conflict', 'El pedido ha cambiado de estado. Vuelve a cargarlo.');

    const refunded: RefundOutcome =
        cancelling &&
        from !== ORDER_STATUS.PENDING && // sin cobrar no hay nada que devolver
        order.paymentMethod === 'Tarjeta' &&
        order.paymentIntentId !== null
            ? await refundQuietly(orderId, order.userId, order.paymentIntentId)
            : 'none';
    // Los correos van al final y no lanzan: un fallo de envío no toca el cambio ya hecho.
    if (cancelling) await notifyOrderCancelled(orderId, refunded);
    else if (from === ORDER_STATUS.PENDING && to === ORDER_STATUS.CONFIRMED)
        await notifyTransferReceived(orderId);
    return { ok: true, from, to, refund: refunded, invoiceNumber };
}
