'use client';

import { useEffect } from 'react';
import { CART_STORAGE_KEY, cartStore } from '@/stores/cart';

/**
 * Recupera el carrito guardado en `localStorage` una vez montada la página, y lo vuelve a recuperar
 * cuando otra pestaña lo cambia (el evento `storage` solo salta en las demás pestañas, no en la
 * que escribe). No pinta nada. Va una sola vez, en el layout raíz.
 *
 * El carrito no se recupera solo (`skipHydration`) para que el primer pintado del cliente coincida
 * con el del servidor, donde no hay `localStorage`: ver `createCartStore`.
 *
 * @example
 * <CartHydrator />
 */
export function CartHydrator() {
    useEffect(() => {
        void cartStore.persist.rehydrate();

        const onStorage = (event: StorageEvent) => {
            if (event.key === CART_STORAGE_KEY) void cartStore.persist.rehydrate();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return null;
}
