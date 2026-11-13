import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Acceso denegado | Pago de Jotrón',
};

/** Destino del middleware cuando el rol de la sesión no basta para entrar en una página (RF1). */
export default function AccessDeniedPage() {
    return (
        <main className="flex min-h-screen w-full items-stretch bg-background">
            <div className="relative hidden min-w-px flex-1 p-2 md:flex">
                <div className="relative w-full overflow-hidden rounded">
                    <Image
                        src="/images/auth/acceso-denegado-bg.jpg"
                        alt=""
                        fill
                        priority
                        sizes="50vw"
                        className="object-cover"
                    />
                    <div className="to-black/40 absolute inset-0 bg-linear-to-l from-transparent" />
                </div>
            </div>

            <section className="flex min-w-px flex-1 flex-col items-center justify-center bg-background p-6 md:p-14">
                <div className="flex w-full max-w-md flex-col items-center gap-12">
                    <Image
                        src="/images/auth/logo-pago-de-jotron.svg"
                        alt="Pago de Jotrón"
                        width={230}
                        height={32}
                        priority
                        className="h-8 w-57.5"
                    />

                    <h1 className="w-full text-center text-xl leading-7 font-normal text-foreground">
                        Acceso denegado
                    </h1>

                    <p className="w-full text-center text-sm text-muted-foreground">
                        No tienes permiso para acceder a esta página.
                    </p>

                    <div className="flex w-full items-start gap-6">
                        <Button asChild size="lg" className="min-w-px flex-1">
                            <Link href="/">Volver a la portada</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
