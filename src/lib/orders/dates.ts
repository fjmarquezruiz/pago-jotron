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

const ZONE_PARTS = format({
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
});

/** Minutos que la hora de la tienda adelanta a UTC en un instante (60 en invierno, 120 en verano). */
function shopOffsetMinutes(instant: number): number {
    const part = Object.fromEntries(
        ZONE_PARTS.formatToParts(new Date(instant)).map(({ type, value }) => [type, Number(value)]),
    );
    const local = Date.UTC(
        part.year,
        part.month - 1,
        part.day,
        part.hour,
        part.minute,
        part.second,
    );
    return Math.round((local - instant) / 60_000);
}

const toDbDatetime = (instant: number) =>
    new Date(instant).toISOString().slice(0, 19).replace('T', ' ');

/**
 * Primer instante de un día `AAAA-MM-DD` en la hora de la tienda (la medianoche de Madrid), como
 * `datetime` UTC de la BD (`AAAA-MM-DD HH:MM:SS`). Es lo que hay que comparar con `>=` para el
 * "desde" de un filtro por días: un asiento del 15/11 a las 00:30 en Madrid está guardado como
 * 14/11 23:30 UTC. Respeta los días de cambio de hora (23 y 25 horas): el cambio se hace a las
 * 02:00-03:00 locales, nunca a medianoche, así que la medianoche siempre existe y es única.
 *
 * @param isoDate - Día real `AAAA-MM-DD`.
 * @example
 * shopDayStartUtc('2026-11-15'); // '2026-11-14 23:00:00'
 * shopDayStartUtc('2026-07-15'); // '2026-07-14 22:00:00'
 */
export function shopDayStartUtc(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    const midnightAsUtc = Date.UTC(year, month - 1, day);
    // La primera estimación puede caer al otro lado de un cambio de hora: se afina con su propio desfase.
    const guess = midnightAsUtc - shopOffsetMinutes(midnightAsUtc) * 60_000;
    return toDbDatetime(midnightAsUtc - shopOffsetMinutes(guess) * 60_000);
}

/**
 * Primer instante del día SIGUIENTE a `isoDate` en la hora de la tienda, como `datetime` UTC: el
 * límite exclusivo (`<`) del "hasta" de un filtro por días, para que ese día entre entero.
 *
 * @param isoDate - Día real `AAAA-MM-DD`.
 * @example
 * shopDayEndUtc('2026-10-25'); // '2026-10-25 23:00:00' (el día de 25 horas)
 */
export function shopDayEndUtc(isoDate: string): string {
    const next = new Date(`${isoDate}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return shopDayStartUtc(next.toISOString().slice(0, 10));
}
