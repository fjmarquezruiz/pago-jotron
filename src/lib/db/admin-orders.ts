import { and, desc, eq, gte, lt, or, sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { db } from '@/db';
import { cancellationTypes, invoices, orders, orderStatuses, users } from '@/db/schema';
import { parseOrderSearch, type AdminOrderFilters } from '@/lib/admin/orders';
import { searchPattern, LIKE_ESCAPE } from '@/lib/catalog/search';
import { CUSTOMER_CANCELLATION_DESCRIPTION } from '@/lib/orders/cancellation';
import type { InvoiceDocument } from '@/lib/invoices/types';
import { adminOrderQuery, orderLinesQuery } from './queries';

/** Día siguiente a uno `AAAA-MM-DD`, para comparar con `< día + 1` y que `to` entre entero. */
function nextDay(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
}

/** `columna like patrón escape '!'` (ver `LIKE_ESCAPE`). */
function likeEscaped(column: SQLWrapper, pattern: string): SQL {
    return sql`${column} like ${pattern} escape ${sql.raw(`'${LIKE_ESCAPE}'`)}`;
}

/** `WHERE` del listado: estado, fechas y búsqueda por número o por correo del cliente. */
function adminOrdersCondition({ status, from, to, q }: AdminOrderFilters): SQL | undefined {
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(orderStatuses.name, status));
    if (from) conditions.push(gte(orders.createdAt, `${from} 00:00:00`));
    if (to) conditions.push(lt(orders.createdAt, `${nextDay(to)} 00:00:00`));
    const search = parseOrderSearch(q);
    if (search) {
        const matches: SQL[] = [];
        // El número de pedido es `PJ-<id>`: se busca por el principio del id.
        if (search.idPrefix)
            matches.push(likeEscaped(sql`cast(${orders.id} as char)`, `${search.idPrefix}%`));
        if (search.email) matches.push(likeEscaped(users.email, searchPattern(search.email)!));
        // `PJ` a secas (sin cifras) no restringe: todos los pedidos son `PJ-…`.
        if (matches.length > 0)
            conditions.push(matches.length === 1 ? matches[0] : or(...matches)!);
    }
    return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Una página del listado de pedidos del panel (CU11): todos los clientes, del más reciente al más
 * antiguo (`order_id` desempata), con el cliente y si el pedido ya tiene factura.
 *
 * @param params - Página (desde 1), tamaño y filtros.
 * @returns Los pedidos de la página, el total con los filtros y el total sin filtros.
 */
export async function getAdminOrdersPage({
    page,
    pageSize,
    ...filters
}: { page: number; pageSize: number } & AdminOrderFilters) {
    const where = adminOrdersCondition(filters);
    const [items, [counted], [all]] = await Promise.all([
        db
            .select({
                id: orders.id,
                createdAt: orders.createdAt,
                total: orders.total,
                status: orderStatuses.name,
                customerName: users.name,
                customerLastName: users.lastName,
                customerEmail: users.email,
                invoiceNumber: invoices.number,
            })
            .from(orders)
            .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
            .innerJoin(users, eq(users.id, orders.userId))
            .leftJoin(invoices, eq(invoices.orderId, orders.id))
            .where(where)
            .orderBy(desc(orders.createdAt), desc(orders.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize),
        db
            .select({ total: sql<number>`count(*)`.mapWith(Number) })
            .from(orders)
            .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
            .innerJoin(users, eq(users.id, orders.userId))
            .where(where),
        db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(orders),
    ]);
    return { items, total: counted?.total ?? 0, overall: all?.total ?? 0 };
}

/** Una página del listado, tal como la devuelve `getAdminOrdersPage`. */
export type AdminOrdersPage = Awaited<ReturnType<typeof getAdminOrdersPage>>;

/**
 * Un pedido cualquiera con sus líneas y los datos de su cliente (CU11).
 *
 * @param orderId - `orders.order_id`.
 * @returns `{ order, lines }`, o `null` si no existe.
 */
export async function getAdminOrder(orderId: number) {
    const [order] = await adminOrderQuery(orderId);
    if (!order) return null;
    return { order, lines: await orderLinesQuery(orderId) };
}

/** Un pedido del panel con sus líneas, tal como lo devuelve `getAdminOrder`. */
export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;

/**
 * Motivos con los que administración puede anular un pedido: los de `cancellation_types` menos el
 * del cliente (`CUSTOMER_CANCELLATION_DESCRIPTION`), que es solo de la cancelación del cliente.
 *
 * @returns `{ id, description }` por motivo, por orden de id.
 */
export async function listAdminCancellationTypes() {
    const rows = await db
        .select({ id: cancellationTypes.id, description: cancellationTypes.description })
        .from(cancellationTypes)
        .orderBy(cancellationTypes.id);
    return rows.filter((row) => row.description !== CUSTOMER_CANCELLATION_DESCRIPTION);
}

/**
 * La factura de un pedido, sin filtrar por cuenta, para que el administrador la descargue.
 *
 * @param orderId - `orders.order_id`.
 * @returns El estado y el documento congelado al emitirla, o `null` si no existe o no hay factura.
 */
export async function getOrderInvoice(
    orderId: number,
): Promise<{ status: string; document: InvoiceDocument } | null> {
    const [row] = await db
        .select({ status: orderStatuses.name, snapshot: invoices.snapshot })
        .from(invoices)
        .innerJoin(orders, eq(orders.id, invoices.orderId))
        .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
        .where(eq(orders.id, orderId));
    return row ? { status: row.status, document: row.snapshot as InvoiceDocument } : null;
}
