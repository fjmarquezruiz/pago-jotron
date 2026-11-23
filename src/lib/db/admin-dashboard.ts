import {
    and,
    count,
    countDistinct,
    desc,
    eq,
    gte,
    inArray,
    lt,
    notInArray,
    sum,
} from 'drizzle-orm';
import { db } from '@/db';
import {
    auditLogs,
    orderProducts,
    orderStatuses,
    orders,
    productVariants,
    products,
    users,
} from '@/db/schema';
import {
    daysAgo,
    INACTIVE_ORDER_STATUSES,
    LOW_STOCK_THRESHOLD,
    monthStart,
    NO_REVENUE_STATUSES,
    NO_SALES_STATUSES,
    PENDING_SHIPMENT_STATUSES,
    RECENT_ACTIVITY_LIMIT,
    RECENT_ORDERS_LIMIT,
    TOP_SELLING_DAYS,
    TOP_SELLING_LIMIT,
} from '@/lib/admin/dashboard';

/** Cifras de catálogo del panel de control: las ve también el editor. */
export interface CatalogStats {
    /** Productos del catálogo, bloqueados o no. */
    totalProducts: number;
    /** Productos con alguna presentación a la venta por debajo de `LOW_STOCK_THRESHOLD` unidades. */
    lowStockProducts: number;
}

export async function getCatalogStats(): Promise<CatalogStats> {
    const [[total], [low]] = await Promise.all([
        db.select({ value: count() }).from(products),
        db
            .select({ value: countDistinct(productVariants.productId) })
            .from(productVariants)
            .where(
                and(
                    eq(productVariants.isBlocked, false),
                    lt(productVariants.stock, LOW_STOCK_THRESHOLD),
                ),
            ),
    ]);
    return { totalProducts: total?.value ?? 0, lowStockProducts: low?.value ?? 0 };
}

/** Un vino de «Vinos más vendidos». */
export interface TopSellingWine {
    productId: number;
    name: string;
    units: number;
}

/**
 * Vinos con más unidades vendidas en los últimos `TOP_SELLING_DAYS` días (sin contar pedidos anulados).
 * @param now - Ahora.
 */
export async function getTopSellingWines(now: Date): Promise<TopSellingWine[]> {
    const units = sum(orderProducts.quantity).mapWith(Number);
    return db
        .select({ productId: products.id, name: products.name, units })
        .from(orderProducts)
        .innerJoin(orders, eq(orders.id, orderProducts.orderId))
        .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
        .innerJoin(productVariants, eq(productVariants.id, orderProducts.variantId))
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(
            and(
                gte(orders.createdAt, daysAgo(now, TOP_SELLING_DAYS)),
                notInArray(orderStatuses.name, [...NO_SALES_STATUSES]),
            ),
        )
        .groupBy(products.id, products.name)
        .orderBy(desc(units), products.name)
        .limit(TOP_SELLING_LIMIT) as Promise<TopSellingWine[]>;
}

/** Cifras de pedidos del panel de control: solo el administrador. */
export interface OrderStats {
    /** Pedidos que no están Entregados ni Anulados. */
    activeOrders: number;
    /** De los activos, los pagados que aún no se han enviado. */
    pendingShipment: number;
    /** Suma de los pedidos del mes en curso, sin anulados ni pendientes de pago (euros, `'1234.50'`). */
    monthRevenue: string;
}

export async function getOrderStats(now: Date): Promise<OrderStats> {
    const [[active], [pending], [revenue]] = await Promise.all([
        db
            .select({ value: count() })
            .from(orders)
            .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
            .where(notInArray(orderStatuses.name, [...INACTIVE_ORDER_STATUSES])),
        db
            .select({ value: count() })
            .from(orders)
            .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
            .where(inArray(orderStatuses.name, [...PENDING_SHIPMENT_STATUSES])),
        db
            .select({ value: sum(orders.total) })
            .from(orders)
            .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
            .where(
                and(
                    gte(orders.createdAt, monthStart(now)),
                    notInArray(orderStatuses.name, [...NO_REVENUE_STATUSES]),
                ),
            ),
    ]);
    return {
        activeOrders: active?.value ?? 0,
        pendingShipment: pending?.value ?? 0,
        monthRevenue: revenue?.value ?? '0.00',
    };
}

/** Una fila de «Pedidos recientes». */
export interface RecentOrder {
    id: number;
    customerName: string | null;
    customerLastName: string | null;
    customerEmail: string;
    createdAt: string;
    total: string;
    status: string;
}

export async function getRecentOrders(): Promise<RecentOrder[]> {
    return db
        .select({
            id: orders.id,
            customerName: users.name,
            customerLastName: users.lastName,
            customerEmail: users.email,
            createdAt: orders.createdAt,
            total: orders.total,
            status: orderStatuses.name,
        })
        .from(orders)
        .innerJoin(users, eq(users.id, orders.userId))
        .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
        .orderBy(desc(orders.createdAt), desc(orders.id))
        .limit(RECENT_ORDERS_LIMIT);
}

/** Una fila de «Actividad reciente». */
export interface RecentActivity {
    id: number;
    action: string;
    details: string | null;
    loggedAt: string;
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
    return db
        .select({
            id: auditLogs.id,
            action: auditLogs.action,
            details: auditLogs.details,
            loggedAt: auditLogs.loggedAt,
        })
        .from(auditLogs)
        .orderBy(desc(auditLogs.loggedAt), desc(auditLogs.id))
        .limit(RECENT_ACTIVITY_LIMIT);
}
