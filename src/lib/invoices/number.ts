/**
 * Numeración de facturas (Real Decreto 1619/2012, art. 6): correlativa y sin huecos dentro de una
 * serie. Aquí hay una serie por año, `F-2026-0001`. El contador vive en `invoice_series`.
 */
const SHOP_TIME_ZONE = 'Europe/Madrid';

/** Prefijo de la serie. */
export const INVOICE_SERIES_PREFIX = 'F';

const YEAR = new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE, year: 'numeric' });

/**
 * Año de una factura: el de su fecha de expedición en la hora de la tienda (Madrid), no el de UTC.
 * Una factura emitida el 31 de diciembre a las 23:30 en Madrid es de ese año aunque en UTC sea la
 * 22:30 del mismo día, y una emitida el 1 de enero a las 00:30 en Madrid es del año nuevo aunque
 * en UTC aún sea el 31 de diciembre.
 *
 * @param issueDate - Cuándo se emite.
 * @returns El año, por ejemplo `2026`.
 */
export function invoiceYear(issueDate: Date): number {
    return Number(YEAR.format(issueDate));
}

/**
 * Número de factura: `F-` + año + `-` + número de orden con 4 cifras como mínimo.
 *
 * @param year - Año de la serie.
 * @param sequence - Número de orden dentro del año (entero >= 1).
 * @throws {RangeError} Si el año no es de cuatro cifras o el orden no es un entero >= 1.
 *
 * @example
 * formatInvoiceNumber(2026, 1); // 'F-2026-0001'
 * formatInvoiceNumber(2026, 12345); // 'F-2026-12345'
 */
export function formatInvoiceNumber(year: number, sequence: number): string {
    if (!Number.isInteger(year) || year < 1000 || year > 9999)
        throw new RangeError(`Año de factura no válido: ${year}`);
    if (!Number.isInteger(sequence) || sequence < 1)
        throw new RangeError(`Número de factura no válido: ${sequence}`);
    return `${INVOICE_SERIES_PREFIX}-${year}-${String(sequence).padStart(4, '0')}`;
}
