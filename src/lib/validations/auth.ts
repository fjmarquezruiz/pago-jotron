import { z } from 'zod';
import { isAdult, isRealDate } from '@/lib/auth/age';

/** Datos del formulario de registro; compartido por el formulario y la API (RF2). */
export const registerSchema = z.object({
    email: z.string().trim().toLowerCase().email('Introduce un correo válido'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    birthDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)')
        .refine((v) => isRealDate(v), 'La fecha no existe')
        .refine((v) => isAdult(v), 'Tienes que ser mayor de edad (18 años o más) para registrarte'),
    acceptPrivacy: z.boolean().refine((v) => v === true, 'Debes aceptar la política de privacidad'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Datos del formulario de registro en pantalla: repite la contraseña y separa la fecha
 * de nacimiento en día, mes y año (los tres desplegables). Se convierte a `RegisterInput`
 * antes de llamar a la API.
 */
export const registerFormSchema = z
    .object({
        email: registerSchema.shape.email,
        password: registerSchema.shape.password,
        confirmPassword: z.string().min(1, 'Repite tu contraseña'),
        birthDay: z.string().min(1, 'Elige el día'),
        birthMonth: z.string().min(1, 'Elige el mes'),
        birthYear: z.string().min(1, 'Elige el año'),
        acceptPrivacy: registerSchema.shape.acceptPrivacy,
    })
    .superRefine((data, ctx) => {
        if (data.confirmPassword && data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: 'custom',
                path: ['confirmPassword'],
                message: 'Las contraseñas no coinciden',
            });
        }
        if (!data.birthDay || !data.birthMonth || !data.birthYear) return;
        const birthDate = toBirthDate(data.birthDay, data.birthMonth, data.birthYear);
        if (!isRealDate(birthDate)) {
            ctx.addIssue({ code: 'custom', path: ['birthDay'], message: 'La fecha no existe' });
        } else if (!isAdult(birthDate)) {
            ctx.addIssue({
                code: 'custom',
                path: ['birthYear'],
                message: 'Tienes que ser mayor de edad (18 años o más) para registrarte',
            });
        }
    });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;

/** Compone la fecha `AAAA-MM-DD` que espera la API a partir de los tres desplegables. */
export function toBirthDate(day: string, month: string, year: string): string {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/** Datos del formulario de login (RF2). */
export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('Introduce un correo válido'),
    password: z.string().min(1, 'Introduce tu contraseña'),
});

export type LoginInput = z.infer<typeof loginSchema>;
