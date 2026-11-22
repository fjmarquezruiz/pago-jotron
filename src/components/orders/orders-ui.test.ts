import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ORDER_STATUS as S, type OrderStatus } from '@/lib/orders/status';
import { OrderNotice } from './order-notice';
import { OrderStatusBadge } from './order-status-badge';
import { OrderStepper } from './order-stepper';

const html = (node: React.ReactElement) => renderToStaticMarkup(node);
const count = (text: string, part: string) => text.split(part).length - 1;
/** El stepper se pinta dos veces (en fila desde `md`, en vertical por debajo): estos tests miran la de fila. */
const desktop = (markup: string) => markup.split('<div class="md:hidden">')[0];

describe('OrderStatusBadge', () => {
    it.each([
        [S.PENDING, 'bg-primary'],
        [S.CONFIRMED, 'bg-info'],
        [S.SHIPPED, 'bg-info'],
        [S.DELIVERED, 'bg-success'],
        [S.BLOCKED, 'bg-warning'],
        [S.CANCELLED, 'bg-destructive'],
    ] as [OrderStatus, string][])('%s usa su color fijo', (status, color) => {
        const out = html(createElement(OrderStatusBadge, { status }));
        expect(out).toContain(status);
        expect(out).toContain(color);
    });

    it('Enviado y Confirmado comparten color (antes uno salía negro y otro naranja)', () => {
        const a = html(createElement(OrderStatusBadge, { status: S.SHIPPED }));
        const b = html(createElement(OrderStatusBadge, { status: S.CONFIRMED }));
        expect(a.replace(S.SHIPPED, '')).toBe(b.replace(S.CONFIRMED, ''));
    });
});

describe('OrderStepper', () => {
    const stepper = (props: Partial<React.ComponentProps<typeof OrderStepper>> = {}) =>
        html(
            createElement(OrderStepper, {
                status: S.CONFIRMED,
                paymentMethod: 'Tarjeta',
                ...props,
            }),
        );

    it('con tarjeta enseña 5 pasos y no Pendiente de pago', () => {
        const out = desktop(stepper());
        for (const label of [S.CONFIRMED, S.PROCESSING, S.PREPARED, S.SHIPPED, S.DELIVERED])
            expect(out).toContain(label);
        expect(out).not.toContain(S.PENDING);
    });

    it('con transferencia añade Pendiente de pago antes de Confirmado', () => {
        const out = desktop(stepper({ status: S.PENDING, paymentMethod: 'Transferencia' }));
        expect(out.indexOf(S.PENDING)).toBeLessThan(out.indexOf(S.CONFIRMED));
    });

    it('el último paso alcanzado se ve completado y marca aria-current', () => {
        const out = desktop(stepper({ status: S.PROCESSING }));
        expect(count(out, '(completado)')).toBe(2);
        expect(count(out, 'aria-current="step"')).toBe(1);
    });

    it('los pasos por venir atenúan su indicador y los conectores son decorativos', () => {
        const out = desktop(stepper({ status: S.CONFIRMED }));
        expect(count(out, 'opacity-40')).toBe(4);
        expect(count(out, 'aria-hidden="true" class="h-0.5')).toBe(4);
    });

    it('un Entregado los tiene todos completados', () => {
        const out = desktop(stepper({ status: S.DELIVERED }));
        expect(count(out, '(completado)')).toBe(5);
        expect(count(out, 'opacity-40')).toBe(0);
    });

    it('un Bloqueado llega hasta el estado del que venía', () => {
        const out = desktop(stepper({ status: S.BLOCKED, blockedFrom: S.CONFIRMED }));
        expect(count(out, '(completado)')).toBe(1);
        expect(out).not.toContain(S.BLOCKED);
    });

    it('solo enseña la fecha de los pasos que la traen', () => {
        const out = desktop(stepper({ dates: { [S.CONFIRMED]: '15 oct, 09:12' } }));
        expect(out).toContain('15 oct, 09:12');
        expect(count(out, 'text-muted-foreground text-xs')).toBeLessThanOrEqual(1);
    });

    it('se pinta en fila desde md y en vertical por debajo, con los mismos pasos', () => {
        const out = stepper({ status: S.PROCESSING });
        expect(out).toContain('hidden md:block');
        expect(out).toContain('md:hidden');
        expect(count(out, S.PREPARED)).toBe(2);
    });

    it('un Anulado termina en el paso de la cancelación, en error y con su fecha y hora', () => {
        const out = desktop(
            stepper({
                status: S.CANCELLED,
                cancelledBy: 'Cliente',
                dates: { [S.CONFIRMED]: '15 oct, 09:12', [S.CANCELLED]: '15 oct, 17:40' },
            }),
        );
        expect(out).toContain('Cancelado por ti');
        expect(out).toContain('15 oct, 17:40');
        expect(out).toContain('text-destructive');
        expect(out).not.toContain('En proceso');
    });
});

describe('OrderNotice', () => {
    it('Bloqueado: aviso de revisión', () => {
        const out = html(createElement(OrderNotice, { kind: 'blocked' }));
        expect(out).toContain('Tu pedido está en revisión.');
        expect(out).toContain('Nos pondremos en contacto contigo.');
        expect(out).toContain('role="alert"');
        expect(out).toContain('border-warning');
    });

    it('Pendiente de pago: espera de la transferencia', () => {
        expect(html(createElement(OrderNotice, { kind: 'pending-payment' }))).toContain(
            'Estamos esperando tu transferencia.',
        );
    });
});
