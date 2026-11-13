import Image from 'next/image';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { safeCallbackUrl } from '@/lib/auth/redirect';
import { authOptions } from '@/lib/auth-options';

export const metadata: Metadata = {
    title: 'Crear cuenta | Pago de Jotrón',
};

type Props = { searchParams: { callbackUrl?: string | string[] } };

/** Pantalla de registro: imagen atmosférica a la izquierda y formulario de alta a la derecha. */
export default async function RegisterPage({ searchParams }: Props) {
    const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);
    const session = await getServerSession(authOptions);
    if (session) redirect(callbackUrl);

    return (
        <main className="flex min-h-screen w-full items-stretch bg-background">
            <div className="relative hidden min-w-px flex-1 md:block">
                <Image
                    src="/images/auth/register-bg.png"
                    alt=""
                    fill
                    priority
                    sizes="50vw"
                    className="object-cover"
                />
                <div className="to-black/40 absolute inset-0 bg-linear-to-l from-transparent" />
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

                    <div className="flex w-full flex-col items-center gap-3">
                        <h1 className="w-full text-center text-xl leading-7 font-normal text-foreground">
                            Crea tu cuenta
                        </h1>
                        <p className="w-full text-center text-sm text-muted-foreground">
                            Únete a nuestra comunidad de vino
                        </p>
                    </div>

                    <RegisterForm callbackUrl={callbackUrl} />
                </div>
            </section>
        </main>
    );
}
