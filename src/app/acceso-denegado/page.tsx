import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Acceso denegado | Pago de Jotrón',
};

/** Destino del middleware cuando el rol de la sesión no basta para entrar en una página (RF1). */
export default function AccessDeniedPage() {
    return (
        <AuthShell image="/images/auth/acceso-denegado-bg.jpg">
            <h1 className="w-full text-center text-xl leading-7 font-normal text-foreground">
                Acceso denegado
            </h1>

            <div className="flex w-full flex-col gap-3 text-center text-sm text-muted-foreground">
                <p>No tienes permiso para acceder a esta página.</p>
                <p>Si crees que es un error, habla con el administrador de la bodega.</p>
            </div>

            <div className="flex w-full flex-col gap-6">
                <Button asChild size="lg" className="w-full">
                    <Link href="/">Volver a la portada</Link>
                </Button>
                {/* Enlace normal, no `Link`: /api/auth/signout es una ruta de API, no una página. */}
                <Button asChild variant="outline" size="lg" className="w-full">
                    <a href="/api/auth/signout">Entrar con otra cuenta</a>
                </Button>
            </div>
        </AuthShell>
    );
}
