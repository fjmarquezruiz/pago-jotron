import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { safeCallbackUrl } from '@/lib/auth/redirect';
import { authOptions } from '@/lib/auth-options';

export const metadata: Metadata = {
    title: 'Iniciar sesión | Pago de Jotrón',
};

type Props = { searchParams: { callbackUrl?: string | string[] } };

/** Pantalla de inicio de sesión. Si ya hay sesión, redirige a `callbackUrl` (saneado). */
export default async function LoginPage({ searchParams }: Props) {
    const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);
    const session = await getServerSession(authOptions);
    if (session) redirect(callbackUrl);

    return (
        <AuthShell image="/images/auth/login-bg.png">
            <div className="flex w-full flex-col items-center gap-3">
                <h1 className="w-full text-center text-xl leading-7 font-normal text-foreground">
                    Te damos la bienvenida
                </h1>
                <p className="w-full text-center text-sm leading-5 text-muted-foreground">
                    Inicia sesión en tu cuenta
                </p>
            </div>

            <LoginForm callbackUrl={callbackUrl} />
        </AuthShell>
    );
}
