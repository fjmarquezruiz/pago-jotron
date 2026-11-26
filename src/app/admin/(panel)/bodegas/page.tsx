import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CircleAlert, HouseHeart, Plus } from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/admin-states';
import { AdminWineriesFilters } from '@/components/admin/wineries/admin-wineries-filters';
import { AdminWineriesTable } from '@/components/admin/wineries/admin-wineries-table';
import { OrderHistoryPagination } from '@/components/orders/order-history-pagination';
import { Button } from '@/components/ui/button';
import {
    ADMIN_WINERIES_PAGE_SIZE,
    ADMIN_WINERIES_PATH,
    ADMIN_WINERY_NEW_PATH,
    adminWineriesHref,
    adminWineriesRangeText,
    hasAdminWineryFilters,
} from '@/lib/admin/wineries';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { getSessionUser } from '@/lib/auth/session';
import { getPagination } from '@/lib/catalog/pagination';
import {
    getAdminWineriesPage,
    getAdminWineryRegions,
    type AdminWineriesPage,
} from '@/lib/db/admin-wineries';
import { parseAdminWineryParams } from '@/lib/validations/admin-wineries';

/** Depende de la sesión y de los filtros de la URL: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Bodegas | Pago de Jotrón' };

const DESCRIPTION =
    'Un registro de bodegas colaboradoras, volúmenes de producción y países de origen.';

/**
 * Listado de bodegas del panel (Figma: wineries-list, wineries-list-search-open,
 * wineries-list-search-applied, wineries-empty y wineries-error-state; CU9). Editor y
 * administrador (el middleware ya lo exige; aquí se vuelve a comprobar con el rol de la BD).
 * Filtro por región y búsqueda por nombre en la URL; diez por página. Una página que pasa de la
 * última redirige a la última.
 */
export default async function AdminWineriesPageRoute({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const user = await getSessionUser();
    if (user === null || !CATALOG_ROLES.some((role) => role === user.role))
        redirect('/acceso-denegado');

    const { page: requested, ...filters } = parseAdminWineryParams(searchParams);
    const frame = (children: React.ReactNode) => (
        <AdminPage breadcrumb={[{ label: 'Bodegas' }]} title="Bodegas" description={DESCRIPTION}>
            {children}
        </AdminPage>
    );

    let data: AdminWineriesPage;
    let regions: string[];
    try {
        [data, regions] = await Promise.all([
            getAdminWineriesPage({
                page: requested,
                pageSize: ADMIN_WINERIES_PAGE_SIZE,
                ...filters,
            }),
            getAdminWineryRegions(),
        ]);
    } catch (error) {
        console.error(error);
        return frame(
            <AdminErrorState
                icon={<CircleAlert />}
                title="Algo ha salido mal"
                description="No se han podido cargar los datos de las bodegas. Puede tratarse de un problema temporal."
            />,
        );
    }

    const { items, total, overall } = data;
    const filtered = hasAdminWineryFilters(filters);
    if (overall === 0)
        return frame(
            <AdminEmptyState
                icon={<HouseHeart />}
                title="No hay bodegas registradas"
                description="Añade tu primera bodega para empezar a organizar tus proveedores de vino, instalaciones de producción y contactos regionales."
                action={
                    <Button asChild size="md">
                        <Link href={ADMIN_WINERY_NEW_PATH}>
                            <Plus aria-hidden="true" />
                            Añade tu bodega
                        </Link>
                    </Button>
                }
            />,
        );

    const pagination = getPagination({
        page: requested,
        pageSize: ADMIN_WINERIES_PAGE_SIZE,
        total,
    });
    if (pagination.outOfRange)
        redirect(adminWineriesHref({ ...filters, page: pagination.totalPages }));

    return frame(
        <>
            <AdminWineriesFilters filters={filters} regions={regions} />
            {items.length === 0 ? (
                <AdminEmptyState
                    icon={<HouseHeart />}
                    title="Ninguna bodega coincide con los filtros"
                    description="Prueba con otros filtros o límpialos para ver todas las bodegas."
                    action={
                        <Button asChild variant="outline" size="md">
                            <Link href={ADMIN_WINERIES_PATH}>Limpiar todo</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="flex flex-col gap-gap-md">
                    <AdminWineriesTable rows={items} />
                    <OrderHistoryPagination
                        summary={adminWineriesRangeText({
                            page: pagination.page,
                            pageSize: pagination.pageSize,
                            shown: items.length,
                            total,
                            overall,
                            filtered,
                        })}
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        filters={{}}
                        hrefFor={(target) => adminWineriesHref({ ...filters, page: target })}
                        alwaysShowPager={filtered}
                    />
                </div>
            )}
        </>,
    );
}
