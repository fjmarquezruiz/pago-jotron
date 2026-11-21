import { insertInvoiceQuery, reserveInvoiceSequence, type InvoiceTx } from '@/lib/db/queries';
import { centsToDecimal } from '@/lib/orders/format';
import { buildInvoiceDocument, type InvoiceSource } from './build';
import { formatInvoiceNumber, invoiceYear } from './number';

/** `Date` → `datetime` de la BD (`AAAA-MM-DD HH:MM:SS`, UTC: la conexión fuerza `time_zone = '+00:00'`). */
function toDbDate(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Emite la factura de un pedido que pasa a Entregado (RF8). Tiene que llamarse DENTRO de la
 * transacción del cambio de estado: así un pedido nunca queda Entregado sin factura, y si algo
 * falla se deshace también la reserva del número y no se crea ningún hueco en la numeración.
 *
 * Reserva el siguiente número del año (`reserveInvoiceSequence`, con `SELECT … FOR UPDATE`),
 * monta el documento (`buildInvoiceDocument`) y lo guarda con la base, la cuota y el total, el tipo
 * (completa o simplificada) y una copia congelada de todo lo que enseña la factura.
 *
 * @param tx - La transacción del cambio de estado.
 * @param source - El pedido (`getInvoiceSource`).
 * @param now - Fecha de expedición.
 * @returns El número de la factura, por ejemplo `F-2026-0001`.
 * @throws {Error} Si el documento no se puede montar (falta el destinatario de una factura
 * completa) o la BD falla: el cambio de estado entero se deshace.
 */
export async function issueInvoice(
    tx: InvoiceTx,
    source: InvoiceSource,
    now: Date = new Date(),
): Promise<string> {
    const year = invoiceYear(now);
    const number = formatInvoiceNumber(year, await reserveInvoiceSequence(tx, year));
    const issueDate = toDbDate(now);
    const document = buildInvoiceDocument(source, { number, issueDate });
    await insertInvoiceQuery(tx, {
        orderId: source.orderId,
        number,
        issueDate,
        taxBase: centsToDecimal(document.taxBaseCents),
        taxAmount: centsToDecimal(document.taxAmountCents),
        total: centsToDecimal(document.totalCents),
        kind: document.kind,
        snapshot: document,
    });
    return number;
}
