import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminDenominationForm } from '@/components/admin/denominations/admin-denomination-form';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { getSessionUser } from '@/lib/auth/session';

// Depende de la sesión: nunca se genera de antemano.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Nueva denominación | Pago de Jotrón' };

/**
 * Alta de una denominación de origen (Figma: denominations-create; CU9). Editor y administrador;
 * aquí se vuelve a comprobar el rol con la BD.
 */
export default async function NewDenominationPage() {
    const user = await getSessionUser();
    if (user === null || !CATALOG_ROLES.some((role) => role === user.role))
        redirect('/acceso-denegado');
    return <AdminDenominationForm />;
}
