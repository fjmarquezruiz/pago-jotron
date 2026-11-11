'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const labelClass = 'text-sm leading-5 font-medium  text-muted-foreground';
const linkClass =
    'border-b border-foreground pb-0.5 text-sm leading-5 font-medium  whitespace-nowrap text-foreground hover:border-b-2';
const errorClass = 'text-destructive text-sm';

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
                <div className="col-span-2 flex flex-col gap-2">
                    <Label htmlFor="email" className={labelClass}>
                        Correo electrónico
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="juan.moreno@ejemplo.com"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        {...register('email')}
                        className="h-10"
                    />
                    {errors.email && (
                        <p id="email-error" role="alert" className={errorClass}>
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div className="col-span-2 flex flex-col gap-2">
                    <Label htmlFor="password" className={labelClass}>
                        Contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="••••••••••••"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? 'password-error' : undefined}
                            {...register('password')}
                            className="placeholder:text-muted-foreground h-10 pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size={'icon'}
                            onClick={() => setShowPassword((showPassword) => !showPassword)}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                        >
                            {showPassword ? (
                                <EyeOff className="size-5" />
                            ) : (
                                <Eye className="size-5" />
                            )}
                        </Button>
                    </div>
                    {errors.password && (
                        <p id="password-error" role="alert" className={errorClass}>
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="col-span-2 flex min-h-6 items-center justify-self-end">
                    <Link href="/auth/recuperar" className={linkClass}>
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </div>

            {error && (
                <p role="alert" className={errorClass}>
                    {error}
                </p>
            )}

            <Button type="submit" disabled={isSubmitting} size={'lg'} className="h-12 w-full">
                {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
            </Button>

            <p className="text-muted-foreground flex items-start justify-center gap-1 text-sm leading-5">
                ¿No tienes cuenta?
                <Link href="/auth/registro" className={linkClass}>
                    Crea una
                </Link>
            </p>
        </form>
    );
}
