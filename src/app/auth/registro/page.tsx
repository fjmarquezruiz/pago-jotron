import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { safeCallbackUrl } from '@/lib/auth/redirect';
import { authOptions } from '@/lib/auth-options';

export const metadata: Metadata = {
    title: 'Crear cuenta | Pago de Jotrón',
};

type Props = { searchParams: { callbackUrl?: string | string[] } };

/** Pantalla de registro. Si ya hay sesión, redirige a `callbackUrl` (saneado). */
export default async function RegisterPage({ searchParams }: Props) {
    const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);
    const session = await getServerSession(authOptions);
    if (session) redirect(callbackUrl);

    return (
        <AuthShell image="/images/auth/register-bg.png">
            <div className="flex w-full flex-col items-center gap-3">
                <h1 className="w-full text-center text-xl leading-7 font-normal text-foreground">
                    Crea tu cuenta
                </h1>
                <p className="w-full text-center text-sm text-muted-foreground">
                    Únete a nuestra comunidad de vino
                </p>
            </div>

            <RegisterForm callbackUrl={callbackUrl} />
        </AuthShell>
    );
}
