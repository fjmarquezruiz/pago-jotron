import Link from 'next/link';
import type { Metadata } from 'next';
import { AdminErrorScreen } from '@/components/admin/admin-error-screen';
import { BackButton } from '@/components/admin/back-button';
import { SiteHeader } from '@/components/shop/site-header';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Página no encontrada | Pago de Jotrón' };

/**
 * 404 del panel (Figma: admin-error-404). Salta con `notFound()` desde una página del panel y con
 * cualquier ruta que no exista bajo `/admin` (`[...slug]/page.tsx`). Como no pasa por el layout del
 * panel, no lleva menú lateral: es la pantalla de Figma, con la cabecera de la tienda.
 */
export default function AdminNotFound() {
    return (
        <AdminErrorScreen
            header={<SiteHeader />}
            code="404"
            title="Página no encontrada"
            description="La página que buscas no existe, ha sido eliminada o ha cambiado de ubicación de forma permanente."
            actions={
                <>
                    <BackButton />
                    <Button asChild>
                        <Link href="/admin">Ir al panel de control</Link>
                    </Button>
                </>
            }
        />
    );
}
