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
