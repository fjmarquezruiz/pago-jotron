import { formatCents } from '@/lib/cart/totals';
import { formatStepDate } from '@/lib/orders/dates';
import type { OrderDetail } from '@/lib/orders/detail';
import { ORDER_STATUS as S, type OrderStatus } from '@/lib/orders/status';
import { stepperProgress, type PaymentMethod } from '@/lib/orders/status-ui';

/** Qué acciones lleva la cabecera del detalle de un pedido. */
export interface OrderActions {
    /** "Cancelar pedido": solo si el cliente aún puede (`canCustomerCancel`, comprobado en el servidor). */
    cancel: boolean;
    /** Frase "Puedes cancelar el pedido durante las 24 h…": solo donde hay plazo (no en Pendiente de pago). */
    cancelHint: boolean;
    /**
     * "Factura (PDF)": solo en Entregado. `download` si ya tiene factura; `unavailable` (botón
     * deshabilitado) si está Entregado pero aún no se emitió, que no debería pasar.
     */
    invoice: 'download' | 'unavailable' | null;
}

/**
 * Acciones de la cabecera según el estado. La regla de cancelar NO se repite aquí: viene ya
 * calculada en `detail.canCancel`, así nunca se contradice con la API (nunca sale en Bloqueado).
 *
 * @param detail - El pedido (`buildOrderDetail`).
 * @returns Qué botones y avisos enseñar.
 */
export function orderActions(
    detail: Pick<OrderDetail, 'status' | 'canCancel' | 'invoiceNumber'>,
): OrderActions {
    return {
        cancel: detail.canCancel,
        cancelHint:
            detail.canCancel && (detail.status === S.CONFIRMED || detail.status === S.PROCESSING),
        invoice:
            detail.status !== S.DELIVERED
                ? null
                : detail.invoiceNumber !== null
                  ? 'download'
                  : 'unavailable',
    };
}

/**
 * Fechas bajo los pasos del seguimiento. No se guarda el historial de estados (llega en MVP2): solo
 * se conocen la creación (primer paso) y, si el pedido está en un paso, cuándo entró en él. En un
 * pedido Anulado, el paso final es la anulación y lleva su fecha y hora. Bloqueado no es un paso, así
 * que su fecha no se pone en ninguno.
 *
 * @param detail - El pedido (`buildOrderDetail`).
 * @returns La fecha ya formateada por estado.
 */
export function orderStepDates(
    detail: Pick<
        OrderDetail,
        'status' | 'blockedFrom' | 'paymentMethod' | 'createdAt' | 'statusUpdatedAt'
    >,
): Partial<Record<OrderStatus, string>> {
    const { steps } = stepperProgress({
        status: detail.status,
        blockedFrom: detail.blockedFrom,
        paymentMethod: detail.paymentMethod as PaymentMethod,
    });
    const dates: Partial<Record<OrderStatus, string>> = {
        [steps[0]]: formatStepDate(detail.createdAt),
    };
    if (steps.includes(detail.status) && detail.status !== steps[0])
        dates[detail.status] = formatStepDate(detail.statusUpdatedAt);
    return dates;
}

/** Forma de pago para el cliente. No se guardan la marca ni los 4 últimos dígitos: nunca se enseñan. */
export function paymentMethodLabel(method: string): string {
    return method === 'Transferencia' ? 'Transferencia bancaria' : method;
}

/** "Estándar (Gratis)" o "Estándar (4,95 €)": modalidad de envío con su coste guardado. */
export function shippingLabel(shipping: { name: string; cost: string }): string {
    const cents = Math.round(Number(shipping.cost) * 100);
    return `${shipping.name} (${cents === 0 ? 'Gratis' : formatCents(cents)})`;
}
