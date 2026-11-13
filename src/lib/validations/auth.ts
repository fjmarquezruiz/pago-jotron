import { z } from 'zod';
import { isAdult, isRealDate } from '@/lib/auth/age';

const ADULT_MESSAGE = 'Tienes que ser mayor de edad (18 años o más) para registrarte';

/** Fecha `AAAA-MM-DD` que existe en el calendario. No comprueba la edad. */
export const birthDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)')
    .refine((v) => isRealDate(v), 'La fecha no existe');

/** Datos del formulario de registro; compartido por el formulario y la API (RF2). */
export const registerSchema = z.object({
    email: z.string().trim().toLowerCase().email('Introduce un correo válido'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    birthDate: birthDateSchema.refine((v) => isAdult(v), ADULT_MESSAGE),
    acceptPrivacy: z.boolean().refine((v) => v === true, 'Debes aceptar la política de privacidad'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Día, mes y año de los tres desplegables de fecha de nacimiento. */
const birthPartsShape = {
    birthDay: z.string().min(1, 'Elige el día'),
    birthMonth: z.string().min(1, 'Elige el mes'),
    birthYear: z.string().min(1, 'Elige el año'),
};

type BirthParts = { birthDay: string; birthMonth: string; birthYear: string };

/**
 * Valida la fecha formada por los tres desplegables y marca el error en el campo que toca:
 * la fecha que no existe en `birthDay` y, si `requireAdult`, la minoría de edad en `birthYear`.
 * No hace nada mientras falte alguno de los tres.
 */
function checkBirthParts(data: BirthParts, ctx: z.RefinementCtx, requireAdult: boolean) {
    if (!data.birthDay || !data.birthMonth || !data.birthYear) return;
    const birthDate = toBirthDate(data.birthDay, data.birthMonth, data.birthYear);
    if (!isRealDate(birthDate)) {
        ctx.addIssue({ code: 'custom', path: ['birthDay'], message: 'La fecha no existe' });
    } else if (requireAdult && !isAdult(birthDate)) {
        ctx.addIssue({ code: 'custom', path: ['birthYear'], message: ADULT_MESSAGE });
    }
}

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
        ...birthPartsShape,
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
        checkBirthParts(data, ctx, true);
    });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;

/** Compone la fecha `AAAA-MM-DD` que espera la API a partir de los tres desplegables. */
export function toBirthDate(day: string, month: string, year: string): string {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Formulario de la verificación de edad: solo los tres desplegables. Comprueba que la fecha
 * exista; que sea mayor de edad no es un error de campo, lo decide la pantalla (mensaje de menores).
 */
export const ageGateFormSchema = z
    .object(birthPartsShape)
    .superRefine((data, ctx) => checkBirthParts(data, ctx, false));

export type AgeGateFormInput = z.infer<typeof ageGateFormSchema>;

/** Cuerpo de `POST /api/verificar-edad` (RNF3): solo la fecha, que no se guarda. */
export const ageGateSchema = z.object({ birthDate: birthDateSchema });

/** Datos del formulario de login (RF2). */
export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('Introduce un correo válido'),
    password: z.string().min(1, 'Introduce tu contraseña'),
});

export type LoginInput = z.infer<typeof loginSchema>;
