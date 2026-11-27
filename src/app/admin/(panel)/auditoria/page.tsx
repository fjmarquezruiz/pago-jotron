import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CircleAlert, RotateCcw } from 'lucide-react';
import { AdminAuditFilters } from '@/components/admin/audit/admin-audit-filters';
import { AdminAuditTable } from '@/components/admin/audit/admin-audit-table';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/admin-states';
import { OrderHistoryPagination } from '@/components/orders/order-history-pagination';
import { Button } from '@/components/ui/button';
import {
    ADMIN_AUDIT_PAGE_SIZE,
    ADMIN_AUDIT_PATH,
    adminAuditHref,
    adminAuditRangeText,
    hasAdminAuditFilters,
} from '@/lib/admin/audit';
import { getSessionUser } from '@/lib/auth/session';
import { getPagination } from '@/lib/catalog/pagination';
import {
    getAdminAuditPage,
    getAuditUsers,
    type AdminAuditPage,
    type AuditUser,
} from '@/lib/db/admin-audit';
import { parseAdminAuditParams } from '@/lib/validations/admin-audit';

/** Depende de la sesión y de los filtros de la URL: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Registro de actividad | Pago de Jotrón' };

const TITLE = 'Registro de actividad';

/**
 * Registro de actividad del panel (Figma: admin-activity-log; RF12). Solo lectura y solo el
 * administrador (el middleware ya lo exige; aquí se vuelve a comprobar con el rol de la BD).
 * Filtros por fechas, usuario y tipo y búsqueda de texto, todo en la URL; diez por página. Una
 * página que pasa de la última redirige a la última.
 */
export default async function AdminAuditPageRoute({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const user = await getSessionUser();
    if (user === null || user.role !== 'Administrador') redirect('/acceso-denegado');

    const { page: requested, ...filters } = parseAdminAuditParams(searchParams);
    const frame = (children: React.ReactNode) => (
        <AdminPage breadcrumb={[{ label: TITLE }]} title={TITLE}>
            {children}
        </AdminPage>
    );

    let data: AdminAuditPage;
    let users: AuditUser[];
    try {
        [data, users] = await Promise.all([
            getAdminAuditPage({ page: requested, pageSize: ADMIN_AUDIT_PAGE_SIZE, ...filters }),
            getAuditUsers(),
        ]);
    } catch (error) {
        console.error(error);
        return frame(
            <AdminErrorState
                icon={<CircleAlert />}
                title="No se ha podido cargar el registro de actividad"
                description="Se ha producido un problema al conectar con el servidor de la base de datos. Comprueba tu conexión o contacta con un administrador."
            />,
        );
    }

    const { items, total, overall } = data;
    const filtered = hasAdminAuditFilters(filters);
    if (overall === 0)
        return frame(
            <AdminEmptyState
                icon={<RotateCcw />}
                title="Todavía no hay actividad registrada"
                description="Aquí aparecerán los cambios que haga el equipo: pedidos, catálogo, usuarios y envíos."
            />,
        );

    const pagination = getPagination({
        page: requested,
        pageSize: ADMIN_AUDIT_PAGE_SIZE,
        total,
    });
    if (pagination.outOfRange)
        redirect(adminAuditHref({ ...filters, page: pagination.totalPages }));

    return frame(
        <>
            <AdminAuditFilters filters={filters} users={users} />
            {items.length === 0 ? (
                <AdminEmptyState
                    icon={<RotateCcw />}
                    title="Ningún registro coincide con los filtros"
                    description="Prueba con otros filtros o límpialos para ver toda la actividad."
                    action={
                        <Button asChild variant="outline" size="md">
                            <Link href={ADMIN_AUDIT_PATH}>Limpiar todo</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="flex flex-col gap-gap-md">
                    <AdminAuditTable rows={items} />
                    <OrderHistoryPagination
                        summary={adminAuditRangeText({
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
                        hrefFor={(target) => adminAuditHref({ ...filters, page: target })}
                        alwaysShowPager={filtered}
                    />
                </div>
            )}
        </>,
    );
}
