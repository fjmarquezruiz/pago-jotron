import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/shop/site-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Finalizar compra | Pago de Jotrón' };

/**
 * Marcador de "Finalizar compra" hasta que llegue el checkout (A9: Datos, Pago y Confirmar).
 * Existe para que "Continuar" del carrito no acabe en un 404: el cliente con sesión llega aquí y
 * el que no la tiene pasa antes por `/auth/login?callbackUrl=/checkout` (el middleware protege la
 * ruta, que no es pública). Su carrito sigue intacto y tiene un enlace para volver a él.
 *
 * Sin diseño en Figma: es el `EmptyState` del sistema de diseño tal cual. Hay que sustituirlo por
 * el checkout real.
 */
export default function CheckoutPage() {
    return (
        <>
            <SiteHeader />
            <main className="px-6 py-16 lg:py-40">
                <div className="mx-auto w-full max-w-9xl">
                    <EmptyState
                        titleAs="h1"
                        title="Próximamente"
                        description="Todavía no se puede finalizar la compra. Tus productos siguen en el carrito."
                        action={
                            <Button asChild variant="brand">
                                <Link href="/carrito">Volver al carrito</Link>
                            </Button>
                        }
                    />
                </div>
            </main>
        </>
    );
}
