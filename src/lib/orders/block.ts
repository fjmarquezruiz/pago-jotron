import { db } from '@/db';
import {
    changeOrderStatusQuery,
    getOrderForStatusChange,
    getOrderStatuses,
    insertAuditLogQuery,
} from '@/lib/db/queries';
import { orderNumber } from './format';
import { ORDER_STATUS, shouldBlock, type OrderStatus } from './status';

export type BlockOrderResult =
    | { ok: true; from: OrderStatus }
    | { ok: false; code: 'not_found' | 'not_blockable' | 'conflict'; message: string };

/**
 * Bloquea un pedido que lleva más de 15 días en el mismo estado (RF8). Es la entrada del proceso
 * automático (cron), aparte de `changeOrderStatus`: ningún usuario bloquea a mano, y `canTransition`
 * no admite Bloqueado como destino.
 *
 * Guarda el estado de origen en `blocked_from_status_id` en el mismo `UPDATE` que cambia el estado,
 * condicionado al estado que se leyó: si el pedido se movió entre medias, no se pisa (`conflict`).
 * Vuelve a comprobar `shouldBlock` aquí, con la fecha de la BD, así que un pedido que ya no cumple
 * el plazo no se bloquea aunque el cron lo haya listado. No devuelve stock ni reembolsa: bloquear
 * no cambia nada de eso.
 *
 * @param orderId - `orders.order_id`.
 * @param now - Reloj, para poder probar el plazo.
 * @returns El estado del que venía, o el motivo por el que no se bloqueó.
 * @throws Errores inesperados de la BD.
 */
export async function blockOrder(
    orderId: number,
    now: Date = new Date(),
): Promise<BlockOrderResult> {
    const order = await getOrderForStatusChange(orderId);
    if (order === null) return { ok: false, code: 'not_found', message: 'El pedido no existe' };

    const statuses = await getOrderStatuses();
    const idOf = new Map(statuses.map(({ id, name }) => [name, id]));
    const from = statuses.find(({ id }) => id === order.statusId)?.name as OrderStatus | undefined;
    const blockedId = idOf.get(ORDER_STATUS.BLOCKED);
    if (from === undefined || blockedId === undefined)
        throw new Error(
            `Falta el estado de pedido '${from === undefined ? order.statusId : 'Bloqueado'}'`,
        );

    if (
        !shouldBlock(
            { status: from, createdAt: order.createdAt, statusUpdatedAt: order.statusUpdatedAt },
            now,
        )
    )
        return { ok: false, code: 'not_blockable', message: `El pedido '${from}' no se bloquea` };

    const moved = await db.transaction(async (tx) => {
        const [result] = await changeOrderStatusQuery(tx, orderId, order.statusId, blockedId, {
            blockedFromStatusId: order.statusId,
        });
        if (result.affectedRows === 0) return false;
        await insertAuditLogQuery(tx, {
            userId: null,
            action: `Pedido ${orderNumber(orderId)}: ${from} → ${ORDER_STATUS.BLOCKED}`,
            details: `pedido ${orderId} de la cuenta ${order.userId}; bloqueado por el sistema: más de 15 días en '${from}'`,
        });
        return true;
    });
    if (!moved) return { ok: false, code: 'conflict', message: 'El pedido ha cambiado de estado' };
    return { ok: true, from };
}
