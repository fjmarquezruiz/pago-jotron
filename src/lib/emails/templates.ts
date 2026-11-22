import { formatCents, lineTotalCents, priceToCents } from '@/lib/cart/totals';
import { formatOrderMoment } from '@/lib/orders/dates';
import { orderNumber } from '@/lib/orders/format';
import type { OrderEmailData } from '@/lib/db/queries';
import type { EmailMessage } from './send';

/** Qué pasó con el dinero de un pedido anulado (`RefundOutcome` de `changeOrderStatus`). */
export type RefundNotice = 'none' | 'done' | 'failed';

type Content = Omit<EmailMessage, 'to'>;

/** Escapa el texto que viene de la BD antes de ponerlo en HTML. */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const lineLabel = ({ name, vintage }: OrderEmailData['lines'][number]) =>
    vintage === null ? name : `${name} ${vintage}`;

/** Marco común: tabla de una columna, estilos en línea (los clientes de correo ignoran las hojas). */
function layout(title: string, paragraphs: string[], extra = ''): string {
    return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f5f5f4;font-family:Helvetica,Arial,sans-serif;color:#1c1917">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;padding:32px">
<tr><td>
<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.5">${p}</p>`).join('\n')}
${extra}
<p style="margin:24px 0 0;font-size:12px;color:#78716c">Pago de Jotrón</p>
</td></tr></table></td></tr></table></body></html>`;
}

/** Tabla con las líneas del pedido, el envío y el total. */
function summary(order: OrderEmailData): { html: string; text: string } {
    const rows = order.lines.map((line) => ({
        label: lineLabel(line),
        detail: `${line.quantity} × ${formatCents(priceToCents(line.unitPrice))}`,
        amount: formatCents(lineTotalCents(line.unitPrice, line.quantity)),
    }));
    const shipping = formatCents(priceToCents(order.shippingCost));
    const total = formatCents(priceToCents(order.total));
    const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;border-top:1px solid #e7e5e4">
${rows
    .map(
        (r) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #e7e5e4">${escapeHtml(r.label)}<br><span style="color:#78716c;font-size:12px">${r.detail}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #e7e5e4">${r.amount}</td></tr>`,
    )
    .join('\n')}
<tr><td style="padding:8px 0">Envío</td><td align="right" style="padding:8px 0">${shipping}</td></tr>
<tr><td style="padding:8px 0;font-weight:bold">Total (IVA incluido)</td><td align="right" style="padding:8px 0;font-weight:bold">${total}</td></tr>
</table>`;
    const text = [
        ...rows.map((r) => `- ${r.label}: ${r.detail} = ${r.amount}`),
        `Envío: ${shipping}`,
        `Total (IVA incluido): ${total}`,
    ].join('\n');
    return { html, text };
}

/** `Hola Ana,` o, si la cuenta no tiene nombre, `Hola,`. */
const greeting = ({ name }: OrderEmailData) => (name?.trim() ? `Hola ${name.trim()},` : 'Hola,');

/** Une los párrafos de texto plano. */
const plain = (...blocks: string[]) => blocks.join('\n\n');

/**
 * Correo de pedido confirmado (RF7): el pedido está hecho y, con tarjeta, cobrado.
 *
 * @param order - Datos del pedido (`getOrderEmailData`).
 * @returns Asunto y cuerpo (HTML y texto).
 */
export function orderConfirmedEmail(order: OrderEmailData): Content {
    const number = orderNumber(order.orderId);
    const { date } = formatOrderMoment(order.createdAt);
    const { html, text } = summary(order);
    const intro = `${greeting(order)} hemos recibido tu pedido ${number} del ${date} y ya lo estamos preparando.`;
    const outro = 'Te avisaremos cuando cambie su estado. Puedes verlo en «Mi cuenta» → «Pedidos».';
    return {
        subject: `Pedido ${number} confirmado`,
        html: layout(
            `Pedido ${number} confirmado`,
            [escapeHtml(intro)],
            `${html}<p style="margin:0;font-size:14px">${escapeHtml(outro)}</p>`,
        ),
        text: plain(intro, text, outro),
    };
}

/**
 * Correo de transferencia recibida (MVP2): el pedido pasa de «Pendiente de pago» a «Confirmado».
 *
 * @param order - Datos del pedido (`getOrderEmailData`).
 * @returns Asunto y cuerpo (HTML y texto).
 */
export function transferReceivedEmail(order: OrderEmailData): Content {
    const number = orderNumber(order.orderId);
    const { html, text } = summary(order);
    const intro = `${greeting(order)} hemos recibido la transferencia de tu pedido ${number}. Ya está confirmado y lo estamos preparando.`;
    return {
        subject: `Transferencia recibida: pedido ${number}`,
        html: layout(`Transferencia recibida`, [escapeHtml(intro)], html),
        text: plain(intro, text),
    };
}

/** Frase sobre el dinero de un pedido anulado. */
function refundSentence(refund: RefundNotice, total: string): string {
    const amount = formatCents(priceToCents(total));
    if (refund === 'done')
        return `Te hemos devuelto ${amount} a la tarjeta con la que pagaste. Tu banco puede tardar unos días en mostrarlo.`;
    if (refund === 'failed')
        return `Estamos tramitando la devolución de ${amount} a tu tarjeta y te la haremos llegar lo antes posible.`;
    return 'No se ha hecho ningún cargo por este pedido.';
}

/**
 * Correo de pedido anulado, con el aviso del reembolso (RF8).
 *
 * @param order - Datos del pedido (`getOrderEmailData`).
 * @param refund - Qué pasó con el dinero: devuelto, pendiente (falló y se reintenta a mano) o
 * nada que devolver.
 * @returns Asunto y cuerpo (HTML y texto).
 */
export function orderCancelledEmail(order: OrderEmailData, refund: RefundNotice): Content {
    const number = orderNumber(order.orderId);
    const intro = `${greeting(order)} tu pedido ${number} ha sido anulado.`;
    const money = refundSentence(refund, order.total);
    const outro = 'Si tienes cualquier duda, responde a este correo.';
    return {
        subject: `Pedido ${number} anulado`,
        html: layout(`Pedido ${number} anulado`, [
            escapeHtml(intro),
            escapeHtml(money),
            escapeHtml(outro),
        ]),
        text: plain(intro, money, outro),
    };
}
