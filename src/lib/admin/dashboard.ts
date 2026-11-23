import { ORDER_STATUS as S } from '@/lib/orders/status';
import { formatShortDate, parseDbDate } from '@/lib/orders/dates';

/** Unidades por debajo de las cuales una presentación cuenta como «existencias bajas». */
export const LOW_STOCK_THRESHOLD = 12;

/** Pedidos «activos»: todos menos los que ya terminaron (Entregado) o se anularon. */
export const INACTIVE_ORDER_STATUSES = [S.DELIVERED, S.CANCELLED] as const;

/** Pedidos «pendientes de envío»: pagados y aún en el almacén (aún no Enviado). */
export const PENDING_SHIPMENT_STATUSES = [S.CONFIRMED, S.PROCESSING, S.PREPARED] as const;

/**
 * Pedidos que no cuentan en los ingresos del mes: los anulados y los que aún no se han pagado
 * (una transferencia en «Pendiente de pago» todavía no ha entrado).
 */
export const NO_REVENUE_STATUSES = [S.CANCELLED, S.PENDING] as const;

/** Pedidos que no cuentan en «Vinos más vendidos». */
export const NO_SALES_STATUSES = [S.CANCELLED] as const;

/** Días que mira «Vinos más vendidos». */
export const TOP_SELLING_DAYS = 30;
/** Vinos que enseña «Vinos más vendidos». */
export const TOP_SELLING_LIMIT = 5;
/** Pedidos que enseña «Pedidos recientes». */
export const RECENT_ORDERS_LIMIT = 5;
/** Asientos que enseña «Actividad reciente». */
export const RECENT_ACTIVITY_LIMIT = 5;

/** Fecha UTC como `datetime` de la BD (`AAAA-MM-DD HH:MM:SS`). */
export function toDbDatetime(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

/** Primer instante del mes de `now` (UTC), para «Ingresos del mes hasta la fecha». */
export function monthStart(now: Date): string {
    return toDbDatetime(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
}

/** Hace `days` días respecto a `now`, para «Vinos más vendidos». */
export function daysAgo(now: Date, days: number): string {
    return toDbDatetime(new Date(now.getTime() - days * 24 * 3_600_000));
}

/**
 * Nombre con el que se enseña a un cliente en una tabla: nombre y apellidos, o el correo si no
 * dio nombre (`users.name` y `last_name` pueden ser nulos).
 */
export function customerLabel(name: string | null, lastName: string | null, email: string): string {
    const full = [name, lastName]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ');
    return full || email;
}

/**
 * Cuánto hace de un asiento, para «Actividad reciente»: `Hace 10 minutos`, `Hace 2 horas`, `Ayer`
 * y, a partir de ahí, la fecha corta (`14 oct 2026`).
 *
 * @param value - `audit_logs.logged_at` (`datetime` UTC).
 * @param now - Ahora.
 */
export function activityAge(value: string, now: Date): string {
    const minutes = Math.floor((now.getTime() - parseDbDate(value).getTime()) / 60_000);
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    if (hours < 48) return 'Ayer';
    return formatShortDate(value);
}

/**
 * Frase de un asiento de la auditoría: la acción y, si lo hay, su detalle.
 * @example activityText('Reembolso pendiente', 'pedido 4 anulado') // 'Reembolso pendiente: pedido 4 anulado'
 */
export function activityText(action: string, details: string | null): string {
    const detail = details?.trim();
    return detail ? `${action}: ${detail}` : action;
}
