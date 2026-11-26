import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AdminWineryForm } from '@/components/admin/wineries/admin-winery-form';
import { parseCatalogId } from '@/lib/admin/catalog-api';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { getSessionUser } from '@/lib/auth/session';
import { getAdminWinery } from '@/lib/db/admin-wineries';

// Depende de la sesión y de los datos del momento: nunca se genera de antemano.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Bodega | Pago de Jotrón' };

/**
 * Ficha y edición de una bodega (Figma: admin-entity-detail y wineries-detail-empty; CU9). Editor y
 * administrador; el interruptor de Estado solo lo ve el administrador. Una bodega que no existe
 * responde 404.
 */
export default async function AdminWineryPage({ params }: { params: { id: string } }) {
    const user = await getSessionUser();
    if (user === null || !CATALOG_ROLES.some((role) => role === user.role))
        redirect('/acceso-denegado');

    const id = parseCatalogId(params.id);
    if (id === null) notFound();
    const data = await getAdminWinery(id);
    if (data === null) notFound();

    return <AdminWineryForm data={data} canBlock={user.role === 'Administrador'} />;
}
