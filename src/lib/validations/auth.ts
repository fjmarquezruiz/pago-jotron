import { z } from 'zod';
import { isAdult } from '@/lib/auth/age';

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
        .refine((v) => isAdult(v), 'Tienes que ser mayor de edad (18 años o más) para registrarte'),
    acceptPrivacy: z.boolean().refine((v) => v === true, 'Debes aceptar la política de privacidad'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
