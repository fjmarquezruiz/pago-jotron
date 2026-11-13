import type { Metadata } from 'next';
import { AgeGate } from '@/components/auth/age-gate';
import { AuthShell } from '@/components/auth/auth-shell';
import { safeCallbackUrl } from '@/lib/auth/redirect';

export const metadata: Metadata = {
    title: 'Verificar edad | Pago de Jotrón',
};

type Props = { searchParams: { callbackUrl?: string | string[] } };

/** Verificación de edad (RNF3): pública. Tras verificar, vuelve a `callbackUrl` (saneado). */
export default function VerifyAgePage({ searchParams }: Props) {
    const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);

    return (
        <AuthShell image="/images/auth/acceso-denegado-bg.jpg">
            <AgeGate callbackUrl={callbackUrl} />
        </AuthShell>
    );
}
