'use client';

import { forwardRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { registerFormSchema, toBirthDate, type RegisterFormInput } from '@/lib/validations/auth';
import { BirthDateSelects } from '@/components/auth/birth-date-selects';
import { Alert } from '@/components/ui/alert';
import { Button, IconButton } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Field,
    FieldControl,
    FieldDescription,
    FieldLabel,
    FieldMessage,
} from '@/components/ui/field';
import { Fieldset } from '@/components/ui/fieldset';
import { HelperText } from '@/components/ui/helper-text';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextLink } from '@/components/ui/link';

const PASSWORD_HINT = 'Mínimo 8 caracteres, con mayúscula, minúscula y número.';

/** Campos que la API puede devolver en `errors` y que existen en el formulario. */
const API_FIELDS = ['email', 'password', 'birthDate', 'acceptPrivacy'] as const;

/**
 * Campo del formulario donde se pinta el error de cada campo de la API.
 * La fecha de nacimiento es un solo campo en la API, pero tres desplegables en pantalla:
 * el error se muestra bajo el grupo (`birthDay` es el primero que se busca en `birthError`).
 */
const API_FIELD_TO_FORM_FIELD = {
    email: 'email',
    password: 'password',
    birthDate: 'birthDay',
    acceptPrivacy: 'acceptPrivacy',
} as const satisfies Record<(typeof API_FIELDS)[number], keyof RegisterFormInput>;

/** Respuesta de error de `POST /api/auth/registro`. */
type RegisterErrorResponse = {
    message?: string;
    errors?: Partial<Record<(typeof API_FIELDS)[number], string[]>>;
};

/**
 * Campo de contraseña con botón para mostrarla u ocultarla.
 * Usa `forwardRef` para que React Hook Form (`register`) pueda leer el valor con React 18.
 */
const PasswordInput = forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
    (props, ref) => {
        const [visible, setVisible] = useState(false);
        return (
            <Input
                type={visible ? 'text' : 'password'}
                placeholder="••••••••••••"
                {...props}
                ref={ref}
                endIcon={
                    <IconButton
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setVisible((v) => !v)}
                        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="mr-0.75"
                    >
                        {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </IconButton>
                }
            />
        );
    },
);
PasswordInput.displayName = 'PasswordInput';

/**
 * Formulario de alta de cliente (RF2): email, contraseña, fecha de nacimiento y aceptación legal.
 * Si el alta va bien, inicia sesión y redirige a `callbackUrl`.
 * @param props.callbackUrl Ruta interna a la que ir tras registrarse (ya saneada).
 */
