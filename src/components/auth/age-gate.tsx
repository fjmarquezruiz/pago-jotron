'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAdult } from '@/lib/auth/age';
import { ageGateFormSchema, toBirthDate, type AgeGateFormInput } from '@/lib/validations/auth';
import { BirthDateSelects } from '@/components/auth/birth-date-selects';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Fieldset } from '@/components/ui/fieldset';

/**
 * Verificación de edad (RNF3): pide la fecha de nacimiento y deja entrar a los mayores de 18.
 * Con una fecha de menor, o al pulsar "Salir", pasa a la pantalla de menores sin salir de la página.
 * La fecha solo viaja a la API, que valida y pone la cookie; aquí no se guarda.
 * @param props.callbackUrl Ruta interna a la que ir tras verificar (ya saneada).
 */
export function AgeGate({ callbackUrl }: { callbackUrl: string }) {
    const router = useRouter();
    const [isMinor, setIsMinor] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AgeGateFormInput>({
        resolver: zodResolver(ageGateFormSchema),
        defaultValues: { birthDay: '', birthMonth: '', birthYear: '' },
    });
    const birthError = errors.birthDay ?? errors.birthMonth ?? errors.birthYear;
    const minorHeadingRef = useRef<HTMLHeadingElement>(null);

    // Al pasar a la pantalla de menores el botón que tenía el foco desaparece: se lleva el foco
    // al título para que el lector de pantalla lo anuncie.
    useEffect(() => {
        if (isMinor) minorHeadingRef.current?.focus();
    }, [isMinor]);

    async function onSubmit(data: AgeGateFormInput) {
        setFormError(null);
        const birthDate = toBirthDate(data.birthDay, data.birthMonth, data.birthYear);
        if (!isAdult(birthDate)) {
            setIsMinor(true);
            return;
        }

        let res: Response;
        try {
            res = await fetch('/api/verificar-edad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ birthDate }),
            });
        } catch {
            setFormError(
                'No se ha podido conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
            );
            return;
        }

        if (res.status === 403) {
            setIsMinor(true);
            return;
        }
        if (!res.ok) {
            const body = (await res.json().catch(() => null)) as { message?: string } | null;
            setFormError(body?.message ?? 'No se ha podido verificar la edad. Inténtalo de nuevo.');
            return;
        }

        router.push(callbackUrl);
        router.refresh();
    }

    if (isMinor) {
        return (
            <>
                <h1
                    ref={minorHeadingRef}
                    tabIndex={-1}
                    className="w-full text-center text-xl leading-7 font-normal text-foreground outline-none"
                >
                    Lo sentimos
                </h1>
                <p role="status" className="w-full text-center text-sm text-muted-foreground">
                    Vuelve cuando tengas 18 años
                </p>
                <div className="flex w-full items-start gap-6">
                    <Button
                        type="button"
                        size="lg"
                        className="min-w-px flex-1"
                        onClick={() => {
                            reset();
                            setIsMinor(false);
                        }}
                    >
                        Volver
                    </Button>
                </div>
            </>
        );
    }

    return (
        <>
            <h1 className="w-full text-center text-xl leading-7 font-normal text-foreground">
                ¿Tienes edad legal para beber?
            </h1>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex w-full flex-col items-center gap-12"
                noValidate
            >
                <Fieldset
                    aria-label="Fecha de nacimiento"
                    invalid={!!birthError}
                    helper={birthError?.message}
                    className="w-full"
                >
                    <BirthDateSelects control={control} showLabels />
                </Fieldset>

                <p className="w-full text-center text-sm text-muted-foreground">
                    ¡Hola! Antes de explorar nuestra selección de vinos, por favor confirma que
                    tienes la edad legal para beber en tu país. ¡Salud y disfruta!
                </p>

                {formError && <Alert type="error">{formError}</Alert>}

                <div className="flex w-full items-start gap-6">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="min-w-px flex-1"
                        onClick={() => setIsMinor(true)}
                    >
                        Salir
                    </Button>
                    <Button
                        type="submit"
                        variant="brand"
                        size="lg"
                        loading={isSubmitting}
                        className="min-w-px flex-1"
                    >
                        Entrar al sitio
                    </Button>
                </div>

                <p className="w-full text-center text-sm text-muted-foreground">
                    Bebe con moderación
                </p>
            </form>
        </>
    );
}
