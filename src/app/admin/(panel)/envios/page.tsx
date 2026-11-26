import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminErrorState } from '@/components/admin/admin-states';
import { ShippingTypesView } from '@/components/admin/shipping/shipping-types-view';
import { getSessionUser } from '@/lib/auth/session';
import { getAdminShippingTypes, type AdminShippingTypeRow } from '@/lib/db/admin-shipping';

/** Depende de la sesión: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Tipos de envío | Pago de Jotrón' };

/**
 * Listado de tipos de envío del panel (Figma: admin-shipping-types-list; CU13). Solo el
 * administrador (el middleware ya lo exige; aquí se vuelve a comprobar con el rol de la BD). Sin
 * filtros ni paginación: son pocos.
 */
export default async function AdminShippingTypesPageRoute() {
    const user = await getSessionUser();
    if (user === null || user.role !== 'Administrador') redirect('/acceso-denegado');

    const frame = (children: React.ReactNode) => (
        <AdminPage
            breadcrumb={[{ label: 'Tipos de envío' }]}
            title="Tipos de envío"
            description="Opciones de envío que ve el cliente en el checkout. Solo enviamos dentro de España peninsular."
        >
            {children}
        </AdminPage>
    );

    let rows: AdminShippingTypeRow[];
    try {
        rows = await getAdminShippingTypes();
    } catch (error) {
        console.error(error);
        return frame(
            <AdminErrorState
                icon={<CircleAlert />}
                title="No se han podido cargar los tipos de envío"
            />,
        );
    }

    return frame(<ShippingTypesView rows={rows} />);
}
