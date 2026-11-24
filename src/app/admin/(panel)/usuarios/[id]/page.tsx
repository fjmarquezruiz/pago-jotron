import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AdminUserDetail } from '@/components/admin/users/admin-user-detail';
import { getSessionUser } from '@/lib/auth/session';
import { getAdminUser } from '@/lib/db/admin-users';
import { MAX_ID } from '@/lib/validations/ids';

// Depende de la sesión y de los datos del momento: nunca se genera de antemano.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Usuario | Pago de Jotrón' };

/** Id de la URL como entero válido, o `null` (la página responde 404). */
function parseUserId(raw: string): number | null {
    const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
    return Number.isSafeInteger(id) && id >= 1 && id <= MAX_ID ? id : null;
}

/**
 * Ficha de un usuario del panel (Figma: user-detail; CU12), en solo lectura. Solo el administrador;
 * aquí se vuelve a comprobar con el rol de la BD. Una cuenta que no existe responde 404.
 */
export default async function AdminUserPage({ params }: { params: { id: string } }) {
    const user = await getSessionUser();
    if (user === null || user.role !== 'Administrador') redirect('/acceso-denegado');

    const userId = parseUserId(params.id);
    if (userId === null) notFound();

    const data = await getAdminUser(userId);
    if (data === null) notFound();

    return <AdminUserDetail data={data} now={new Date()} currentUserId={user.id} />;
}
