import { describe, expect, it } from 'vitest';
import type { OrderEmailData } from '@/lib/db/queries';
import {
    escapeHtml,
    orderCancelledEmail,
    orderConfirmedEmail,
    transferReceivedEmail,
} from './templates';

const order: OrderEmailData = {
    orderId: 12,
    email: 'ana@x.es',
    name: 'Ana <b>',
    total: '33.45',
    shippingCost: '4.95',
    paymentMethod: 'Tarjeta',
    createdAt: '2026-11-01 10:00:00',
    lines: [
        { name: 'Pago de Jotrón', vintage: 2020, quantity: 2, unitPrice: '11.50' },
        { name: 'Moscatel', vintage: null, quantity: 1, unitPrice: '5.50' },
    ],
};

describe('escapeHtml', () => {
    it('escapa lo que pueda abrir una etiqueta o un atributo', () => {
        expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
    });
});

describe('orderConfirmedEmail', () => {
    const mail = orderConfirmedEmail(order);

    it('el asunto lleva el número de pedido', () => {
        expect(mail.subject).toBe('Pedido PJ-12 confirmado');
    });

    it('lista las líneas, el envío y el total', () => {
        for (const part of ['Pago de Jotrón 2020', 'Moscatel', 'Envío', '33,45'])
            expect(mail.text).toContain(part);
        expect(mail.html).toContain('Pago de Jotrón 2020');
    });

    it('menciona la fecha del pedido en la hora de la tienda', () => {
        expect(mail.text).toContain('1 de noviembre de 2026');
    });

    it('escapa en el HTML el nombre del cliente, no en el texto plano', () => {
        expect(mail.html).toContain('Ana &lt;b&gt;');
        expect(mail.html).not.toContain('Ana <b>');
        expect(mail.text).toContain('Ana <b>');
    });
});

describe('saludo', () => {
    it('sin nombre en la cuenta, saluda sin él', () => {
        expect(orderConfirmedEmail({ ...order, name: null }).text).toMatch(/^Hola, hemos/);
    });
});

describe('transferReceivedEmail', () => {
    it('avisa de que llegó la transferencia y de que el pedido está confirmado', () => {
        const mail = transferReceivedEmail(order);
        expect(mail.subject).toBe('Transferencia recibida: pedido PJ-12');
        expect(mail.text).toContain('hemos recibido la transferencia');
        expect(mail.text).toContain('33,45');
    });
});

describe('orderCancelledEmail', () => {
    it('reembolso hecho: dice cuánto se devuelve', () => {
        const mail = orderCancelledEmail(order, 'done');
        expect(mail.subject).toBe('Pedido PJ-12 anulado');
        expect(mail.text).toContain('Te hemos devuelto');
        expect(mail.text).toContain('33,45');
    });

    it('reembolso fallido: promete tramitarlo, no dice que ya está devuelto', () => {
        const mail = orderCancelledEmail(order, 'failed');
        expect(mail.text).toContain('Estamos tramitando la devolución');
        expect(mail.text).not.toContain('Te hemos devuelto');
    });

    it('sin cobro: no hay cargo', () => {
        expect(orderCancelledEmail(order, 'none').text).toContain('No se ha hecho ningún cargo');
    });
});
