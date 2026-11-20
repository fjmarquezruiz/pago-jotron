import { Stepper } from '@/components/ui/stepper';

/** Los pasos de la compra (Figma: checkout-steps). */
const CHECKOUT_STEPS = [
    { label: 'Carrito' },
    { label: 'Datos' },
    { label: 'Pago' },
    { label: 'Confirmar' },
];

interface CheckoutStepsProps {
    /**
     * Paso activo: 0 Carrito, 1 Datos, 2 Pago, 3 Confirmar. Los anteriores se ven completados. Por
     * defecto 0; con `dimmed` se ignora (ninguno está activo).
     */
    current?: 0 | 1 | 2 | 3;
    /** Paso que ha fallado (mismos índices que `current`): se pinta en rojo, con su número. */
    errorStep?: 0 | 1 | 2 | 3;
    /** `true` para el carrito vacío: no hay compra en marcha, ningún paso activo y todos atenuados. */
    dimmed?: boolean;
}

/**
 * Pasos de la compra: Carrito, Datos, Pago y Confirmar. Lo usan el carrito (`current` 0) y las tres
 * páginas del checkout. Con `dimmed` (carrito vacío) ninguno está activo y se ven atenuados.
 *
 * En el rechazo de pago se pasa `current={3}` y `errorStep={3}` (Confirmar en rojo); un error de
 * formulario en Datos, `current={1}` y `errorStep={1}`.
 *
 * @param props.current - Paso activo (0 a 3).
 * @param props.errorStep - Paso con error, si lo hay.
 * @param props.dimmed - `true` para el estado del carrito vacío.
 *
 * @example
 * <CheckoutSteps />
 * <CheckoutSteps current={2} errorStep={2} />
 * <CheckoutSteps dimmed />
 */
export function CheckoutSteps({ current = 0, errorStep, dimmed = false }: CheckoutStepsProps) {
    return (
        <Stepper
            aria-label="Pasos de la compra"
            steps={CHECKOUT_STEPS}
            current={dimmed ? -1 : current}
            errorStep={dimmed ? undefined : errorStep}
            disabled={dimmed}
            size="lg"
        />
    );
}
