import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { getSessionUser } from '@/lib/auth/session';

/** Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

/**
 * Layout del panel de administración (RF13): el menú lateral según el rol. El middleware ya manda
 * al login a quien no tiene sesión y deniega al cliente; aquí se vuelve a comprobar en el servidor
 * (RNF3), y además una cuenta desactivada no entra aunque su JWT siga vigente (`getSessionUser`).
 * Cada página repite la comprobación: un layout no se vuelve a ejecutar al navegar entre páginas.
 *
 * El grupo `(panel)` deja fuera de este layout las pantallas de error de `src/app/admin`, que
 * llevan la cabecera de la tienda en vez del menú.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = await getSessionUser();
    if (user === null || user.role === 'Cliente') redirect('/acceso-denegado');
    return <AdminShell role={user.role}>{children}</AdminShell>;
}
