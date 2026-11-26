import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminErrorState } from '@/components/admin/admin-states';
import { GrapesView } from '@/components/admin/grapes/grapes-view';
import { OrderHistoryPagination } from '@/components/orders/order-history-pagination';
import {
    ADMIN_GRAPES_PAGE_SIZE,
    adminGrapesHref,
    adminGrapesRangeText,
    hasAdminGrapeFilters,
} from '@/lib/admin/grapes';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { getSessionUser } from '@/lib/auth/session';
import { getPagination } from '@/lib/catalog/pagination';
import { getAdminGrapesPage, type AdminGrapesPage } from '@/lib/db/admin-grapes';
import { parseAdminGrapeParams } from '@/lib/validations/admin-grapes';

/** Depende de la sesión y de los filtros de la URL: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Variedades de uva | Pago de Jotrón' };

/**
 * Listado de variedades de uva del panel (Figma: grape-varieties-list, grape-varieties-empty y
 * admin-list-error; CU9). Editor y Administrador (el middleware ya lo exige; aquí se vuelve a
 * comprobar con el rol de la BD). Filtro por color y búsqueda por nombre en la URL; diez por
 * página. Una página que pasa de la última redirige a la última.
 */
export default async function AdminGrapesPageRoute({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const user = await getSessionUser();
    if (user === null || !(CATALOG_ROLES as readonly string[]).includes(user.role))
        redirect('/acceso-denegado');

    const { page: requested, ...filters } = parseAdminGrapeParams(searchParams);
    const frame = (children: React.ReactNode) => (
        <AdminPage
            breadcrumb={[{ label: 'Variedades de uva' }]}
            title="Variedades de uva"
            description="Catálogo de variedades de uva."
        >
            {children}
        </AdminPage>
    );

    let data: AdminGrapesPage;
    try {
        data = await getAdminGrapesPage({
            page: requested,
            pageSize: ADMIN_GRAPES_PAGE_SIZE,
            ...filters,
        });
    } catch (error) {
        console.error(error);
        return frame(
            <AdminErrorState
                icon={<CircleAlert />}
                title="No se han podido cargar las variedades de uva"
            />,
        );
    }

    const { items, total, overall } = data;
    const pagination = getPagination({ page: requested, pageSize: ADMIN_GRAPES_PAGE_SIZE, total });
    if (items.length === 0 && total > 0 && pagination.outOfRange)
        redirect(adminGrapesHref({ ...filters, page: pagination.totalPages }));

    return frame(
        <GrapesView
            rows={items}
            filters={filters}
            overall={overall}
            footer={
                <OrderHistoryPagination
                    summary={adminGrapesRangeText({
                        page: pagination.page,
                        pageSize: pagination.pageSize,
                        shown: items.length,
                        total,
                        overall,
                        filtered: hasAdminGrapeFilters(filters),
                    })}
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    filters={{}}
                    hrefFor={(target) => adminGrapesHref({ ...filters, page: target })}
                    alwaysShowPager={hasAdminGrapeFilters(filters)}
                />
            }
        />,
    );
}
