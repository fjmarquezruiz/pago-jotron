import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AdminDenominationForm } from '@/components/admin/denominations/admin-denomination-form';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { parseCatalogId } from '@/lib/admin/catalog-api';
import { DENOMINATION_WINERIES_PAGE_SIZE, denominationHref } from '@/lib/admin/denominations';
import { getSessionUser } from '@/lib/auth/session';
import { getPagination } from '@/lib/catalog/pagination';
import { getAdminDenomination, getDenominationWineriesPage } from '@/lib/db/admin-denominations';
import { parseRelatedPage } from '@/lib/validations/admin-denominations';

// Depende de la sesión y de los datos del momento: nunca se genera de antemano.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Denominación de origen | Pago de Jotrón' };

/**
 * Ficha y edición de una denominación de origen (Figma: denominations-detail; CU9), con sus bodegas
 * relacionadas paginadas (`?pagina=`). Editor y administrador; el interruptor de Estado solo lo ve
 * el administrador. Una denominación que no existe responde 404; una página que pasa de la última
 * redirige a la última.
 */
export default async function AdminDenominationPage({
    params,
    searchParams,
}: {
    params: { id: string };
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const user = await getSessionUser();
    if (user === null || !CATALOG_ROLES.some((role) => role === user.role))
        redirect('/acceso-denegado');

    const id = parseCatalogId(params.id);
    if (id === null) notFound();
    const data = await getAdminDenomination(id);
    if (data === null) notFound();

    const requested = parseRelatedPage(searchParams);
    const wineries = await getDenominationWineriesPage(
        id,
        requested,
        DENOMINATION_WINERIES_PAGE_SIZE,
    );
    const pagination = getPagination({
        page: requested,
        pageSize: DENOMINATION_WINERIES_PAGE_SIZE,
        total: wineries.total,
    });
    if (pagination.outOfRange)
        redirect(
            pagination.page > 1
                ? `${denominationHref(id)}?pagina=${pagination.page}`
                : denominationHref(id),
        );

    return (
        <AdminDenominationForm
            data={data}
            canBlock={user.role === 'Administrador'}
            related={{
                items: wineries.items,
                total: wineries.total,
                page: pagination.page,
                totalPages: pagination.totalPages,
                pageSize: pagination.pageSize,
            }}
        />
    );
}
