'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/ui/button';
import { Field } from '../ui/field';
import { FieldControl } from '../ui/field';
import { FieldLabel } from '../ui/field';
import { FieldMessage } from '../ui/field';
import { TextLink } from '../ui/link';
import { Alert } from '../ui/alert';

/** Formulario de acceso con email, contraseña, y enlace de recuperación. */
export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

    async function onSubmit(data: LoginInput) {
        setError(null);
        const res = await signIn('credentials', { ...data, redirect: false });
        if (!res || res.error) {
            setError('Email o contraseña incorrectos');
            return;
        }
        router.push(callbackUrl);
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-12" noValidate>
            <div className="grid w-full grid-cols-2 gap-6">
                <Field id="email" className="col-span-2" invalid={!!errors.email}>
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

                <Field id="password" className="col-span-2" invalid={!!errors.password}>
                    <FieldLabel>Contraseña</FieldLabel>
                    <FieldControl>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="••••••••••••"
                            {...register('password')}
                            endIcon={
                                <IconButton
                                    type="button"
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={
                                        showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                                    }
                                    className="-mr-1.5"
                                >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </IconButton>
                            }
                        />
                    </FieldControl>
                    <FieldMessage>{errors.password?.message}</FieldMessage>
                </Field>

                <div className="col-span-2 flex min-h-6 items-center justify-self-end">
                    <TextLink href="/auth/recuperar">¿Olvidaste tu contraseña?</TextLink>
                </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <Button
                type="submit"
                loading={isSubmitting}
                size="lg"
                variant="brand"
                className="w-full"
            >
                Iniciar sesión
            </Button>

            <p className="flex items-start justify-center gap-1 text-sm leading-5 text-muted-foreground">
                ¿No tienes cuenta?
                <TextLink href="/auth/registro">Crea una</TextLink>
            </p>
        </form>
    );
}
