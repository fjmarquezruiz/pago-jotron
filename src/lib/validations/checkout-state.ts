import '@/lib/validations/locale';
import { z } from 'zod';
import { ADDRESS_TYPES, STREET_TYPES } from '@/lib/validations/address';
import { MAX_ID } from '@/lib/validations/ids';

/** Id de una fila (modalidad de envío o dirección): entero entre 1 y el máximo de un `int` de MySQL. */
const idSchema = z.number().int().min(1).max(MAX_ID);

/** Un id guardado: si no es válido (manipulado, o de otro formato) se trata como "sin elegir". */
const optionalId = idSchema.nullable().catch(null);

/**
 * Lo que el almacén del checkout guarda en `sessionStorage` (`src/stores/checkout.ts`): las
 * elecciones de esta compra. Se valida al recuperarlo, porque el usuario (o una versión antigua)
 * puede haberlo cambiado: lo que no es un id válido pasa a `null` y un `billingSameAsShipping` que
 * no es booleano vuelve a `true`. Los ids solo son una sugerencia: el servidor comprueba siempre
 * que la dirección y la modalidad existen y son de esta cuenta.
 */
export const persistedCheckoutSchema = z.object({
    shippingTypeId: optionalId.default(null),
    shippingAddressId: optionalId.default(null),
    billingSameAsShipping: z.boolean().catch(true).default(true),
    billingAddressId: optionalId.default(null),
});

export type PersistedCheckout = z.infer<typeof persistedCheckoutSchema>;

/**
 * Respuesta de `GET /api/cuenta/perfil`: los datos de contacto de la cuenta. El teléfono y el
 * CIF/NIF pueden no estar guardados (`null`).
 */
export const profileResponseSchema = z.object({
    profile: z.object({
        name: z.string(),
        lastName: z.string(),
        email: z.string(),
        phone: z.string().nullable(),
        idCard: z.string().nullable(),
    }),
});

export type CheckoutProfile = z.infer<typeof profileResponseSchema>['profile'];

/** Una dirección tal como llega de `GET /api/cuenta/direcciones` (ver `UserAddress`). */
const addressResponseSchema = z.object({
    id: idSchema,
    recipientName: z.string(),
    phone: z.string(),
    streetType: z.enum(STREET_TYPES),
    streetName: z.string(),
    number: z.string(),
    floor: z.string().nullable(),
    postalCode: z.string(),
    city: z.string(),
    province: z.string(),
    country: z.string(),
    addressType: z.enum(ADDRESS_TYPES),
});

/** Respuesta de `GET /api/cuenta/direcciones`: `{ addresses }`. */
export const addressesResponseSchema = z.object({ addresses: z.array(addressResponseSchema) });
