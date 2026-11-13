import Image from 'next/image';

export interface AuthShellProps {
    /** Ruta de la imagen del panel izquierdo, dentro de `public/` (por ejemplo `/images/auth/login-bg.png`). */
    image: string;
    /** Contenido del panel derecho, bajo el logo. */
    children: React.ReactNode;
}

/**
 * Estructura común de las pantallas de acceso (Figma: panel de imagen + panel de contenido):
 * imagen con degradado a la izquierda (solo desde `md`) y, a la derecha, el logo con el contenido debajo.
 *
 * @example
 * <AuthShell image="/images/auth/login-bg.png">
 *     <h1>Te damos la bienvenida</h1>
 * </AuthShell>
 */
export function AuthShell({ image, children }: AuthShellProps) {
    return (
        <main className="flex min-h-screen w-full items-stretch bg-background">
            <div className="relative hidden min-w-px flex-1 p-2 md:flex">
                <div className="relative w-full overflow-hidden rounded">
                    <Image src={image} alt="" fill priority sizes="50vw" className="object-cover" />
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
                    {children}
                </div>
            </section>
        </main>
    );
}
