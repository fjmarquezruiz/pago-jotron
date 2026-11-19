'use client';

import { cartUnits } from '@/lib/cart/totals';
import { useCartStore } from '@/stores/cart';

/**
 * Número de unidades del carrito, para "Carrito (n)" de la cabecera. Cuenta unidades, no líneas:
 * dos botellas de un vino y una de otro son 3, como el "(3 artículos)" de la página del carrito.
 *
 * El servidor y el primer pintado del cliente dan 0 (no hay carrito hasta que `CartHydrator` lo
 * recupera de `localStorage`), así que no hay diferencias de hidratación; el número real aparece
 * justo después.
 *
 * @example
 * <Link href="/carrito">Carrito (<CartCount />)</Link>
 */
export function CartCount() {
    const units = useCartStore((state) => cartUnits(state.items));
    return <>{units}</>;
}
