import '@/lib/validations/locale';
import { z } from 'zod';
import { STREET_TYPES } from '@/lib/validations/address';
import { MAX_ID } from '@/lib/validations/ids';

/** Importe en céntimos: entero no negativo. */
const centsSchema = z.number().int().min(0);

/** Dirección de envío del pedido, tal como la devuelve `GET /api/pedidos/[id]`. */
const orderAddressSchema = z.object({
    recipientName: z.string(),
    streetType: z.enum(STREET_TYPES),
    streetName: z.string(),
    number: z.string(),
    floor: z.string().nullable(),
    postalCode: z.string(),
    city: z.string(),
    province: z.string(),
    country: z.string(),
    phone: z.string(),
});

/** Una línea del pedido: el precio es el guardado en el pedido (texto decimal, `'11.50'`). */
const orderLineSchema = z.object({
    variantId: z.number().int().min(1),
    name: z.string(),
    vintage: z.number().int().nullable(),
    format: z.string(),
    // Mililitros o gramos según la unidad (`product_variants.capacity`); `coerce` tolera que llegue como texto.
    capacity: z.coerce.number(),
    capacityUnit: z.enum(['ml', 'g']),
    quantity: z.number().int().min(1),
    unitPrice: z.string(),
});

/**
 * Respuesta de `GET /api/pedidos/[id]` (RF8): `{ order }`. Se valida porque la página de
 * confirmación pinta lo que llegue: si el servidor devuelve otra cosa, cuenta como error de carga.
 * El desglose de IVA (`quote.vat`) no se usa en la pantalla ("IVA: Incluido") y no se valida.
 */
export const orderResponseSchema = z.object({
    order: z.object({
        id: z.number().int().min(1).max(MAX_ID),
        /** Número que ve el cliente (`PJ-<id>`). */
        number: z.string(),
        status: z.string(),
        paymentMethod: z.string(),
        createdAt: z.string(),
        shippingAddress: orderAddressSchema,
        shippingType: z.object({
            name: z.string(),
            cost: z.string(),
            minDeliveryDays: z.number().int().nullable(),
            maxDeliveryDays: z.number().int().nullable(),
        }),
        /** `AAAA-MM-DD`, o `null` si la modalidad de envío no tiene plazo. */
        estimatedDelivery: z.string().nullable(),
        lines: z.array(orderLineSchema),
        quote: z.object({
            subtotalCents: centsSchema,
            shippingCents: centsSchema,
            totalCents: centsSchema,
        }),
    }),
});

/** El pedido de la respuesta de `GET /api/pedidos/[id]`. */
export type ConfirmationOrder = z.infer<typeof orderResponseSchema>['order'];
