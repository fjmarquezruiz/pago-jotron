import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { orderProducts, orders, orderStatuses, productVariants, products } from '@/db/schema';
import {
    IN_PROGRESS_STATUSES,
    type AffectedOrder,
    type SalesBlockScope,
} from '@/lib/admin/sales-block';
import { orderNumber } from '@/lib/orders/format';
import type { OrderStatus } from '@/lib/orders/status';

/**
 * Pedidos en curso (`IN_PROGRESS_STATUSES`) con productos de una bodega, de una D.O. o con un
 * producto concreto. Solo lectura: bloquear ventas no modifica ningún pedido.
 *
 * @param scope - Qué se bloquea.
 * @param id - Id del producto, de la bodega o de la D.O.
 * @returns Los pedidos, del más antiguo al más reciente, sin repetir.
 */
export async function getAffectedOrders(
    scope: SalesBlockScope,
    id: number,
): Promise<AffectedOrder[]> {
    const target =
        scope === 'product'
            ? eq(products.id, id)
            : scope === 'winery'
              ? eq(products.wineryId, id)
              : eq(products.guaranteeOfOriginId, id);
    const rows = await db
        .selectDistinct({ id: orders.id, status: orderStatuses.name })
        .from(orders)
        .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
        .innerJoin(orderProducts, eq(orderProducts.orderId, orders.id))
        .innerJoin(productVariants, eq(productVariants.id, orderProducts.variantId))
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(target, inArray(orderStatuses.name, [...IN_PROGRESS_STATUSES])))
        .orderBy(asc(orders.id));
    return rows.map((row) => ({
        id: row.id,
        number: orderNumber(row.id),
        status: row.status as OrderStatus,
    }));
}
