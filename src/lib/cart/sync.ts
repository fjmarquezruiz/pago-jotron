/**
 * Reglas de la sincronización del carrito con la cuenta (tabla `cart_products`) como funciones
 * puras: no tocan el almacén ni la red. Quien las usa es `src/stores/cart-sync.ts`.
 *
 * Idea de fondo: el carrito anónimo se fusiona con el de la cuenta UNA sola vez, al iniciar
 * sesión. Después manda el servidor; fusionar en cada carga resucitaría las líneas que el
 * usuario borró desde otro dispositivo.
 */

import type { Cart } from '@/lib/cart/cart';

/** Qué hacer con el carrito local cuando el servidor confirma que hay una sesión: ver `planCartSync`. */
export type CartSyncPlan = 'merge' | 'adopt';

/** Lo que `planCartSync` necesita saber. */
export interface CartSyncContext {
    /** Cuenta con la que se sincronizó por última vez el carrito local (`null`: es anónimo). */
    localOwner: number | null;
    /** Cuenta que tiene ahora la sesión, según el servidor. */
    userId: number;
    /** Las líneas del carrito local. */
    localItems: Cart;
}

/**
 * Decide cómo se junta el carrito local con el de la cuenta cuando hay sesión.
 *
 * - `'merge'`: solo si el carrito local es anónimo (`localOwner === null`) y tiene líneas. Es el
 *   carrito que el cliente armó antes de iniciar sesión: se manda al servidor para fusionarlo
 *   con el guardado (mayor cantidad por presentación).
 * - `'adopt'`: en cualquier otro caso se queda lo del servidor y se descarta lo local: el local
 *   está vacío (nada que fusionar), ya era de esta cuenta (el servidor es la fuente de verdad), o
 *   era de otra cuenta (equipo compartido, sesión caducada: no se mezcla lo de una persona con
 *   lo de otra).
 *
 * @param context - Dueño del carrito local, cuenta de la sesión y líneas locales.
 * @returns `'merge'` o `'adopt'`.
 *
 * @example
 * planCartSync({ localOwner: null, userId: 5, localItems: [{ variantId: 4, quantity: 1 }] }); // 'merge'
 * planCartSync({ localOwner: 5, userId: 5, localItems: [{ variantId: 4, quantity: 1 }] }); // 'adopt'
 */
export function planCartSync({ localOwner, localItems }: CartSyncContext): CartSyncPlan {
    return localOwner === null && localItems.length > 0 ? 'merge' : 'adopt';
}

/**
 * Representación estable de un carrito para compararlo con otro: el JSON de sus líneas, en orden,
 * con solo `variantId` y `quantity` (lo que pueda llevar de más una línea no cuenta).
 *
 * @param cart - El carrito.
 * @returns Un texto igual para carritos iguales y distinto para carritos distintos.
 *
 * @example
 * cartKey([{ variantId: 4, quantity: 2 }]); // '[[4,2]]'
 */
export function cartKey(cart: Cart): string {
    return JSON.stringify(cart.map(({ variantId, quantity }) => [variantId, quantity]));
}

/**
 * Indica si dos carritos tienen las mismas líneas, en el mismo orden y con las mismas cantidades.
 *
 * @param a - Un carrito.
 * @param b - Otro carrito.
 * @returns `true` si son iguales, aunque sean arrays distintos.
 *
 * @example
 * sameCart([{ variantId: 4, quantity: 2 }], [{ variantId: 4, quantity: 2 }]); // true
 */
export function sameCart(a: Cart, b: Cart): boolean {
    return a === b || (a.length === b.length && cartKey(a) === cartKey(b));
}
