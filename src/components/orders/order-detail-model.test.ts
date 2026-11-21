import { describe, expect, it } from 'vitest';
import { formatCents } from '@/lib/cart/totals';
import { ORDER_STATUS as S } from '@/lib/orders/status';
import {
    orderActions,
    orderStepDates,
    paymentMethodLabel,
    shippingLabel,
} from './order-detail-model';

describe('orderActions', () => {
    it('Cancelar sale solo si el servidor dice que se puede', () => {
        expect(orderActions({ status: S.CONFIRMED, canCancel: true }).cancel).toBe(true);
        expect(orderActions({ status: S.CONFIRMED, canCancel: false }).cancel).toBe(false);
    });

    it('nunca hay Cancelar en Bloqueado, Entregado, Anulado, Preparado ni Enviado', () => {
        for (const status of [S.BLOCKED, S.DELIVERED, S.CANCELLED, S.PREPARED, S.SHIPPED]) {
            // `canCancel` viene de `canCustomerCancel`, que es false en estos estados.
            expect(orderActions({ status, canCancel: false }).cancel).toBe(false);
        }
    });

    it('la frase del plazo sale en Confirmado y En proceso, no en Pendiente de pago', () => {
        expect(orderActions({ status: S.CONFIRMED, canCancel: true }).cancelHint).toBe(true);
        expect(orderActions({ status: S.PROCESSING, canCancel: true }).cancelHint).toBe(true);
        expect(orderActions({ status: S.PENDING, canCancel: true }).cancelHint).toBe(false);
        expect(orderActions({ status: S.CONFIRMED, canCancel: false }).cancelHint).toBe(false);
    });

    it('Factura solo en Entregado, y deshabilitada', () => {
        expect(orderActions({ status: S.DELIVERED, canCancel: false }).invoice).toBe('disabled');
        for (const status of [S.PENDING, S.CONFIRMED, S.SHIPPED, S.BLOCKED, S.CANCELLED]) {
            expect(orderActions({ status, canCancel: false }).invoice).toBeNull();
        }
    });
});

describe('orderStepDates', () => {
    const base = {
        paymentMethod: 'Tarjeta',
        createdAt: '2026-10-15 07:12:00',
        statusUpdatedAt: '2026-10-16 08:30:00',
        blockedFrom: null,
    };

    it('en el primer paso solo pone la fecha de creación', () => {
        expect(orderStepDates({ ...base, status: S.CONFIRMED })).toEqual({
            [S.CONFIRMED]: '15 oct, 09:12',
        });
    });

    it('en un paso posterior pone la creación en el primero y la entrada en el actual', () => {
        expect(orderStepDates({ ...base, status: S.SHIPPED })).toEqual({
            [S.CONFIRMED]: '15 oct, 09:12',
            [S.SHIPPED]: '16 oct, 10:30',
        });
    });

    it('con transferencia el primer paso es Pendiente de pago', () => {
        expect(
            orderStepDates({ ...base, paymentMethod: 'Transferencia', status: S.PENDING }),
        ).toEqual({ [S.PENDING]: '15 oct, 09:12' });
    });

    it('Bloqueado no es un paso: su fecha no se pone en ninguno', () => {
        expect(orderStepDates({ ...base, status: S.BLOCKED, blockedFrom: S.PROCESSING })).toEqual({
            [S.CONFIRMED]: '15 oct, 09:12',
        });
    });

    it('Anulado: la creación en el primer paso y la fecha y hora de la anulación en el último', () => {
        expect(orderStepDates({ ...base, status: S.CANCELLED })).toEqual({
            [S.CONFIRMED]: '15 oct, 09:12',
            [S.CANCELLED]: '16 oct, 10:30',
        });
    });
});

describe('textos', () => {
    it('la forma de pago no lleva marca ni dígitos', () => {
        expect(paymentMethodLabel('Tarjeta')).toBe('Tarjeta');
        expect(paymentMethodLabel('Transferencia')).toBe('Transferencia bancaria');
    });

    it('el envío lleva su coste o Gratis', () => {
        expect(shippingLabel({ name: 'Estándar', cost: '0.00' })).toBe('Estándar (Gratis)');
        expect(shippingLabel({ name: 'Exprés', cost: '4.95' })).toBe(
            `Exprés (${formatCents(495)})`,
        );
    });
});
