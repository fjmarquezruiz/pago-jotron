import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CircleAlert, Users } from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/admin-states';
import { AdminUsersFilters } from '@/components/admin/users/admin-users-filters';
import { AdminUsersTable } from '@/components/admin/users/admin-users-table';
import { OrderHistoryPagination } from '@/components/orders/order-history-pagination';
import { Button } from '@/components/ui/button';
import {
    ADMIN_USERS_PAGE_SIZE,
    ADMIN_USERS_PATH,
    adminUsersHref,
    adminUsersRangeText,
    hasAdminUserFilters,
} from '@/lib/admin/users';
import { getSessionUser } from '@/lib/auth/session';
import { getPagination } from '@/lib/catalog/pagination';
import { getAdminUsersPage, type AdminUsersPage } from '@/lib/db/admin-users';
import { parseAdminUserParams } from '@/lib/validations/admin-users';

/** Depende de la sesión y de los filtros de la URL: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Usuarios | Pago de Jotrón' };

const DESCRIPTION =
    'Gestiona los clientes registrados, los administradores del sistema y los permisos del equipo de sumilleres.';

/**
 * Listado de usuarios del panel (Figma: users-list, users-list-filtered y users-empty; CU12). Solo
 * el administrador (el middleware ya lo exige; aquí se vuelve a comprobar con el rol de la BD).
 * Filtros por rol y estado y búsqueda por nombre o correo, todo en la URL; diez por página. Una
 * página que pasa de la última redirige a la última.
 */
export default async function AdminUsersPageRoute({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const user = await getSessionUser();
    if (user === null || user.role !== 'Administrador') redirect('/acceso-denegado');

    const { page: requested, ...filters } = parseAdminUserParams(searchParams);
    const frame = (children: React.ReactNode) => (
        <AdminPage breadcrumb={[{ label: 'Usuarios' }]} title="Usuarios" description={DESCRIPTION}>
            {children}
        </AdminPage>
    );

    let data: AdminUsersPage;
    try {
        data = await getAdminUsersPage({
            page: requested,
            pageSize: ADMIN_USERS_PAGE_SIZE,
            ...filters,
        });
    } catch (error) {
        console.error(error);
        return frame(
            <AdminErrorState
                icon={<CircleAlert />}
                title="No se han podido cargar los usuarios"
                description="Se ha producido un problema al conectar con el servidor de la base de datos. Comprueba tu conexión o contacta con un administrador."
            />,
        );
    }

    const { items, total, overall } = data;
    const filtered = hasAdminUserFilters(filters);
    if (overall === 0)
        return frame(
            <AdminEmptyState
                icon={<Users />}
                title="Todavía no hay usuarios"
                description="Aquí aparecerán los usuarios que creen una cuenta en la tienda."
            />,
        );

    const pagination = getPagination({ page: requested, pageSize: ADMIN_USERS_PAGE_SIZE, total });
    if (pagination.outOfRange)
        redirect(adminUsersHref({ ...filters, page: pagination.totalPages }));

    return frame(
        <>
            <AdminUsersFilters filters={filters} />
            {items.length === 0 ? (
                <AdminEmptyState
                    icon={<Users />}
                    title="Ningún usuario coincide con los filtros"
                    description="Prueba con otros filtros o límpialos para ver todos los usuarios."
                    action={
                        <Button asChild variant="outline" size="md">
                            <Link href={ADMIN_USERS_PATH}>Limpiar todo</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="flex flex-col gap-gap-md">
                    <AdminUsersTable rows={items} />
                    <OrderHistoryPagination
                        summary={adminUsersRangeText({
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
                        hrefFor={(target) => adminUsersHref({ ...filters, page: target })}
                        alwaysShowPager={filtered}
                    />
                </div>
            )}
        </>,
    );
}
