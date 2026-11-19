import { z } from 'zod';
import { CART_MAX_LINES } from '@/lib/cart/cart';
import { MAX_ID } from '@/lib/validations/ids';

/** Id de una presentación (`product_variants.variant_id`): entero entre 1 y el máximo de un `int` de MySQL. */
export const variantIdSchema = z.number().int().min(1).max(MAX_ID);

/** Una línea del carrito: la presentación y una cantidad entera >= 1. */
export const cartItemSchema = z.object({
    variantId: variantIdSchema,
    quantity: z.number().int().min(1).max(MAX_ID),
});

/**
 * Un carrito: como mucho `CART_MAX_LINES` líneas y ninguna presentación repetida. Es el formato
 * que `src/lib/cart/` mantiene siempre, así que lo que no lo cumpla no lo ha escrito la tienda.
 */
export const cartSchema = z
    .array(cartItemSchema)
    .max(CART_MAX_LINES)
    .refine((items) => new Set(items.map((item) => item.variantId)).size === items.length, {
        message: 'Hay presentaciones repetidas',
    });

/**
 * Lo que el almacén guarda en `localStorage` (`partialize` de `src/stores/cart.ts`): las líneas y
 * de quién es el carrito (`owner`: el id de la cuenta con la que se sincronizó por última vez, o
 * `null` si es anónimo). Se valida al recuperarlo, porque el usuario (o una versión antigua) puede
 * haberlo cambiado: un precio o un stock guardado ahí no se lee nunca. Sin `owner` (lo guardado
 * antes de que existiera) o con uno que no es un id, el carrito se trata como anónimo.
 */
export const persistedCartSchema = z.object({
    items: cartSchema,
    owner: variantIdSchema.nullable().default(null).catch(null),
});

/**
 * Cuerpo de `PUT /api/carrito` y de `POST /api/carrito/fusionar`: las líneas del carrito (como
 * mucho `CART_MAX_LINES`, sin presentaciones repetidas). Las que no se pueden vender o pasan del
 * stock las corrige el servidor.
 */
export const cartItemsRequestSchema = z.object({ items: cartSchema });

export type CartItemsRequest = z.infer<typeof cartItemsRequestSchema>;

/**
 * Cuerpo de `POST /api/carrito/lineas`: los ids de las presentaciones del carrito (como mucho
 * `CART_MAX_LINES`). Los repetidos se juntan en uno; la lista puede ir vacía.
 */
export const cartLinesRequestSchema = z.object({
    variantIds: z
        .array(variantIdSchema)
        .max(CART_MAX_LINES)
        .transform((ids) => Array.from(new Set(ids))),
});

export type CartLinesRequest = z.infer<typeof cartLinesRequestSchema>;
