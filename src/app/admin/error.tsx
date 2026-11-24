'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AdminErrorScreen } from '@/components/admin/admin-error-screen';
import { SiteHeaderView } from '@/components/shop/site-header-view';
import { Button } from '@/components/ui/button';

/**
 * 500 del panel (Figma: admin-error-500): salta cuando falla una página o el layout del panel. Es
 * un componente cliente, así que usa `SiteHeaderView` (la presentación de la cabecera) y no lee la
 * sesión: a `/admin` solo entran editores y administradores, por eso va con sesión y el enlace
 * «Panel». Sin «Contactar con soporte»: no hay página de soporte a la que llevar.
 *
 * @param props.error - El error; el servidor ya lo registró (aquí llega sin el mensaje, con un `digest`).
 */
export default function AdminError({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        console.error('Error en el panel de administración', error);
    }, [error]);

    return (
        <AdminErrorScreen
            header={<SiteHeaderView signedIn role="Editor" />}
            code="500"
            title="Error interno del servidor"
            description="Se ha producido un error por nuestra parte. Nuestro equipo de desarrollo ha recibido el aviso y está trabajando en una solución. Vuelve a intentarlo en unos instantes."
            actions={
                <Button asChild>
                    <Link href="/admin">Ir al panel de control</Link>
                </Button>
            }
        />
    );
}
