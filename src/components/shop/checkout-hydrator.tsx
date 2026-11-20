'use client';

import { useEffect } from 'react';
import { checkoutStore } from '@/stores/checkout';

/**
 * Recupera las elecciones del checkout guardadas en `sessionStorage` una vez montada la página (no
 * se recuperan solas, `skipHydration`: ver `createCheckoutStore`). No pinta nada. Va en cada página
 * del checkout (Datos, Pago y Confirmar); recuperar dos veces es inocuo. A diferencia del carrito,
 * no escucha el evento `storage`: `sessionStorage` es de cada pestaña.
 *
 * @example
 * <CheckoutHydrator />
 */
export function CheckoutHydrator() {
    useEffect(() => {
        void checkoutStore.persist.rehydrate();
    }, []);
    return null;
}
