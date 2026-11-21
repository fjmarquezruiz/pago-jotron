import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccountShell } from '@/components/account/account-shell';
import { OrderHistoryEmpty } from '@/components/orders/order-history-empty';
import { OrderHistoryFilters } from '@/components/orders/order-history-filters';
import { OrderHistoryPagination } from '@/components/orders/order-history-pagination';
import { OrderHistoryTable } from '@/components/orders/order-history-table';
import { getSessionUserId } from '@/lib/auth/session';
import { getPagination } from '@/lib/catalog/pagination';
import { getUserOrdersPage } from '@/lib/db/queries';
import {
    hasHistoryFilters,
    historyRangeText,
    ORDER_HISTORY_PATH,
    orderHistoryHref,
} from '@/lib/orders/history-view';
import { ORDER_HISTORY_PAGE_SIZE, parseOrderHistoryParams } from '@/lib/validations/orders';

/** Depende de la sesión y de los filtros de la URL: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Historial de pedidos | Pago de Jotrón' };

/**
 * Historial de pedidos del cliente (Figma: account-order-history, RF8): título, filtros por estado
 * y fecha, la tabla con número, fecha, total y estado de cada pedido, y la paginación, de diez en
 * diez. Es privada (el middleware protege `/cuenta`); aquí se vuelve a comprobar la sesión y solo
 * salen los pedidos de esa cuenta. Los parámetros de la URL se sanean (`parseOrderHistoryParams`)
 * y una página que pasa de la última redirige a la última.
 */
export default async function OrderHistoryPage({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const userId = await getSessionUserId();
    if (userId === null)
        redirect(`/auth/login?callbackUrl=${encodeURIComponent(ORDER_HISTORY_PATH)}`);

    const { page: requested, ...filters } = parseOrderHistoryParams(searchParams);
    const { items, total } = await getUserOrdersPage(userId, {
        page: requested,
        pageSize: ORDER_HISTORY_PAGE_SIZE,
        ...filters,
    });

    const pagination = getPagination({
        page: requested,
        pageSize: ORDER_HISTORY_PAGE_SIZE,
        total,
    });
    if (pagination.outOfRange)
        redirect(orderHistoryHref({ ...filters, page: pagination.totalPages }));

    return (
        <AccountShell
            current="pedidos"
            breadcrumb={[
                { label: 'Mi cuenta', href: ORDER_HISTORY_PATH },
                { label: 'Historial de pedidos' },
            ]}
        >
            <h1 className="text-2xl font-medium">Historial de pedidos</h1>
            <div className="flex flex-col gap-gap-md">
                <OrderHistoryFilters filters={filters} />
                {items.length === 0 ? (
                    <OrderHistoryEmpty filtered={hasHistoryFilters(filters)} />
                ) : (
                    <>
                        <OrderHistoryTable rows={items} />
                        <OrderHistoryPagination
                            summary={historyRangeText({
                                page: pagination.page,
                                pageSize: pagination.pageSize,
                                shown: items.length,
                                total,
                            })}
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            filters={filters}
                        />
                    </>
                )}
            </div>
        </AccountShell>
    );
}
