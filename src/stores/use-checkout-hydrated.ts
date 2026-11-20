import { useSyncExternalStore } from 'react';
import { checkoutStore } from '@/stores/checkout';

/**
 * Indica si las elecciones del checkout ya se han recuperado de `sessionStorage`
 * (`CheckoutHydrator`). Hasta entonces el almacén está en su estado inicial aunque haya algo
 * guardado: lo que dependa de él debe esperar a que sea `true`, o preseleccionaría de más y
 * sobrescribiría lo guardado.
 *
 * En el servidor y en el primer pintado del cliente devuelve `false`, así que no hay diferencias
 * de hidratación.
 *
 * @returns `true` cuando lo guardado ya está en el almacén.
 *
 * @example
 * const hydrated = useCheckoutHydrated();
 * if (!hydrated) return <CheckoutSkeleton />;
 */
export function useCheckoutHydrated(): boolean {
    return useSyncExternalStore(
        (onChange) => checkoutStore.persist.onFinishHydration(onChange),
        () => checkoutStore.persist.hasHydrated(),
        () => false,
    );
}
