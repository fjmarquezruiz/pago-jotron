import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CircleAlert, HouseHeart, Plus } from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/admin-states';
import { AdminDenominationsFilters } from '@/components/admin/denominations/admin-denominations-filters';
import { AdminDenominationsTable } from '@/components/admin/denominations/admin-denominations-table';
import { OrderHistoryPagination } from '@/components/orders/order-history-pagination';
import { Button } from '@/components/ui/button';
import {
    ADMIN_DENOMINATIONS_PAGE_SIZE,
    ADMIN_DENOMINATIONS_PATH,
    ADMIN_DENOMINATION_NEW_PATH,
    adminDenominationsHref,
    adminDenominationsRangeText,
    hasAdminDenominationFilters,
} from '@/lib/admin/denominations';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { getSessionUser } from '@/lib/auth/session';
import { getPagination } from '@/lib/catalog/pagination';
import {
    getAdminDenominationsPage,
    getAdminDenominationRegions,
    type AdminDenominationsPage,
} from '@/lib/db/admin-denominations';
import { parseAdminDenominationParams } from '@/lib/validations/admin-denominations';

/** Depende de la sesión y de los filtros de la URL: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Denominaciones de origen | Pago de Jotrón' };

const DESCRIPTION =
    'Gestiona los consejos reguladores, las regiones geográficas y los límites de las denominaciones.';

/**
 * Listado de denominaciones de origen del panel (Figma: denominations-list y
 * denominations-empty; CU9). Editor y
 * administrador (el middleware ya lo exige; aquí se vuelve a comprobar con el rol de la BD).
 * Filtro por región y búsqueda por nombre en la URL; diez por página. Una página que pasa de la
 * última redirige a la última.
 */
export default async function AdminDenominationsPageRoute({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const user = await getSessionUser();
    if (user === null || !CATALOG_ROLES.some((role) => role === user.role))
        redirect('/acceso-denegado');

    const { page: requested, ...filters } = parseAdminDenominationParams(searchParams);
    const frame = (children: React.ReactNode) => (
        <AdminPage
            breadcrumb={[{ label: 'Denominaciones de origen' }]}
            title="Denominaciones de origen"
            description={DESCRIPTION}
        >
            {children}
        </AdminPage>
    );

    let data: AdminDenominationsPage;
    let regions: string[];
    try {
        [data, regions] = await Promise.all([
            getAdminDenominationsPage({
                page: requested,
                pageSize: ADMIN_DENOMINATIONS_PAGE_SIZE,
                ...filters,
            }),
            getAdminDenominationRegions(),
        ]);
    } catch (error) {
        console.error(error);
        return frame(
            <AdminErrorState
                icon={<CircleAlert />}
                title="Algo ha salido mal"
                description="No se han podido cargar los datos de las denominaciones. Puede tratarse de un problema temporal."
            />,
        );
    }

    const { items, total, overall } = data;
    const filtered = hasAdminDenominationFilters(filters);
    if (overall === 0)
        return frame(
            <AdminEmptyState
                icon={<HouseHeart />}
                title="No hay denominaciones registradas"
                description="Registra tu primera denominación geográfica de origen para vincular vinos, regular la distribución de uvas y definir mapas geográficos."
                action={
                    <Button asChild size="md">
                        <Link href={ADMIN_DENOMINATION_NEW_PATH}>
                            <Plus aria-hidden="true" />
                            Añadir la primera denominación
                        </Link>
                    </Button>
                }
            />,
        );

    const pagination = getPagination({
        page: requested,
        pageSize: ADMIN_DENOMINATIONS_PAGE_SIZE,
        total,
    });
    if (pagination.outOfRange)
        redirect(adminDenominationsHref({ ...filters, page: pagination.totalPages }));

    return frame(
        <>
            <AdminDenominationsFilters filters={filters} regions={regions} />
            {items.length === 0 ? (
                <AdminEmptyState
                    icon={<HouseHeart />}
                    title="Ninguna denominación coincide con los filtros"
                    description="Prueba con otros filtros o límpialos para ver todas las denominaciones."
                    action={
                        <Button asChild variant="outline" size="md">
                            <Link href={ADMIN_DENOMINATIONS_PATH}>Limpiar todo</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="flex flex-col gap-gap-md">
                    <AdminDenominationsTable rows={items} />
                    <OrderHistoryPagination
                        summary={adminDenominationsRangeText({
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
                        hrefFor={(target) => adminDenominationsHref({ ...filters, page: target })}
                        alwaysShowPager={filtered}
                    />
                </div>
            )}
        </>,
    );
}
