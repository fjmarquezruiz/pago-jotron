import '@/lib/validations/locale';
import { z } from 'zod';
import { MAX_ID } from '@/lib/validations/ids';

const idSchema = z.number().int().min(1).max(MAX_ID);

/**
 * Cuerpo de `POST /api/checkout/pago` (RF7): el tipo de envío y la dirección de envío elegidos.
 * Nada más: el carrito sale de la BD (`cart_products`) y los importes del servidor, así que el
 * navegador no puede decir qué cuesta ni qué lleva. Si trae más campos, como un `amount` o un
 * `items`, se ignoran.
 */
export const checkoutPaymentRequestSchema = z.object({
    shippingTypeId: idSchema,
    shippingAddressId: idSchema,
});

export type CheckoutPaymentRequest = z.infer<typeof checkoutPaymentRequestSchema>;

/** Métodos de pago con los que se puede crear un pedido (`orders.payment_method`; PayPal no se ofrece). */
export const ORDER_PAYMENT_METHODS = ['Tarjeta', 'Transferencia'] as const;

/** Id de un PaymentIntent de Stripe: `pi_` y letras, cifras o guion bajo, hasta 64 caracteres (`orders.payment_intent_id`). */
const paymentIntentIdSchema = z
    .string('El identificador del pago es obligatorio con tarjeta')
    .regex(/^pi_[A-Za-z0-9_]{1,61}$/, 'El identificador del pago no es válido');

/** Campos comunes a los dos métodos de pago. */
const orderFields = {
    shippingTypeId: idSchema,
    shippingAddressId: idSchema,
    // Si falta, la facturación es la dirección de envío; si viene, debe ser una dirección de tipo Facturación.
    billingAddressId: idSchema.optional(),
};

/**
 * Cuerpo de `POST /api/checkout/pedido` (RF7): crea el pedido. Con `Tarjeta` hace falta el
 * `paymentIntentId` que devolvió `/api/checkout/pago` (la tarjeta ya confirmada); con
 * `Transferencia` no hay pago que referenciar y mandarlo es un error. Como en `/pago`, el carrito
 * y los importes salen del servidor: lo demás que llegue (un `amount`, un `items`) se ignora.
 */
export const checkoutOrderRequestSchema = z.discriminatedUnion(
    'paymentMethod',
    [
        z.object({
            paymentMethod: z.literal('Tarjeta'),
            ...orderFields,
            paymentIntentId: paymentIntentIdSchema,
        }),
        z.object({
            paymentMethod: z.literal('Transferencia'),
            ...orderFields,
            paymentIntentId: z.never('Una transferencia no lleva identificador de pago').optional(),
        }),
    ],
    { error: 'Elige un método de pago válido: Tarjeta o Transferencia' },
);

export type CheckoutOrderRequest = z.infer<typeof checkoutOrderRequestSchema>;