export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
    const router = useRouter();
    const [formError, setFormError] = useState<string | null>(null);
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormInput>({
        resolver: zodResolver(registerFormSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            birthDay: '',
            birthMonth: '',
            birthYear: '',
            acceptPrivacy: false,
        },
    });
    /** El botón solo se activa cuando se aceptan las condiciones (decisión de diseño). */
    const acceptedTerms = useWatch({ control, name: 'acceptPrivacy' });

    const birthError = errors.birthDay ?? errors.birthMonth ?? errors.birthYear;

    async function onSubmit(data: RegisterFormInput) {
        setFormError(null);

        // confirmPassword solo existe en el formulario: no se envía a la API.

        const payload = {
            email: data.email,
            password: data.password,
            acceptPrivacy: data.acceptPrivacy,
            birthDate: toBirthDate(data.birthDay, data.birthMonth, data.birthYear),
        };
        let res: Response;
        try {
            res = await fetch('/api/auth/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch {
            setFormError(
                'No se ha podido conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
            );
            return;
        }

        if (!res.ok) {
            const body = (await res.json().catch(() => null)) as RegisterErrorResponse | null;

            if (res.status === 409) {
                setError('email', { message: 'Ya existe una cuenta con ese correo' });
                return;
            }
            if (res.status === 400 && body?.errors) {
                let fieldErrorShown = false;
                for (const field of API_FIELDS) {
                    const message = body.errors[field]?.[0];
                    if (message) {
                        setError(API_FIELD_TO_FORM_FIELD[field], { message });
                        fieldErrorShown = true;
                    }
                }
                // Si la API no señaló ningún campo conocido, se cae al aviso general.
                if (fieldErrorShown) return;
            }
            setFormError(body?.message ?? 'No se ha podido crear la cuenta. Inténtalo de nuevo.');
            return;
        }

        const login = await signIn('credentials', {
            email: payload.email,
            password: payload.password,
            redirect: false,
        });
        if (!login || login.error) {
            // La cuenta existe, pero el login automático falló: que entre a mano.
            router.push('/auth/login');
            return;
        }
        router.push(callbackUrl);
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-12" noValidate>
            <div className="flex w-full flex-col gap-6">
                <Field id="email" invalid={!!errors.email}>
                    <FieldLabel>Correo electrónico</FieldLabel>
                    <FieldControl>
                        <Input
                            type="email"
                            autoComplete="email"
                            placeholder="juan.moreno@ejemplo.com"
                            {...register('email')}
                        />
                    </FieldControl>
                    <FieldMessage>{errors.email?.message}</FieldMessage>
                </Field>

                <Field id="password" invalid={!!errors.password}>
                    <FieldLabel>Contraseña</FieldLabel>
                    <FieldControl>
                        <PasswordInput autoComplete="new-password" {...register('password')} />
                    </FieldControl>
                    <FieldDescription>{PASSWORD_HINT}</FieldDescription>
                    <FieldMessage>{errors.password?.message}</FieldMessage>
                </Field>

                <Field id="confirmPassword" invalid={!!errors.confirmPassword}>
                    <FieldLabel>Repetir contraseña</FieldLabel>
                    <FieldControl>
                        <PasswordInput
                            autoComplete="new-password"
                            {...register('confirmPassword')}
                        />
                    </FieldControl>
                    <FieldMessage>{errors.confirmPassword?.message}</FieldMessage>
                </Field>

                <Fieldset
                    legend="Fecha de nacimiento"
                    invalid={!!birthError}
                    helper={birthError?.message}
                >
                    <BirthDateSelects control={control} />
                </Fieldset>

                <div className="flex flex-col gap-2">
                    <div className="flex min-h-6 items-start gap-2">
                        <Controller
                            control={control}
                            name="acceptPrivacy"
                            render={({ field }) => (
                                <Checkbox
                                    id="acceptPrivacy"
                                    ref={field.ref}
                                    checked={field.value}
                                    onCheckedChange={(checked) => field.onChange(checked === true)}
                                    onBlur={field.onBlur}
                                    aria-invalid={!!errors.acceptPrivacy || undefined}
                                    aria-describedby={
                                        errors.acceptPrivacy ? 'acceptPrivacy-error' : undefined
                                    }
                                />
                            )}
                        />
                        <Label htmlFor="acceptPrivacy" className="block flex-1 text-sm leading-5">
                            He leído y acepto las{' '}
                            <TextLink asChild>
                                <Link href="/condiciones">Condiciones Generales</Link>
                            </TextLink>
                            , la{' '}
                            <TextLink asChild>
                                <Link href="/privacidad">Política de Privacidad</Link>
                            </TextLink>{' '}
                            y la{' '}
                            <TextLink asChild>
                                <Link href="/cookies">Política de Cookies</Link>
                            </TextLink>
                            .
                        </Label>
                    </div>
                    {errors.acceptPrivacy?.message && (
                        <HelperText
                            id="acceptPrivacy-error"
                            type="error"
                            showIcon
                            size="md"
                            role="alert"
                        >
                            {errors.acceptPrivacy.message}
                        </HelperText>
                    )}
                </div>
            </div>

            {formError && <Alert type="error">{formError}</Alert>}

            <Button
                type="submit"
                loading={isSubmitting}
                size="lg"
                variant="brand"
                className="w-full"
                disabled={!acceptedTerms}
            >
                Crear cuenta
            </Button>

            <p className="flex items-start justify-center gap-1 text-sm text-muted-foreground">
                ¿Ya tienes cuenta?
                <TextLink asChild>
                    <Link href="/auth/login">Iniciar sesión</Link>
                </TextLink>
            </p>
        </form>
    );
}
