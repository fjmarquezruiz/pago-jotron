import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CircleAlert, Plus } from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/admin-states';
import { AdminProductsFilters } from '@/components/admin/products/admin-products-filters';
import { AdminProductsTable } from '@/components/admin/products/admin-products-table';
import { OrderHistoryPagination } from '@/components/orders/order-history-pagination';
import { Button } from '@/components/ui/button';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import {
    ADMIN_PRODUCTS_PAGE_SIZE,
    ADMIN_PRODUCTS_PATH,
    adminProductsHref,
    adminProductsRangeText,
    hasAdminProductFilters,
} from '@/lib/admin/products';
import { getSessionUser } from '@/lib/auth/session';
import { getPagination } from '@/lib/catalog/pagination';
import {
    getAdminProductOptions,
    getAdminProductsPage,
    type AdminProductOptions,
    type AdminProductsPage,
} from '@/lib/db/admin-products';
import { parseAdminProductParams } from '@/lib/validations/admin-products';

/** Depende de la sesión y de los filtros de la URL: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Catálogo | Pago de Jotrón' };

const DESCRIPTION =
    'Configura los productos de la finca, asigna denominaciones de origen, controla las existencias de las bodegas y gestiona los precios base.';

/**
 * Listado de productos del panel (Figma: admin-list-template, catalogue-list-filtered,
 * catalogue-list-no-results, admin-list-empty y admin-list-error; CU9). Editor y administrador (el
 * middleware ya lo exige; aquí se vuelve a comprobar con el rol de la BD). Filtros por tipo,
 * denominación, bodega y estado y búsqueda por nombre, todo en la URL; diez por página. Una página
 * que pasa de la última redirige a la última.
 */
export default async function AdminProductsPageRoute({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const user = await getSessionUser();
    if (user === null || !CATALOG_ROLES.some((role) => role === user.role))
        redirect('/acceso-denegado');

    const { page: requested, ...filters } = parseAdminProductParams(searchParams);
    const frame = (children: React.ReactNode) => (
        <AdminPage breadcrumb={[{ label: 'Catálogo' }]} title="Catálogo" description={DESCRIPTION}>
            {children}
        </AdminPage>
    );

    let data: AdminProductsPage;
    let options: AdminProductOptions;
    try {
        [data, options] = await Promise.all([
            getAdminProductsPage({
                page: requested,
                pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
                ...filters,
            }),
            getAdminProductOptions(),
        ]);
    } catch (error) {
        console.error(error);
        return frame(
            <AdminErrorState icon={<CircleAlert />} title="No se puede cargar el catálogo" />,
        );
    }

    const { items, total, overall } = data;
    const filtered = hasAdminProductFilters(filters);
    if (overall === 0)
        return frame(
            <AdminEmptyState
                title="No hay productos en tu catálogo"
                description="Empieza a crear tu catálogo añadiendo tu primer producto."
                action={
                    <Button asChild size="md">
                        <Link href={`${ADMIN_PRODUCTS_PATH}/nuevo`}>
                            <Plus aria-hidden="true" />
                            Añade tu primer producto
                        </Link>
                    </Button>
                }
            />,
        );

    const pagination = getPagination({
        page: requested,
        pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
        total,
    });
    if (pagination.outOfRange)
        redirect(adminProductsHref({ ...filters, page: pagination.totalPages }));

    return frame(
        <>
            <AdminProductsFilters filters={filters} options={options} />
            {items.length === 0 ? (
                <AdminEmptyState
                    title="No se han encontrado resultados"
                    description="Prueba a ajustar o borrar los filtros para encontrar lo que buscas."
                    action={
                        <Button asChild size="md">
                            <Link href={ADMIN_PRODUCTS_PATH}>Limpiar filtros</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="flex flex-col gap-gap-md">
                    <AdminProductsTable rows={items} />
                    <OrderHistoryPagination
                        summary={adminProductsRangeText({
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
                        hrefFor={(target) => adminProductsHref({ ...filters, page: target })}
                        alwaysShowPager={filtered}
                    />
                </div>
            )}
        </>,
    );
}
