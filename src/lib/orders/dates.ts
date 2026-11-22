/**
 * Fechas de un pedido tal como se ven en la cuenta del cliente. La BD guarda `datetime` sin zona,
 * en UTC (la conexión fuerza `time_zone = '+00:00'`): aquí se leen como UTC y se muestran en la
 * hora de la tienda, la de España peninsular.
 */
const SHOP_TIME_ZONE = 'Europe/Madrid';

/** Pasa un `datetime` de la BD (`AAAA-MM-DD HH:MM:SS`, UTC) a `Date`. */
export function parseDbDate(value: string): Date {
    return new Date(`${value.replace(' ', 'T')}Z`);
}

const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-ES', { timeZone: SHOP_TIME_ZONE, ...options });

/** Quita el punto que `es-ES` pone tras el mes abreviado (`oct.` → `oct`). */
const noDot = (text: string) => text.replace(/\./g, '');

const SHORT_DATE = format({ day: 'numeric', month: 'short', year: 'numeric' });
const STEP_DATE = format({
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});
const LONG_DATE = format({ day: 'numeric', month: 'long', year: 'numeric' });
const TIME = format({ hour: 'numeric', minute: '2-digit', hourCycle: 'h23' });

/** `10 jul 2025`: la columna Fecha del historial. */
export function formatShortDate(value: string): string {
    return noDot(SHORT_DATE.format(parseDbDate(value)));
}

/** `15 oct, 09:12`: la fecha bajo un paso del seguimiento. */
export function formatStepDate(value: string): string {
    return noDot(STEP_DATE.format(parseDbDate(value)));
}

/** `{ date: '15 de octubre de 2026', time: '9:12' }`: "Fecha del pedido" del detalle. */
export function formatOrderMoment(value: string): { date: string; time: string } {
    const moment = parseDbDate(value);
    return { date: LONG_DATE.format(moment), time: TIME.format(moment) };
}
