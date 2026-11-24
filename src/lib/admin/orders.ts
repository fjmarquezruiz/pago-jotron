/**
 * Reglas del panel de pedidos (CU11). Funciones puras: lo que ve y puede hacer el administrador en
 * el listado y en el detalle de un pedido sale de aquí, y las reglas de los estados son las de
 * `status.ts` (la API vuelve a comprobarlas).
 */
import { formatShortDate } from '@/lib/orders/dates';
import {
    canTransition,
    ORDER_STATUS as S,
    returnsStockOnCancel,
    type OrderStatus,
} from '@/lib/orders/status';

/** Ruta del listado de pedidos del panel. */
export const ADMIN_ORDERS_PATH = '/admin/pedidos';

/** Pedidos por página del listado (Figma: "Mostrando 1-10 de 142"). */
export const ADMIN_ORDERS_PAGE_SIZE = 10;

/** Filtros del listado tal como viajan en la URL (`estado`, `desde`, `hasta`, `q`). */
export interface AdminOrderFilters {
    status?: string;
    /** Primer día incluido, `AAAA-MM-DD`. */
    from?: string;
    /** Último día incluido, `AAAA-MM-DD`. */
    to?: string;
    /** Texto buscado: número de pedido (`PJ-4521`, `4521`) o parte del correo del cliente. */
    q?: string;
}

/** `true` si hay algún filtro puesto. */
export function hasAdminOrderFilters({ status, from, to, q }: AdminOrderFilters): boolean {
    return Boolean(status || from || to || q);
}

/**
 * Enlace a una página del listado conservando los filtros: `/admin/pedidos?pagina=2&estado=Enviado`.
 * La página 1 va sin `pagina`.
 *
 * @example
 * adminOrdersHref({ page: 2, status: 'Enviado' }); // '/admin/pedidos?pagina=2&estado=Enviado'
 */
export function adminOrdersHref({
    page = 1,
    status,
    from,
    to,
    q,
}: AdminOrderFilters & { page?: number }): string {
    const query = new URLSearchParams();
    if (page > 1) query.set('pagina', String(page));
    if (status) query.set('estado', status);
    if (from) query.set('desde', from);
    if (to) query.set('hasta', to);
    if (q) query.set('q', q);
    const text = query.toString();
    return text ? `${ADMIN_ORDERS_PATH}?${text}` : ADMIN_ORDERS_PATH;
}

/** Un `AAAA-MM-DD` como `10 jul 2025`. */
const day = (iso: string) => formatShortDate(`${iso} 12:00:00`);

/**
 * Texto de los chips de "Filtros activos": `Estado: todos` o el elegido y `Fecha: todas`, `Fecha:
 * desde 1 jul 2026`, `hasta 31 jul 2026` o el rango. La búsqueda, si la hay, es un chip aparte con
 * el texto tal cual (Figma: wineries-list-search-applied).
 *
 * @returns Los chips de estado y fecha, y el texto buscado si lo hay.
 */
export function adminFilterLabels({ status, from, to, q }: AdminOrderFilters): {
    status: string;
    date: string;
    search?: string;
} {
    let date = 'todas';
    if (from && to) date = `${day(from)} – ${day(to)}`;
    else if (from) date = `desde ${day(from)}`;
    else if (to) date = `hasta ${day(to)}`;
    return {
        status: `Estado: ${status ? status.toLowerCase() : 'todos'}`,
        date: `Fecha: ${date}`,
        ...(q && { search: q }),
    };
}

/**
 * Pie de la tabla. Sin filtros, `Mostrando 1-10 de 142`; con filtros, `Mostrando 3 pedidos
 * filtrados de 142`; sin resultados, `Mostrando 0 de 0`.
 *
 * @param input.page - Página mostrada (desde 1).
 * @param input.pageSize - Pedidos por página.
 * @param input.shown - Cuántos salen en esta página.
 * @param input.total - Total con los filtros puestos.
 * @param input.overall - Total de pedidos sin filtros.
 * @param input.filtered - Si hay algún filtro puesto.
 */
export function adminRangeText({
    page,
    pageSize,
    shown,
    total,
    overall,
    filtered,
}: {
    page: number;
    pageSize: number;
    shown: number;
    total: number;
    overall: number;
    filtered: boolean;
}): string {
    if (shown === 0) return 'Mostrando 0 de 0';
    if (filtered)
        return `Mostrando ${total} ${total === 1 ? 'pedido filtrado' : 'pedidos filtrados'} de ${overall}`;
    const first = (page - 1) * pageSize + 1;
    return `Mostrando ${first}-${first + shown - 1} de ${total}`;
}

/**
 * Cómo se busca el texto de la barra: `id` si es un número de pedido (`4521`, `PJ-4521`,
 * `#PJ-4521`) y `email` en cualquier otro caso (se busca dentro del correo del cliente).
 *
 * @returns La forma de buscar, o `null` si no hay nada que buscar.
 */
export function parseOrderSearch(
    q: string | undefined,
): { kind: 'id'; id: number } | { kind: 'email'; text: string } | null {
    const text = q?.trim();
    if (!text) return null;
    const match = /^#?(?:pj-?)?(\d{1,10})$/i.exec(text);
    if (match) {
        const id = Number(match[1]);
        if (Number.isSafeInteger(id) && id >= 1) return { kind: 'id', id };
    }
    return { kind: 'email', text };
}

/** Botón principal del detalle y a qué estado lleva. */
export interface AdminPrimaryAction {
    label: string;
    to: OrderStatus;
}

