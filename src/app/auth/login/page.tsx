import Image from 'next/image';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { safeCallbackUrl } from '@/lib/auth/redirect';
import { authOptions } from '@/lib/auth-options';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Iniciar sesión | Pago de Jotrón',
};

type Props = { searchParams: { callbackUrl?: string | string[] } };

export default async function LoginPage({ searchParams }: Props) {
    const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);
    const session = await getServerSession(authOptions);
    if (session) redirect(callbackUrl);

    return (
        <main className="flex min-h-screen w-full items-stretch bg-background">
            <div className="relative hidden min-w-px flex-1 md:block">
                <Image
                    src="/images/auth/login-bg.png"
                    alt=""
                    fill
                    priority
                    sizes="50vw"
                    className="object-cover"
                />
                <div className="overlay/60 absolute inset-0 bg-linear-to-l from-transparent" />
            </div>

            <section className="flex min-w-px flex-1 flex-col items-center justify-center bg-background p-6 md:p-14">
                <div className="flex w-full max-w-md flex-col items-center gap-12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Image
                        src="/images/auth/logo-pago-de-jotron.svg"
                        alt="Pago de Jotrón"
                        width={230}
                        height={32}
                        className="h-8 w-57.5"
                    />

                    <div className="flex w-full flex-col items-center gap-3">
                        <h1 className="w-full text-xl leading-7 font-normal text-foreground">
                            Te damos la bienvenida
                        </h1>
                        <p className="w-full text-sm leading-5 text-muted-foreground">
                            Inicia sesión en tu cuenta
                        </p>
                    </div>

                    <LoginForm callbackUrl={callbackUrl} />
                </div>
            </section>
        </main>
    );
}
