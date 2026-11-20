import '@/lib/validations/locale';
import { z } from 'zod';
import { phoneSchema, requiredText } from '@/lib/validations/address';

/** NIF/NIE/CIF sin checksum: 5 a 20 letras y cifras (`users.id_card` es un `varchar(20)`). */
const ID_CARD_PATTERN = /^[A-Z0-9]{5,20}$/;

/**
 * NIF opcional: vacío o ausente se guarda como `null`; si viene, se pasa a mayúsculas y debe
 * tener entre 5 y 20 letras y cifras. No se comprueba la letra de control: es una decisión de
 * negocio (el NIF solo se pide para facturar y no se valida contra el registro).
 */
const idCardSchema = z
    .string('El NIF debe ser un texto')
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(
        (value) => value === '' || ID_CARD_PATTERN.test(value),
        'El NIF debe tener entre 5 y 20 letras y números, sin espacios ni guiones',
    )
    .transform((value) => value || null)
    .nullish()
    .transform((value) => value ?? null);

/**
 * Cuerpo de `PATCH /api/cuenta/perfil` (RF3): los datos de contacto editables. Nombre y apellidos
 * obligatorios (hasta 100 caracteres, como las columnas), teléfono español normalizado a 9
 * dígitos (`phoneSchema`, el mismo de las direcciones) y NIF opcional. El correo no se puede
 * cambiar: si llega un `email` (o cualquier otro campo, como un `role`), se ignora.
 */
export const profileSchema = z.object({
    name: requiredText('El nombre', 100),
    lastName: requiredText('Los apellidos', 100),
    phone: phoneSchema,
    idCard: idCardSchema,
});

export type ProfileInput = z.infer<typeof profileSchema>;
