import { useSyncExternalStore } from 'react';
import { cartStore } from '@/stores/cart';

/**
 * Indica si el carrito ya se ha recuperado de `localStorage` (`CartHydrator`). Hasta entonces el
 * almacén está vacío, aunque el usuario tenga cosas guardadas: lo que dependa de las líneas (la
 * página del carrito) debe esperar a que sea `true` para no enseñar "vacío" de más.
 *
 * En el servidor y en el primer pintado del cliente devuelve `false`, así que no hay diferencias
 * de hidratación.
 *
 * @returns `true` cuando el carrito guardado ya está en el almacén.
 *
 * @example
 * const hydrated = useCartHydrated();
 * if (!hydrated) return <CartSkeleton />;
 */
export function useCartHydrated(): boolean {
    return useSyncExternalStore(
        (onChange) => cartStore.persist.onFinishHydration(onChange),
        () => cartStore.persist.hasHydrated(),
        () => false,
    );
}
