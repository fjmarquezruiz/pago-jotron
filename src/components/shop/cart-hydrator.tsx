'use client';

import { useEffect } from 'react';
import { resyncCartIfOwnerChanged, startCartPush, syncCart } from '@/stores/cart-sync';
import { CART_STORAGE_KEY, cartStore } from '@/stores/cart';

/**
 * Pone el carrito en marcha en el navegador. No pinta nada. Va una sola vez, en el layout raíz.
 *
 * 1. Recupera el carrito guardado en `localStorage` una vez montada la página (no se recupera solo,
 *    `skipHydration`, para que el primer pintado coincida con el del servidor, donde no hay
 *    `localStorage`: ver `createCartStore`), y lo vuelve a recuperar cuando otra pestaña lo cambia
 *    (el evento `storage` solo salta en las demás pestañas, no en la que escribe). Si el dueño del
 *    carrito cambió (inicio o cierre de sesión en la otra pestaña), vuelve a sincronizar.
 * 2. Con el carrito recuperado, lo sincroniza con el servidor (`syncCart`): si hay sesión, se
 *    fusiona con el anónimo o se adopta el de la cuenta; si no, se queda como está.
 * 3. Mientras haya sesión, cada cambio local se envía al servidor (`startCartPush`).
 *
 * @example
 * <CartHydrator />
 */
export function CartHydrator() {
    useEffect(() => {
        const stopPush = startCartPush();
        void Promise.resolve(cartStore.persist.rehydrate()).then(() => syncCart());

        const onStorage = (event: StorageEvent) => {
            if (event.key !== CART_STORAGE_KEY) return;
            // Otra pestaña pudo iniciar o cerrar sesión (cambia el dueño del carrito): entonces
            // esta debe volver a sincronizar, o lo que añada no se subiría.
            void Promise.resolve(cartStore.persist.rehydrate()).then(() =>
                resyncCartIfOwnerChanged(),
            );
        };
        window.addEventListener('storage', onStorage);
        return () => {
            stopPush();
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    return null;
}
