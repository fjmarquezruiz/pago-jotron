import { useSyncExternalStore } from 'react';
import { cartSync } from '@/stores/cart-sync';

/**
 * Indica si el carrito ya se ha puesto al día con la cuenta (`syncCart`): hasta entonces puede
 * faltarle lo guardado en la cuenta, así que lo que dependa de las líneas (la página del carrito)
 * debe esperar a que sea `true`. Pasa a `true` aunque no haya sesión o falle la red: significa
 * "ya se ha intentado", no "hay sesión".
 *
 * En el servidor y en el primer pintado del cliente devuelve `false`, así que no hay diferencias
 * de hidratación (igual que `useCartHydrated`).
 *
 * @returns `true` cuando `sync` ha terminado al menos una vez.
 *
 * @example
 * const synced = useCartSynced();
 * if (!synced) return <CartSkeleton />;
 */
export function useCartSynced(): boolean {
    return useSyncExternalStore(cartSync.subscribe, cartSync.isSynced, () => false);
}