/**
 * Botón principal de un pedido: "Confirmar pago" en Pendiente de pago (Figma), "Reanudar pedido" en
 * Bloqueado (pasa al estado siguiente al que tenía) y "Pasar a <siguiente>" en el resto del camino.
 * Los estados finales no tienen.
 *
 * @param status - Estado actual.
 * @param blockedFrom - Estado que tenía antes de bloquearse.
 * @returns La acción, o `null` si el pedido no avanza.
 */
export function primaryAction(
    status: OrderStatus,
    blockedFrom: OrderStatus | null,
): AdminPrimaryAction | null {
    const order: OrderStatus[] = [
        S.PENDING,
        S.CONFIRMED,
        S.PROCESSING,
        S.PREPARED,
        S.SHIPPED,
        S.DELIVERED,
    ];
    if (status === S.BLOCKED) {
        const next = blockedFrom ? order[order.indexOf(blockedFrom) + 1] : undefined;
        if (!next || !canTransition(status, next, { blockedFrom })) return null;
        return { label: 'Reanudar pedido', to: next };
    }
    const next = order[order.indexOf(status) + 1];
    if (!next || !canTransition(status, next)) return null;
    return { label: status === S.PENDING ? 'Confirmar pago' : `Pasar a ${next}`, to: next };
}

/** `true` si el administrador puede anular el pedido (según `canTransition`). */
export function canAdminCancel(status: OrderStatus, blockedFrom: OrderStatus | null): boolean {
    return canTransition(status, S.CANCELLED, { blockedFrom });
}

/**
 * Seguimiento de un pedido para el panel (Figma: admin-order-blocked). A diferencia del del cliente,
 * Bloqueado SÍ es un paso, en error, justo después del último estado alcanzado y antes de los que
 * faltan; el panel no lleva aviso. Los demás estados son los de `stepperProgress`.
 *
 * @param base - `stepperProgress(...)` del pedido.
 * @param status - Estado actual.
 * @param blockedFrom - Estado que tenía antes de bloquearse.
 */
export function adminStepperProgress(
    base: { steps: OrderStatus[]; current: number; errorStep: number | null },
    status: OrderStatus,
): { steps: OrderStatus[]; current: number; errorStep: number | null } {
    if (status !== S.BLOCKED) return base;
    const at = base.current + 1;
    const steps = [...base.steps.slice(0, at), S.BLOCKED, ...base.steps.slice(at)];
    return { steps, current: at, errorStep: at };
}

/**
 * Frase bajo el título del detalle. Pendiente de pago y Bloqueado llevan la suya (Figma); en el
 * resto, la fecha, el número de artículos y el total.
 *
 * @param input.status - Estado actual.
 * @param input.paymentMethod - Forma de pago.
 * @param input.moment - `{ date, time }` del pedido (`formatOrderMoment`).
 * @param input.units - Artículos (suma de cantidades).
 * @param input.total - Total ya formateado (`129,30 €`).
 */
export function adminOrderDescription({
    status,
    paymentMethod,
    moment,
    units,
    total,
}: {
    status: OrderStatus;
    paymentMethod: string;
    moment: { date: string; time: string };
    units: number;
    total: string;
}): string {
    if (status === S.PENDING && paymentMethod === 'Transferencia')
        return 'Pendiente de pago por transferencia. Confirma el cobro cuando llegue el ingreso.';
    if (status === S.BLOCKED)
        return 'Bloqueado: lleva más de 15 días sin avanzar. Revísalo y reanúdalo o anúlalo.';
    return `Realizado el ${moment.date} a las ${moment.time} - ${units} ${units === 1 ? 'artículo' : 'artículos'} - Total ${total}`;
}

/**
 * Frase del modal de anular sobre lo que pasa con el stock y el dinero. Solo promete lo que la API
 * hace de verdad (`changeOrderStatus`): el stock vuelve si las botellas no han salido del almacén
 * (`returnsStockOnCancel`) y el importe se devuelve solo si se pagó con tarjeta y ya estaba cobrado.
 *
 * @param input.status - Estado actual.
 * @param input.blockedFrom - Estado que tenía antes de bloquearse.
 * @param input.paymentMethod - Forma de pago.
 * @returns La frase, o `null` si no pasa ni una cosa ni la otra.
 */
export function cancelNotice({
    status,
    blockedFrom,
    paymentMethod,
}: {
    status: OrderStatus;
    blockedFrom: OrderStatus | null;
    paymentMethod: string;
}): string | null {
    const restocks = returnsStockOnCancel(status, blockedFrom);
    const refunds = paymentMethod === 'Tarjeta' && status !== S.PENDING;
    const money = 'devolveremos el importe al cliente con el mismo método de pago';
    if (restocks && refunds) return `El stock vuelve al catálogo y ${money}.`;
    if (restocks) return 'El stock vuelve al catálogo.';
    if (refunds) return `${money[0].toUpperCase()}${money.slice(1)}.`;
    return null;
}

/**
 * Texto del paso final de un pedido anulado, visto desde la tienda: "Cancelado por el cliente",
 * "Anulado por la tienda" o "Anulado" si no consta (lo anuló el sistema al fallar el cobro).
 *
 * @param cancelledBy - `orders.cancelled_by`.
 */
export function adminCancellationLabel(cancelledBy: 'Cliente' | 'Administrador' | null): string {
    if (cancelledBy === 'Cliente') return 'Cancelado por el cliente';
    if (cancelledBy === 'Administrador') return 'Anulado por la tienda';
    return 'Anulado';
}
