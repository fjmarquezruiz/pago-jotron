import { z } from 'zod';
import { provinceFromPostalCode } from '@/lib/geo/provinces';
import { MAX_ID } from '@/lib/validations/ids';

/**
 * Tipos de vía (`addresses.street_type`). Es la misma lista que el `enum` de `src/db/schema.ts`
 * (un test lo comprueba): el esquema de Drizzle no puede importar de aquí porque `drizzle-kit`
 * lo carga sin los alias de `tsconfig`.
 */
export const STREET_TYPES = [
    'Calle',
    'Avenida',
    'Plaza',
    'Paseo',
    'Camino',
    'Carretera',
    'Ronda',
    'Travesía',
    'Glorieta',
    'Urbanización',
] as const;

/** Tipos de dirección (`addresses.address_type`). */
export const ADDRESS_TYPES = ['Envío', 'Facturación'] as const;

/** Las direcciones de la tienda son solo de España (RF7). */
export const ADDRESS_COUNTRY = 'España';

/** Teléfono español: 9 dígitos que empiezan por 6, 7, 8 o 9, con o sin prefijo `+34` / `0034`. */
const PHONE_PATTERN = /^[6-9]\d{8}$/;

/** Texto obligatorio, sin espacios en los extremos, con un máximo (el de la columna). */
const requiredText = (label: string, max: number) =>
    z
        .string(`${label}: escribe un texto`)
        .trim()
        .min(1, `${label} es obligatorio`)
        .max(max, `${label} admite como mucho ${max} caracteres`);

/** Campos que escribe el cliente. La provincia no está: se deriva del código postal. */
const addressFields = z.object({
    recipientName: requiredText('El nombre y apellidos de quien recibe', 200),
    phone: z
        .string('El teléfono es obligatorio')
        .trim()
        .transform((value) => value.replace(/[\s.-]/g, '').replace(/^(\+34|0034)/, ''))
        .refine((value) => PHONE_PATTERN.test(value), 'Introduce un teléfono español de 9 dígitos'),
    streetType: z.enum(STREET_TYPES, 'Elige un tipo de vía válido').default('Calle'),
    streetName: requiredText('El nombre de la vía', 100),
    number: requiredText('El número', 10),
    floor: z
        .string()
        .trim()
        .max(20, 'El piso admite como mucho 20 caracteres')
        .nullish()
        .transform((value) => value || null),
    postalCode: z
        .string('El código postal es obligatorio')
        .trim()
        .regex(/^\d{5}$/, 'El código postal tiene 5 dígitos')
        .refine(
            (value) => provinceFromPostalCode(value) !== null,
            'El código postal no corresponde a ninguna provincia (empieza entre 01 y 52)',
        ),
    city: requiredText('La localidad', 100),
    country: z
        .literal(ADDRESS_COUNTRY, `Solo enviamos a ${ADDRESS_COUNTRY}`)
        .default(ADDRESS_COUNTRY),
    addressType: z.enum(ADDRESS_TYPES, 'Elige un tipo de dirección válido').default('Envío'),
});

/**
 * Añade la provincia, que sale del código postal (`provinceFromPostalCode`) y no de lo que mande
 * el cliente: así no puede contradecirlo. Solo se llama con el código ya validado.
 */
function withProvince<T extends { postalCode: string }>(data: T) {
    return { ...data, province: provinceFromPostalCode(data.postalCode) as string };
}

/**
 * Datos de una dirección de envío o de facturación (RF3, RF7); compartido por el formulario y la
 * API (`/api/cuenta/direcciones`). Solo España: el código postal tiene 5 dígitos y empieza por
 * una provincia del 01 al 52, y de él sale la provincia (`provinceFromPostalCode`): lo que mande
 * el cliente en `province` se ignora, para que no contradiga al código. El teléfono se guarda
 * normalizado, solo con los 9 dígitos. El piso vacío se guarda como `null`. Lo que sobra (un
 * `userId`, un `id`) también se ignora: la cuenta sale siempre de la sesión.
 */
export const addressSchema = addressFields.transform(withProvince);

export type AddressInput = z.infer<typeof addressSchema>;

/**
 * Cuerpo de `POST /api/cuenta/direcciones`: una dirección y, para editar, el id de la que
 * sustituye (`replaces`). Una dirección no se modifica: se crea otra y la anterior pasa a
 * `is_active = false`, para que un pedido antiguo no cambie su dirección.
 */
export const createAddressRequestSchema = addressFields
    .extend({ replaces: z.number().int().min(1).max(MAX_ID).optional() })
    .transform(withProvince);

export type CreateAddressRequest = z.infer<typeof createAddressRequestSchema>;
