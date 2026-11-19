import { cheapestDelivery, type ShippingOptionInput } from '@/lib/catalog/shipping';
import type { CheckoutProfile } from '@/lib/validations/checkout-state';
import type { DatosFormErrors, DatosFormValues } from '@/lib/validations/checkout-form';
import type { ProfileInput } from '@/lib/validations/profile';

/** Lo que estas funciones necesitan de una dirección guardada. */
export interface AddressRef {
    id: number;
    addressType: 'Envío' | 'Facturación';
}

/**
 * Modalidad de envío que debe quedar elegida: la guardada en el almacén si sigue ofreciéndose y,
 * si no (primera visita, o la modalidad ya no existe), la más barata con plazo (`cheapestDelivery`).
 *
 * @param options - Las modalidades con plazo (`deliveryOptions`).
 * @param stored - La elegida antes (`checkoutStore`), o `null`.
 * @returns El id que debe quedar elegido, o `null` si no hay ninguna modalidad.
 *
 * @example
 * resolveShippingTypeId(options, null); // el id de la más barata
 */
export function resolveShippingTypeId<T extends ShippingOptionInput & { id: number }>(
    options: readonly T[],
    stored: number | null,
): number | null {
    if (stored !== null && options.some((option) => option.id === stored)) return stored;
    return cheapestDelivery(options)?.id ?? null;
}

/**
 * Dirección de envío que debe quedar elegida: la guardada si sigue existiendo y, si no, la primera
 * de tipo Envío. Si no hay ninguna de ese tipo no se elige nada (el usuario debe decidir o añadir
 * una): una dirección de Facturación no se preselecciona como envío.
 *
 * @param addresses - Las direcciones vigentes de la cuenta.
 * @param stored - La elegida antes, o `null`.
 * @returns El id que debe quedar elegido, o `null`.
 *
 * @example
 * resolveShippingAddressId(addresses, null); // la primera dirección de Envío
 */
export function resolveShippingAddressId(
    addresses: readonly AddressRef[],
    stored: number | null,
): number | null {
    if (stored !== null && addresses.some((address) => address.id === stored)) return stored;
    return addresses.find((address) => address.addressType === 'Envío')?.id ?? null;
}

/**
 * Dirección de facturación que debe quedar elegida (casilla "misma" desmarcada): la guardada si es
 * una dirección vigente de tipo Facturación y, si no, la primera de ese tipo. El servidor solo
 * acepta como facturación distinta de la de envío una de tipo Facturación.
 *
 * @param addresses - Las direcciones vigentes de la cuenta.
 * @param stored - La elegida antes, o `null`.
 * @returns El id que debe quedar elegido, o `null` si no hay ninguna de Facturación.
 *
 * @example
 * resolveBillingAddressId(addresses, 7); // 7 si existe y es de Facturación
 */
export function resolveBillingAddressId(
    addresses: readonly AddressRef[],
    stored: number | null,
): number | null {
    const billing = addresses.filter((address) => address.addressType === 'Facturación');
    if (stored !== null && billing.some((address) => address.id === stored)) return stored;
    return billing[0]?.id ?? null;
}

/** Lo que se comprueba al continuar, además de los campos del formulario. */
export interface SelectionInput {
    /** `true` si el formulario de nueva dirección está abierto. */
    adding: boolean;
    /** Tipo elegido en el formulario de nueva dirección. */
    newAddressType: string;
    addresses: readonly AddressRef[];
    shippingTypeId: number | null;
    /** `true` si hay alguna modalidad de envío que ofrecer. */
    hasShippingOptions: boolean;
    shippingAddressId: number | null;
    billingSameAsShipping: boolean;
    billingAddressId: number | null;
}

/** Un mensaje por cada elección que falta; sin clave = bien. */
export interface SelectionProblems {
    shippingType?: string;
    shippingAddress?: string;
    billingAddress?: string;
}

/**
 * Comprueba las elecciones que no son campos de texto: modalidad de envío, dirección de envío y,
 * con la casilla desmarcada, dirección de facturación. La dirección nueva del formulario abierto
 * cuenta como la elegida de su tipo (Envío: envío; Facturación: facturación).
 *
 * @param input - Las elecciones actuales.
 * @returns Los problemas, con su mensaje en español; objeto vacío si todo está bien.
 *
 * @example
 * selectionProblems({ ...input, billingSameAsShipping: false, addresses: [] }).billingAddress;
 * // 'No tienes ninguna dirección de facturación. Añade una nueva con el tipo «Facturación».'
 */
