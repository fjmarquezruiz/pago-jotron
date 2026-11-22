/**
 * Máquina de estados de un pedido (RF8, CU7, CU11). Funciones puras: no tocan la base de datos
 * ni leen el reloj, así que el panel (A11) y las acciones del cliente comparten las mismas reglas.
 */

/** Nombres de `order_statuses.name`. */
export const ORDER_STATUS = {
    PENDING: 'Pendiente de pago',
    CONFIRMED: 'Confirmado',
    PROCESSING: 'En proceso',
    PREPARED: 'Preparado',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    BLOCKED: 'Bloqueado',
    CANCELLED: 'Anulado',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

const S = ORDER_STATUS;

/** Siguiente estado del camino normal de un pedido; los finales y Bloqueado no tienen. */
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
    [S.PENDING]: S.CONFIRMED,
    [S.CONFIRMED]: S.PROCESSING,
    [S.PROCESSING]: S.PREPARED,
    [S.PREPARED]: S.SHIPPED,
    [S.SHIPPED]: S.DELIVERED,
};

/** Estados desde los que aún se puede anular. */
const CANCELLABLE = new Set<OrderStatus>([S.PENDING, S.CONFIRMED, S.PROCESSING]);

/** Estados en los que las botellas del pedido siguen en el almacén y vuelven al stock al anular. */
const RESTOCKABLE = new Set<OrderStatus>([S.PENDING, S.CONFIRMED, S.PROCESSING]);

/** Estados finales: no admiten ningún cambio. */
const FINAL = new Set<OrderStatus>([S.DELIVERED, S.CANCELLED]);

/** Horas durante las que el cliente puede cancelar un pedido Confirmado o En proceso (CU7). */
export const CUSTOMER_CANCEL_HOURS = 24;

/** Días en el mismo estado a partir de los cuales un pedido se bloquea. */
export const BLOCK_AFTER_DAYS = 15;

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** Lo que necesitan las reglas de tiempo de un pedido. */
export interface OrderTiming {
    status: OrderStatus;
    /** Cuándo se hizo el pedido (`orders.created_at`). */
    createdAt: Date | string;
    /** Cuándo entró en el estado actual (`orders.status_updated_at`). */
    statusUpdatedAt: Date | string;
}

export interface TransitionOptions {
    /** El pedido solo tiene visitas o catas: puede pasar directamente a Entregado. */
    onlyEvents?: boolean;
    /** Estado que tenía el pedido antes de bloquearse (`orders.blocked_from_status_id`). */
    blockedFrom?: OrderStatus | null;
}

/**
 * Indica si un pedido puede pasar de un estado a otro. No se saltan estados (CU11, E5), salvo los
 * pedidos que solo tienen eventos, que van directos a Entregado. Un pedido Bloqueado vuelve al
 * estado siguiente al que tenía (`blockedFrom`) o se anula; sin `blockedFrom` solo puede anularse.
 */
export function canTransition(
    from: OrderStatus,
    to: OrderStatus,
    { onlyEvents = false, blockedFrom = null }: TransitionOptions = {},
): boolean {
    if (FINAL.has(from)) return false;

    if (from === S.BLOCKED) {
        if (to === S.CANCELLED) return true;
        const resume = blockedFrom ? NEXT[blockedFrom] : undefined;
        return resume !== undefined && to === resume;
    }

    if (to === S.CANCELLED) return CANCELLABLE.has(from);
    if (NEXT[from] === to) return true;
    return onlyEvents && to === S.DELIVERED && from !== S.PENDING;
}

/**
 * Indica si al anular el pedido hay que devolver sus unidades al stock: solo si todavía no han
 * salido del almacén, es decir, si estaba en Pendiente de pago, Confirmado o En proceso. Un pedido
 * Bloqueado cuenta por el estado que tenía al bloquearse (`blockedFrom`); si no se sabe cuál era,
 * no se devuelve nada, porque sumar unidades que quizá ya salieron inflaría el stock.
 */
export function returnsStockOnCancel(from: OrderStatus, blockedFrom: OrderStatus | null): boolean {
    const origin = from === S.BLOCKED ? blockedFrom : from;
    return origin !== null && RESTOCKABLE.has(origin);
}

/** Convierte una fecha de la base de datos (`YYYY-MM-DD HH:MM:SS`, sin zona, tratada como UTC) a ms. */
function toMs(value: Date | string): number {
    if (value instanceof Date) return value.getTime();
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
    return new Date(hasZone ? value : `${value.replace(' ', 'T')}Z`).getTime();
}

/**
 * Indica si el cliente puede cancelar el pedido (CU7): en Pendiente de pago, siempre; en Confirmado
 * o En proceso, solo durante las primeras 24 h desde que se hizo el pedido.
 */
export function canCustomerCancel(order: OrderTiming, now: Date): boolean {
    if (order.status === S.PENDING) return true;
    if (order.status !== S.CONFIRMED && order.status !== S.PROCESSING) return false;
    return now.getTime() - toMs(order.createdAt) <= CUSTOMER_CANCEL_HOURS * HOUR_MS;
}

/** Indica si el pedido lleva más de 15 días en el mismo estado, salvo los finales y Bloqueado. */
export function shouldBlock(order: OrderTiming, now: Date): boolean {
    if (FINAL.has(order.status) || order.status === S.BLOCKED) return false;
    return now.getTime() - toMs(order.statusUpdatedAt) > BLOCK_AFTER_DAYS * DAY_MS;
}
