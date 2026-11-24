import { getServerSession } from 'next-auth';
import { SiteHeaderView } from '@/components/shop/site-header-view';
import type { AccountSection } from '@/components/account/account-items';
import { authOptions } from '@/lib/auth-options';

/**
 * Cabecera de la tienda (Figma: Menu). Lee la sesión en el servidor y pinta `SiteHeaderView`:
 * con sesión, "Iniciar sesión" pasa a ser "Mi cuenta" y "Cerrar sesión", y un editor o un
 * administrador ve además el enlace "Panel" (RF13).
 *
 * @param props.overlay - `true` para superponerla sobre una imagen oscura (el hero del listado).
 * @param props.accountCurrent - Sección de la cuenta que se marca como actual en el drawer.
 *
 * @example
 * <SiteHeader />
 * <SiteHeader overlay />
 */
export async function SiteHeader({
    overlay = false,
    accountCurrent,
}: {
    overlay?: boolean;
    accountCurrent?: AccountSection;
}) {
    // La sesión se comprueba en el servidor.
    const session = await getServerSession(authOptions);
    return (
        <SiteHeaderView
            signedIn={!!session}
            role={session?.user?.role}
            overlay={overlay}
            accountCurrent={accountCurrent}
        />
    );
}
