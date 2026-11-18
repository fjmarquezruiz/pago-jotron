import { toast } from '@/components/ui/toast';
import { describeAdd } from '@/lib/cart/add-feedback';
import { CART_MAX_LINES } from '@/lib/cart/cart';
import { cartStore } from '@/stores/cart';

interface AddToCartParams {
    /** Presentación que se añade (`product_variants.variant_id`). */
    variantId: number;
    /** Unidades que se añaden (entero >= 1). */
    quantity: number;
    /** Stock de la presentación con el que se cargó la página: el servidor lo vuelve a comprobar. */
    stock: number;
    /** Qué hace la acción "Ver carrito" del aviso (normalmente, ir a `/carrito`). */
    onViewCart: () => void;
}

/**
 * Añade unidades de una presentación al carrito y avisa con un toast: lo confirma, o dice que el
 * stock ha limitado lo añadido o que el carrito está lleno (`describeAdd`). El aviso lleva la
 * acción "Ver carrito". Solo para componentes de cliente (usa el almacén del navegador).
 *
 * @example
 * addToCartWithFeedback({ variantId: 4, quantity: 1, stock: 12, onViewCart: () => router.push('/carrito') });
 */
export function addToCartWithFeedback({ variantId, quantity, stock, onViewCart }: AddToCartParams) {
    const unitsInCart = () =>
        cartStore.getState().items.find((item) => item.variantId === variantId)?.quantity ?? 0;

    const before = unitsInCart();
    cartStore.getState().add(variantId, quantity, stock);
    const { type, message } = describeAdd({
        requested: quantity,
        before,
        after: unitsInCart(),
        cartIsFull: cartStore.getState().items.length >= CART_MAX_LINES,
    });
    toast[type](message, { action: { label: 'Ver carrito', onClick: onViewCart } });
}
