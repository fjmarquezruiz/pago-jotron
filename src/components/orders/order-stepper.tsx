import { Stepper } from '@/components/ui/stepper';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/orders/status';
import { cancellationLabel, stepperProgress, type PaymentMethod } from '@/lib/orders/status-ui';

interface OrderStepperProps {
    /** Estado actual del pedido. */
    status: OrderStatus;
    /** Estado que tenía antes de bloquearse (`orders.blocked_from_status_id`). */
    blockedFrom?: OrderStatus | null;
    paymentMethod: PaymentMethod;
    /** Quién anuló el pedido: da nombre al paso final de un pedido Anulado. */
    cancelledBy?: 'Cliente' | 'Administrador' | null;
    /**
     * Fecha ya formateada que se ve bajo el nombre de un paso (por ejemplo `15 oct, 09:12`), por
     * estado. Un paso sin fecha solo lleva su nombre.
     */
    dates?: Partial<Record<OrderStatus, string>>;
    className?: string;
}

/**
 * Seguimiento de un pedido (Figma: checkout-steps de account-order-*): Confirmado, En proceso,
 * Preparado, Enviado y Entregado, con Pendiente de pago delante solo en una transferencia. Sale del
 * mismo estado que `OrderStatusBadge` (`stepperProgress`). Llega hasta el último paso alcanzado;
 * Bloqueado y Anulado no son un paso (los enseña `OrderNotice`).
 *
 * @param props.status - Estado actual.
 * @param props.blockedFrom - Estado de origen de un bloqueo.
 * @param props.paymentMethod - Forma de pago del pedido.
 * @param props.dates - Fecha por estado, opcional.
 *
 * @example
 * <OrderStepper status="Confirmado" paymentMethod="Tarjeta" dates={{ Confirmado: '15 oct, 09:12' }} />
 */
export function OrderStepper({
    status,
    blockedFrom,
    paymentMethod,
    cancelledBy = null,
    dates,
    className,
}: OrderStepperProps) {
    const { steps, current, errorStep } = stepperProgress({ status, blockedFrom, paymentMethod });
    const stepper = (orientation: 'horizontal' | 'vertical') => (
        <Stepper
            aria-label="Estado del pedido"
            tracking
            size="md"
            orientation={orientation}
            current={current}
            errorStep={errorStep ?? undefined}
            steps={steps.map((step) => ({
                label: step === 'Anulado' ? cancellationLabel(cancelledBy) : step,
                description: dates?.[step],
            }))}
        />
    );
    // Los pasos no caben en fila en pantallas pequeñas: en vertical hasta `md`.
    return (
        <div
            className={cn(
                'overflow-clip rounded-sm bg-secondary p-inset-lg md:p-inset-xl',
                className,
            )}
        >
            <div className="hidden md:block">{stepper('horizontal')}</div>
            <div className="md:hidden">{stepper('vertical')}</div>
        </div>
    );
}
