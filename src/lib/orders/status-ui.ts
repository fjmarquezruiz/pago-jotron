/**
 * De estado a interfaz (RF8): el color de cada estado, los pasos del seguimiento y los avisos. Es la
 * ÚNICA fuente: el `Badge` y el stepper de un pedido salen de aquí, así que nunca se contradicen
 * (antes el badge decía "Confirmado" mientras el stepper marcaba Bloqueado).
 */
import { ORDER_STATUS as S, type OrderStatus } from './status';

/** Tono del `Badge` y del aviso. Un color fijo por estado en todo el sitio. */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'destructive';

export const STATUS_TONE: Record<OrderStatus, StatusTone> = {
    [S.PENDING]: 'neutral',
    [S.CONFIRMED]: 'info',
    [S.PROCESSING]: 'info',
    [S.PREPARED]: 'info',
    [S.SHIPPED]: 'info',
    [S.DELIVERED]: 'success',
    [S.BLOCKED]: 'warning',
    [S.CANCELLED]: 'destructive',
};

/** Forma de pago de `orders.payment_method`. */
export type PaymentMethod = 'Tarjeta' | 'PayPal' | 'Transferencia';

/** Camino normal de un pedido, de principio a fin. */
const FLOW: readonly OrderStatus[] = [
    S.PENDING,
    S.CONFIRMED,
    S.PROCESSING,
    S.PREPARED,
    S.SHIPPED,
    S.DELIVERED,
];

/**
 * Pasos del seguimiento de un pedido. Son 5 (de Confirmado a Entregado); solo la transferencia
 * añade antes 'Pendiente de pago', porque un pedido de tarjeta ya nace Confirmado. Bloqueado y
 * Anulado no son pasos: se enseñan con un aviso (`stepperProgress`).
 *
 * @param paymentMethod - `orders.payment_method`.
 * @returns Los estados que son paso, en orden.
 */
export function orderSteps(paymentMethod: PaymentMethod): OrderStatus[] {
    return paymentMethod === 'Transferencia' ? [...FLOW] : FLOW.slice(1);
}

/** Aviso que acompaña al stepper. Anulado no lleva: lo cuenta el último paso del seguimiento. */
export type OrderNoticeKind = 'pending-payment' | 'blocked';

/** Tipo de `Alert`, título en negrita y resto del texto de cada aviso. */
export const ORDER_NOTICES: Record<
    OrderNoticeKind,
    { type: 'warning' | 'error'; title: string; description?: string }
> = {
    'pending-payment': {
        type: 'warning',
        title: 'Estamos esperando tu transferencia.',
        description: 'Prepararemos el pedido cuando la recibamos.',
    },
    blocked: {
        type: 'warning',
        title: 'Tu pedido está en revisión.',
        description: 'Nos pondremos en contacto contigo.',
    },
};

export interface StepperProgress {
    /** Estados que son paso, en orden; en un pedido Anulado, los alcanzados y 'Anulado' al final. */
    steps: OrderStatus[];
    /** Índice del último paso alcanzado. */
    current: number;
    /** Índice del paso en error (la anulación), o `null`. */
    errorStep: number | null;
    /** Aviso que va encima de las líneas del pedido, o `null`. */
    notice: OrderNoticeKind | null;
}

/**
 * Pasos y progreso del stepper de un pedido, y su aviso. El stepper llega hasta el último paso
 * ALCANZADO: un pedido Bloqueado se pinta hasta el estado del que venía (`blockedFrom`), y uno
 * Anulado también si se sabe (si no, solo el primero) y termina en un paso final 'Anulado', en error
 * (`errorStep`): el seguimiento cuenta la cancelación. Bloqueado no es un paso: lleva un aviso.
 *
 * @param input.status - Estado actual del pedido.
 * @param input.blockedFrom - Estado que tenía antes de bloquearse (`orders.blocked_from_status_id`).
 * @param input.paymentMethod - `orders.payment_method`.
 * @returns Los pasos, el índice alcanzado y el aviso.
 *
 * @example
 * stepperProgress({ status: 'Bloqueado', blockedFrom: 'En proceso', paymentMethod: 'Tarjeta' });
 * // { steps: [Confirmado … Entregado], current: 1, notice: 'blocked' }
 */
export function stepperProgress({
    status,
    blockedFrom = null,
    paymentMethod,
}: {
    status: OrderStatus;
    blockedFrom?: OrderStatus | null;
    paymentMethod: PaymentMethod;
}): StepperProgress {
    let steps = orderSteps(paymentMethod);
    // Un pedido Pendiente de pago de otra forma de pago (no debería pasar) no puede quedarse sin su paso.
    if (!steps.includes(S.PENDING) && (status === S.PENDING || blockedFrom === S.PENDING))
        steps = [...FLOW];

    const reached = status === S.BLOCKED || status === S.CANCELLED ? blockedFrom : status;
    const index = Math.max(reached === null ? -1 : steps.indexOf(reached), 0);

    if (status === S.CANCELLED) {
        // Lo alcanzado y, al final, la anulación: es lo único que sabemos de ese pedido.
        const reachedSteps = [...steps.slice(0, index + 1), S.CANCELLED];
        return {
            steps: reachedSteps,
            current: reachedSteps.length - 1,
            errorStep: reachedSteps.length - 1,
            notice: null,
        };
    }
    return {
        steps,
        current: index,
        errorStep: null,
        notice: status === S.PENDING ? 'pending-payment' : status === S.BLOCKED ? 'blocked' : null,
    };
}

/**
 * Texto del paso final de un pedido anulado, según quién lo anuló (`orders.cancelled_by`): "Cancelado
 * por ti" si fue el cliente, "Anulado por la tienda" si fue administración y "Anulado" si no consta
 * (lo anuló el sistema al fallar el cobro).
 *
 * @param cancelledBy - `orders.cancelled_by`.
 */
export function cancellationLabel(cancelledBy: 'Cliente' | 'Administrador' | null): string {
    if (cancelledBy === 'Cliente') return 'Cancelado por ti';
    if (cancelledBy === 'Administrador') return 'Anulado por la tienda';
    return 'Anulado';
}
