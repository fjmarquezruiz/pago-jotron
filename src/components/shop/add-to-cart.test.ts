import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({
    success: vi.fn(),
    warning: vi.fn(),
}));
vi.mock('@/components/ui/toast', () => ({ toast }));

import { CART_MAX_LINES } from '@/lib/cart/cart';
import { cartStore } from '@/stores/cart';
import { addToCartWithFeedback } from './add-to-cart';

const onViewCart = vi.fn();
const add = (variantId: number, quantity: number, stock: number) =>
    addToCartWithFeedback({ variantId, quantity, stock, onViewCart });

beforeEach(() => {
    toast.success.mockReset();
    toast.warning.mockReset();
    onViewCart.mockReset();
    cartStore.getState().clear();
});

describe('addToCartWithFeedback', () => {
    it('añade la presentación al carrito y confirma con un toast con "Ver carrito"', () => {
        add(4, 2, 10);

        expect(cartStore.getState().items).toEqual([{ variantId: 4, quantity: 2 }]);
        expect(toast.success).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith('Añadido al carrito', {
            action: { label: 'Ver carrito', onClick: onViewCart },
        });
        expect(toast.warning).not.toHaveBeenCalled();
    });

    it('la acción "Ver carrito" llama a onViewCart', () => {
        add(4, 1, 10);
        toast.success.mock.calls[0][1].action.onClick();
        expect(onViewCart).toHaveBeenCalledTimes(1);
    });

    it('suma a lo que ya había', () => {
        add(4, 2, 10);
        add(4, 3, 10);
        expect(cartStore.getState().items).toEqual([{ variantId: 4, quantity: 5 }]);
    });

    it('si el stock limita lo añadido, avisa (también con "Ver carrito")', () => {
        add(4, 3, 4);
        add(4, 3, 4);

        expect(cartStore.getState().items).toEqual([{ variantId: 4, quantity: 4 }]);
        expect(toast.warning).toHaveBeenCalledWith(
            'Hemos añadido 1 unidad: es todo lo que queda.',
            {
                action: { label: 'Ver carrito', onClick: onViewCart },
            },
        );
    });

    it('si ya tiene todas las unidades, lo dice', () => {
        add(4, 2, 2);
        add(4, 1, 2);
        expect(toast.warning).toHaveBeenCalledWith(
            'Ya tienes en el carrito todas las unidades que quedan.',
            expect.anything(),
        );
    });

    it('con el carrito lleno y una presentación nueva, dice que está lleno', () => {
        for (let id = 1; id <= CART_MAX_LINES; id += 1) add(id, 1, 5);
        toast.success.mockReset();

        add(999, 1, 5);

        expect(cartStore.getState().items).toHaveLength(CART_MAX_LINES);
        expect(toast.warning).toHaveBeenCalledWith(
            `Tu carrito está lleno: puedes tener como máximo ${CART_MAX_LINES} productos distintos.`,
            expect.anything(),
        );
    });
});
