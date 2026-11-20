/**
 * Entrega estimada de un pedido (RF7, RF8) como funciones puras.
 *
 * Decisión de zona horaria: la fecha de entrega es un día de calendario, sin hora. Aquí una
 * fecha se interpreta siempre por su día en UTC (`getUTC*`): quien llama construye "el día X"
 * con `calendarDate('2026-10-15')` o `Date.UTC(...)`, y nunca con `new Date()` local, que según
 * la zona del servidor (UTC en Vercel, Europe/Madrid en local) caería en otro día cerca de la
 * medianoche. Así el resultado no depende de la zona del proceso. No se tienen en cuenta festivos:
 * solo se saltan sábados y domingos.
 */

/** Milisegundos de un día. UTC no tiene cambios de hora, así que todos los días miden lo mismo. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Fecha con el formato `AAAA-MM-DD`. */
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Día de calendario a partir de un texto `AAAA-MM-DD` (o de una fecha-hora que empiece así, como
 * `orders.created_at`: se ignora la hora), como `Date` a medianoche UTC.
 *
 * @param text - Texto con la fecha.
 * @returns La fecha, a las 00:00 UTC.
 * @throws {RangeError} Si no empieza por una fecha válida.
 *
 * @example
 * calendarDate('2026-10-15 18:30:00'); // 2026-10-15T00:00:00.000Z
 */
export function calendarDate(text: string): Date {
    const match = ISO_DATE_PATTERN.exec(text);
    if (match) {
        const [, year, month, day] = match.map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCMonth() === month - 1 && date.getUTCDate() === day) return date;
    }
    throw new RangeError(`Fecha no válida: ${text}`);
}

/**
 * Pasa un día de calendario a `AAAA-MM-DD`.
 *
 * @param date - La fecha (se usa su día en UTC).
 * @returns Por ejemplo `'2026-10-15'`.
 */
export function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/**
 * Fecha estimada de entrega: `from` más `maxDays` días laborables (lunes a viernes). Se cuentan
 * los días a partir del siguiente a `from`, saltando sábados y domingos. Con plazo 0 devuelve el
 * mismo día, aunque sea fin de semana.
 *
 * @param from - Día de partida, interpretado por su día en UTC (ver `calendarDate`).
 * @param maxDays - Días máximos de entrega del tipo de envío (`shipping_types.max_delivery_days`): entero >= 0.
 * @returns El día de entrega, a las 00:00 UTC.
 * @throws {RangeError} Si `maxDays` no es un entero >= 0 o `from` no es una fecha válida.
 *
 * @example
 * estimatedDeliveryDate(calendarDate('2026-10-16'), 1); // viernes + 1 → lunes 2026-10-19
 */
export function estimatedDeliveryDate(from: Date, maxDays: number): Date {
    if (!Number.isInteger(maxDays) || maxDays < 0)
        throw new RangeError(`Plazo no válido: ${maxDays}`);
    if (Number.isNaN(from.getTime())) throw new RangeError('Fecha no válida');

    let time = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
    for (let remaining = maxDays; remaining > 0;) {
        time += DAY_MS;
        const weekday = new Date(time).getUTCDay();
        if (weekday !== 0 && weekday !== 6) remaining -= 1;
    }
    return new Date(time);
}

const dateFormat = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
});

/**
 * Fecha de entrega para mostrarla: día de la semana abreviado con inicial mayúscula, día y mes
 * abreviado, sin puntos (es-ES). Usa el día en UTC, igual que `estimatedDeliveryDate`.
 *
 * @param date - La fecha.
 * @returns Por ejemplo `'Jue, 18 oct'`.
 *
 * @example
 * formatDeliveryDate(calendarDate('2026-10-18')); // 'Dom, 18 oct'
 */
export function formatDeliveryDate(date: Date): string {
    const text = dateFormat.format(date).replace(/\./g, '');
    return text.charAt(0).toUpperCase() + text.slice(1);
}
