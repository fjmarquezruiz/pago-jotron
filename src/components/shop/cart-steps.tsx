import { Stepper } from '@/components/ui/stepper';

/** Los pasos del checkout (Figma: checkout-steps). */
const CHECKOUT_STEPS = [
    { label: 'Carrito' },
    { label: 'Datos' },
    { label: 'Pago' },
    { label: 'Confirmar' },
];

/**
 * Pasos de la compra: Carrito, Datos, Pago y Confirmar. En el carrito el primero está activo; con
 * `dimmed` (carrito vacío, no hay compra en marcha) ninguno lo está y se ven atenuados.
 *
 * @param props.dimmed - `true` para el estado del carrito vacío.
 *
 * @example
 * <CartSteps />
 * <CartSteps dimmed />
 */
export function CartSteps({ dimmed = false }: { dimmed?: boolean }) {
    return (
        <Stepper
            aria-label="Pasos de la compra"
            steps={CHECKOUT_STEPS}
            current={dimmed ? -1 : 0}
            disabled={dimmed}
            size="lg"
        />
    );
}