export function selectionProblems(input: SelectionInput): SelectionProblems {
    const problems: SelectionProblems = {};
    const newIsShipping = input.adding && input.newAddressType === 'Envío';
    const newIsBilling = input.adding && input.newAddressType === 'Facturación';

    if (input.shippingTypeId === null) {
        problems.shippingType = input.hasShippingOptions
            ? 'Elige un tipo de envío.'
            : 'Ahora mismo no hay ningún tipo de envío disponible.';
    }

    const hasShipping =
        input.shippingAddressId !== null &&
        input.addresses.some((address) => address.id === input.shippingAddressId);
    if (!hasShipping && !newIsShipping) {
        problems.shippingAddress = 'Elige una dirección de envío o añade una nueva.';
    }

    if (!input.billingSameAsShipping && !newIsBilling) {
        const billing = input.addresses.filter((address) => address.addressType === 'Facturación');
        if (billing.length === 0) {
            problems.billingAddress =
                'No tienes ninguna dirección de facturación. Añade una nueva con el tipo «Facturación».';
        } else if (!billing.some((address) => address.id === input.billingAddressId)) {
            problems.billingAddress = 'Elige una dirección de facturación.';
        }
    }
    return problems;
}

/**
 * Indica si el contacto del formulario es el que ya está guardado en la cuenta: entonces no hace
 * falta llamar a `PATCH /api/cuenta/perfil`. Compara tras normalizar (teléfono de 9 dígitos, NIF
 * en mayúsculas o `null`), igual que lo guarda el servidor.
 *
 * @param profile - El perfil guardado (`GET /api/cuenta/perfil`).
 * @param contact - El contacto validado del formulario.
 * @returns `true` si no hay nada que guardar.
 *
 * @example
 * contactUnchanged(profile, { ...profile, idCard: null }); // true si el perfil no tenía NIF
 */
export function contactUnchanged(
    profile: Pick<CheckoutProfile, 'name' | 'lastName' | 'phone' | 'idCard'>,
    contact: ProfileInput,
): boolean {
    return (
        profile.name === contact.name &&
        profile.lastName === contact.lastName &&
        profile.phone === contact.phone &&
        (profile.idCard ?? null) === contact.idCard
    );
}

/**
 * Valores iniciales del formulario a partir del perfil de la cuenta (contacto precargado; el
 * teléfono y el NIF vacíos si no estaban guardados).
 *
 * @param profile - El perfil de la cuenta.
 * @param defaults - Los valores vacíos del formulario.
 * @returns Los valores con el contacto rellenado.
 *
 * @example
 * contactDefaults(profile, DATOS_FORM_DEFAULTS).name; // 'Juan'
 */
export function contactDefaults(
    profile: Pick<CheckoutProfile, 'name' | 'lastName' | 'phone' | 'idCard'>,
    defaults: DatosFormValues,
): DatosFormValues {
    return {
        ...defaults,
        name: profile.name,
        lastName: profile.lastName,
        phone: profile.phone ?? '',
        idCard: profile.idCard ?? '',
    };
}

/**
 * Pasa los errores por campo de una respuesta 400 de la API (`{ errors: { campo: [mensajes] } }`) a
 * errores del formulario: el primer mensaje de cada campo que existe en `fieldMap`.
 *
 * @param errors - El `errors` de la respuesta (cualquier cosa: se comprueba).
 * @param fieldMap - Campo de la API → campo del formulario.
 * @returns Los errores del formulario; vacío si no había ninguno reconocible.
 *
 * @example
 * apiFieldErrors({ phone: ['Introduce un teléfono español de 9 dígitos'] }, { phone: 'addressPhone' });
 * // { addressPhone: 'Introduce un teléfono español de 9 dígitos' }
 */
export function apiFieldErrors(
    errors: unknown,
    fieldMap: Readonly<Record<string, keyof DatosFormValues>>,
): DatosFormErrors {
    const result: DatosFormErrors = {};
    if (typeof errors !== 'object' || errors === null) return result;
    for (const [apiField, formField] of Object.entries(fieldMap)) {
        const messages = (errors as Record<string, unknown>)[apiField];
        const first = Array.isArray(messages) ? messages[0] : undefined;
        if (typeof first === 'string' && first) result[formField] = first;
    }
    return result;
}
