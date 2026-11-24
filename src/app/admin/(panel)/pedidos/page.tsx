import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CircleAlert, ShoppingBag } from 'lucide-react';
import { AdminOrdersFilters } from '@/components/admin/orders/admin-orders-filters';
import { AdminOrdersTable } from '@/components/admin/orders/admin-orders-table';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/admin-states';
import { OrderHistoryPagination } from '@/components/orders/order-history-pagination';
import { Button } from '@/components/ui/button';
import {
    ADMIN_ORDERS_PAGE_SIZE,
    ADMIN_ORDERS_PATH,
    adminOrdersHref,
    adminRangeText,
    hasAdminOrderFilters,
} from '@/lib/admin/orders';
import { getSessionUser } from '@/lib/auth/session';
import { getPagination } from '@/lib/catalog/pagination';
import { getAdminOrdersPage, type AdminOrdersPage } from '@/lib/db/admin-orders';
import { parseAdminOrderParams } from '@/lib/validations/orders';

/** Depende de la sesión y de los filtros de la URL: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Pedidos | Pago de Jotrón' };

const DESCRIPTION =
    'Gestiona las transacciones de los clientes, consulta el estado de los envíos y tramita los envíos de vino pendientes.';

/**
 * Listado de pedidos del panel (Figma: orders-list, orders-list-filtered, orders-empty y
 * orders-error; CU11). Solo el administrador (el middleware ya lo exige; aquí se vuelve a comprobar
 * con el rol de la BD). Filtros por estado y fecha y búsqueda por número o correo, todo en la URL;
 * diez por página. Una página que pasa de la última redirige a la última.
 */
export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const user = await getSessionUser();
    if (user === null || user.role !== 'Administrador') redirect('/acceso-denegado');

    const { page: requested, ...filters } = parseAdminOrderParams(searchParams);
    const frame = (children: React.ReactNode) => (
        <AdminPage breadcrumb={[{ label: 'Pedidos' }]} title="Pedidos" description={DESCRIPTION}>
            {children}
        </AdminPage>
    );

    let data: AdminOrdersPage;
    try {
        data = await getAdminOrdersPage({
            page: requested,
            pageSize: ADMIN_ORDERS_PAGE_SIZE,
            ...filters,
        });
    } catch (error) {
        console.error(error);
        return frame(
            <AdminErrorState
                icon={<CircleAlert />}
                title="No se han podido cargar los pedidos"
                description="El servicio de pedidos no está disponible temporalmente. Normalmente se restablece en unos minutos."
            />,
        );
    }

    const { items, total, overall } = data;
    const filtered = hasAdminOrderFilters(filters);
    if (overall === 0)
        return frame(
            <AdminEmptyState
                icon={<ShoppingBag />}
                title="Todavía no hay pedidos"
                description="Los pedidos de los clientes aparecerán aquí. Mientras tanto, puedes consultar y actualizar tus productos."
            />,
        );

    const pagination = getPagination({
        page: requested,
        pageSize: ADMIN_ORDERS_PAGE_SIZE,
        total,
    });
    if (pagination.outOfRange)
        redirect(adminOrdersHref({ ...filters, page: pagination.totalPages }));

    return frame(
        <>
            <AdminOrdersFilters filters={filters} />
            {items.length === 0 ? (
                <AdminEmptyState
                    icon={<ShoppingBag />}
                    title="Ningún pedido coincide con los filtros"
                    description="Prueba con otros filtros o límpialos para ver todos los pedidos."
                    action={
                        <Button asChild variant="outline" size="md">
                            <Link href={ADMIN_ORDERS_PATH}>Limpiar todo</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="flex flex-col gap-gap-md">
                    <AdminOrdersTable rows={items} />
                    <OrderHistoryPagination
                        summary={adminRangeText({
                            page: pagination.page,
                            pageSize: pagination.pageSize,
                            shown: items.length,
                            total,
                            overall,
                            filtered,
                        })}
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        filters={filters}
                        hrefFor={(target) => adminOrdersHref({ ...filters, page: target })}
                        alwaysShowPager={filtered}
                    />
                </div>
            )}
        </>,
    );
}
