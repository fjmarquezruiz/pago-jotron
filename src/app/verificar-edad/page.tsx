import Image from 'next/image';
import type { Metadata } from 'next';
import { AgeGate } from '@/components/auth/age-gate';
import { safeCallbackUrl } from '@/lib/auth/redirect';

export const metadata: Metadata = {
    title: 'Verificar edad | Pago de Jotrón',
};

type Props = { searchParams: { callbackUrl?: string | string[] } };

/** Verificación de edad (RNF3): pública. Tras verificar, vuelve a `callbackUrl` (saneado). */
export default function VerifyAgePage({ searchParams }: Props) {
    const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);

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

                    <AgeGate callbackUrl={callbackUrl} />
                </div>
            </section>
        </main>
    );
}
