import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminErrorState } from '@/components/admin/admin-states';
import { TypologiesView } from '@/components/admin/typologies/typologies-view';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { adminTypologiesRangeText, hasAdminTypologyFilters } from '@/lib/admin/typologies';
import { getSessionUser } from '@/lib/auth/session';
import { getAdminTypologies, type AdminTypologiesList } from '@/lib/db/admin-typologies';
import { parseAdminTypologyParams } from '@/lib/validations/admin-typologies';

/** Depende de la sesión y de los filtros de la URL: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Tipologías | Pago de Jotrón' };

/**
 * Listado de tipologías del panel (Figma: typologies-list y admin-list-error; CU9). Editor y
 * Administrador (el middleware ya lo exige; aquí se vuelve a comprobar con el rol de la BD). Filtro
 * por tipo de producto y búsqueda por nombre en la URL; sin paginar, son pocas.
 */
export default async function AdminTypologiesPageRoute({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const user = await getSessionUser();
    if (user === null || !(CATALOG_ROLES as readonly string[]).includes(user.role))
        redirect('/acceso-denegado');

    const filters = parseAdminTypologyParams(searchParams);
    const frame = (children: React.ReactNode) => (
        <AdminPage
            breadcrumb={[{ label: 'Tipologías' }]}
            title="Tipologías"
            description="Tipologías de vino y de pasas. Se usan en la ficha de producto y en los filtros de la tienda."
        >
            {children}
        </AdminPage>
    );

    let data: AdminTypologiesList;
    try {
        data = await getAdminTypologies(filters);
    } catch (error) {
        console.error(error);
        return frame(
            <AdminErrorState
                icon={<CircleAlert />}
                title="No se han podido cargar las tipologías"
            />,
        );
    }

    return frame(
        <TypologiesView
            rows={data.items}
            filters={filters}
            overall={data.overall}
            summary={adminTypologiesRangeText({
                shown: data.items.length,
                overall: data.overall,
                filtered: hasAdminTypologyFilters(filters),
            })}
        />,
    );
}
