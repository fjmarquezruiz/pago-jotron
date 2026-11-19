import '@/lib/validations/locale';
import { z } from 'zod';
import { provinceFromPostalCode } from '@/lib/geo/provinces';
import {
    ADDRESS_COUNTRY,
    ADDRESS_TYPES,
    STREET_TYPES,
    phoneSchema,
    type AddressInput,
} from '@/lib/validations/address';
import { profileSchema, type ProfileInput } from '@/lib/validations/profile';

/**
 * Valores del formulario de la página "Datos" (Figma: checkout-2-datos). Todo son textos, tal como
 * los escribe el usuario (los `<input>` no devuelven otra cosa): `validateDatosForm` los convierte
 * a lo que esperan las APIs. Los campos de contacto son los de `profileSchema`; los de la dirección
 * nueva llevan los mismos nombres que `addressSchema`, salvo el teléfono (`addressPhone`, para no
 * chocar con el de contacto) y la provincia (`province`, solo informativa: la API la recalcula del
 * código postal).
 */
export interface DatosFormValues {
    name: string;
    lastName: string;
    phone: string;
    idCard: string;
    streetType: string;
    streetName: string;
    number: string;
    floor: string;
    postalCode: string;
    city: string;
    province: string;
    country: string;
    addressPhone: string;
    addressType: string;
}

/**
 * Valores iniciales del formulario con todo vacío: el país es siempre España y el tipo de
 * dirección, Envío (Figma: radio marcado). El tipo de vía queda sin elegir (Figma: placeholder
 * "p. ej., Calle").
 */
export const DATOS_FORM_DEFAULTS: DatosFormValues = {
    name: '',
    lastName: '',
    phone: '',
    idCard: '',
    streetType: '',
    streetName: '',
    number: '',
    floor: '',
    postalCode: '',
    city: '',
    province: '',
    country: ADDRESS_COUNTRY,
    addressPhone: '',
    addressType: 'Envío',
};

/** Texto obligatorio con su propio mensaje (el de los campos del formulario, que no lleva "es obligatorio"). */
const requiredField = (message: string, max: number) =>
    z.string(message).trim().min(1, message).max(max, `Escribe como mucho ${max} caracteres`);

/**
 * Código postal de 5 dígitos que empieza por una provincia (01 a 52). Mismas reglas que
 * `addressSchema`, que es la que manda: un test comprueba que lo que pasa aquí lo acepta la API.
 */
const postalCodeField = z
    .string('El código postal es obligatorio')
    .trim()
    .regex(/^\d{5}$/, 'El código postal tiene 5 dígitos')
    .refine(
        (value) => provinceFromPostalCode(value) !== null,
        'El código postal no corresponde a ninguna provincia (empieza entre 01 y 52)',
    );

/**
 * Contacto del formulario: el mismo esquema que el `PATCH /api/cuenta/perfil` (`profileSchema`),
 * así que el formulario y la API no pueden discrepar. El correo no está: viene de la cuenta y no se
 * edita.
 */
export const contactFormSchema = profileSchema;

/**
 * Dirección nueva del formulario (Figma: fieldset del frame v2). Número y teléfono son
 * obligatorios aunque Figma los pinte como "Opcional": la API (`addressSchema`) los exige. El
 * destinatario no es un campo: sale del nombre y apellidos del contacto (`toAddressRequest`).
 */
export const addressFormSchema = z.object({
    streetType: z.enum(STREET_TYPES, 'Elige un tipo de vía'),
    streetName: requiredField('Escribe el nombre de la vía', 100),
    number: requiredField('Escribe el número', 10),
    floor: z.string().trim().max(20, 'El piso admite como mucho 20 caracteres'),
    postalCode: postalCodeField,
    city: requiredField('Escribe la ciudad', 100),
    country: z.literal(ADDRESS_COUNTRY, `Solo enviamos a ${ADDRESS_COUNTRY}`),
    addressPhone: phoneSchema,
    addressType: z.enum(ADDRESS_TYPES, 'Elige un tipo de dirección'),
});

/** La dirección del formulario ya validada y normalizada. */
export type AddressFormOutput = z.output<typeof addressFormSchema>;

/** Error de cada campo del formulario (el primero que falla), listo para pintar. */
export type DatosFormErrors = Partial<Record<keyof DatosFormValues, string>>;

/** Resultado de `validateDatosForm`: los datos validados o el error de cada campo. */
export type DatosFormResult =
    | { success: true; contact: ProfileInput; address: AddressFormOutput | null }
    | { success: false; errors: DatosFormErrors };

/** Pasa los problemas de zod a un mensaje por campo: se queda con el primero de cada uno. */
function collectErrors(issues: readonly z.core.$ZodIssue[], into: DatosFormErrors) {
    for (const issue of issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !(field in into)) {
            into[field as keyof DatosFormValues] = issue.message;
        }
    }
}

/**
 * Valida el formulario de Datos. El contacto se valida siempre; la dirección solo si el formulario
 * de nueva dirección está abierto (`adding`): cerrado, sus campos no cuentan.
 *
 * @param values - Lo que hay escrito en el formulario.
 * @param options.adding - `true` si el formulario de nueva dirección está abierto.
 * @returns Los datos validados (contacto y, si procede, dirección) o un mensaje por campo.
 *
 * @example
 * const result = validateDatosForm(values, { adding: false });
 * if (result.success) await saveProfile(result.contact);
 */
export function validateDatosForm(
    values: DatosFormValues,
    options: { adding: boolean },
): DatosFormResult {
    const errors: DatosFormErrors = {};
    const contact = contactFormSchema.safeParse({
        name: values.name,
        lastName: values.lastName,
        phone: values.phone,
        idCard: values.idCard,
    });
    if (!contact.success) collectErrors(contact.error.issues, errors);

    let address: AddressFormOutput | null = null;
    if (options.adding) {
        const parsed = addressFormSchema.safeParse(values);
        if (parsed.success) address = parsed.data;
        else collectErrors(parsed.error.issues, errors);
    }

    if (!contact.success || Object.keys(errors).length > 0) return { success: false, errors };
    return { success: true, contact: contact.data, address };
}

/**
 * Cuerpo de `POST /api/cuenta/direcciones` a partir de la dirección del formulario. El
 * destinatario es el nombre y apellidos del contacto (el formulario no lo pide). La provincia no
 * se manda: la API la deduce del código postal.
 *
 * @param address - La dirección ya validada.
 * @param contact - El contacto ya validado.
 * @returns El cuerpo de la petición (lo que acepta `addressSchema`).
 *
 * @example
 * await fetch('/api/cuenta/direcciones', { method: 'POST', body: JSON.stringify(toAddressRequest(address, contact)) });
 */
export function toAddressRequest(
    address: AddressFormOutput,
    contact: Pick<ProfileInput, 'name' | 'lastName'>,
): Omit<AddressInput, 'province'> {
    const { addressPhone, floor, ...rest } = address;
    return {
        ...rest,
        recipientName: `${contact.name} ${contact.lastName}`,
        phone: addressPhone,
        floor: floor || null,
    };
}
