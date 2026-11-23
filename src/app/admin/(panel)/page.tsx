import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminDashboard } from '@/components/admin/dashboard';
import { getSessionUser } from '@/lib/auth/session';
import {
    getCatalogStats,
    getOrderStats,
    getRecentActivity,
    getRecentOrders,
    getTopSellingWines,
} from '@/lib/db/admin-dashboard';

/** Depende de la sesión y de los datos del momento: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Panel de control | Pago de Jotrón' };

/**
 * Panel de control (Figma: admin-dashboard y admin-dashboard - editor, RF13). El administrador ve
 * las cifras de catálogo y de pedidos, los pedidos recientes, los vinos más vendidos y la actividad
 * reciente. El editor, solo lo de catálogo: los datos de pedidos y del registro ni se leen, porque
 * su rol no puede abrir esas secciones (RNF3).
 */
export default async function AdminDashboardPage() {
    const user = await getSessionUser();
    if (user === null || user.role === 'Cliente') redirect('/acceso-denegado');

    const isAdmin = user.role === 'Administrador';
    const now = new Date();

    const [catalog, topSelling, orders] = await Promise.all([
        getCatalogStats(),
        getTopSellingWines(now),
        isAdmin
            ? Promise.all([getOrderStats(now), getRecentOrders(), getRecentActivity()]).then(
                  ([stats, recent, activity]) => ({ stats, recent, activity }),
              )
            : undefined,
    ]);

    return (
        <AdminPage
            breadcrumb={[{ label: 'Panel de control' }]}
            title="Panel de control"
            description="Resumen de las operaciones de tu bodega"
        >
            <AdminDashboard isAdmin={isAdmin} data={{ catalog, topSelling, orders }} now={now} />
        </AdminPage>
    );
}
