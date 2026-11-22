import { describe, expect, it } from 'vitest';
import { ORDER_STATUS as S, type OrderStatus } from './status';
import {
    cancellationLabel,
    ORDER_NOTICES,
    orderSteps,
    STATUS_TONE,
    stepperProgress,
} from './status-ui';

const ALL = Object.values(S) as OrderStatus[];

describe('STATUS_TONE', () => {
    it('da un color fijo a cada estado', () => {
        expect(STATUS_TONE).toEqual({
            'Pendiente de pago': 'neutral',
            Confirmado: 'info',
            'En proceso': 'info',
            Preparado: 'info',
            Enviado: 'info',
            Entregado: 'success',
            Bloqueado: 'warning',
            Anulado: 'destructive',
        });
    });

    it('no deja ningún estado sin color', () => {
        for (const status of ALL) expect(STATUS_TONE[status]).toBeDefined();
    });
});

describe('orderSteps', () => {
    it('son 5 pasos, de Confirmado a Entregado', () => {
        expect(orderSteps('Tarjeta')).toEqual([
            S.CONFIRMED,
            S.PROCESSING,
            S.PREPARED,
            S.SHIPPED,
            S.DELIVERED,
        ]);
        expect(orderSteps('PayPal')).toHaveLength(5);
    });

    it('con transferencia son 6: Pendiente de pago va antes de Confirmado', () => {
        const steps = orderSteps('Transferencia');
        expect(steps).toHaveLength(6);
        expect(steps.slice(0, 2)).toEqual([S.PENDING, S.CONFIRMED]);
    });

    it('Bloqueado y Anulado nunca son un paso', () => {
        for (const method of ['Tarjeta', 'Transferencia'] as const) {
            expect(orderSteps(method)).not.toContain(S.BLOCKED);
            expect(orderSteps(method)).not.toContain(S.CANCELLED);
        }
    });
});

describe('stepperProgress', () => {
    const card = (status: OrderStatus, blockedFrom: OrderStatus | null = null) =>
        stepperProgress({ status, blockedFrom, paymentMethod: 'Tarjeta' });

    it('un estado normal es su paso, sin aviso', () => {
        expect(card(S.CONFIRMED)).toMatchObject({ current: 0, notice: null });
        expect(card(S.PREPARED)).toMatchObject({ current: 2, notice: null });
        expect(card(S.DELIVERED)).toMatchObject({ current: 4, notice: null });
    });

    it('Pendiente de pago es el primer paso de la transferencia, con su aviso', () => {
        const progress = stepperProgress({ status: S.PENDING, paymentMethod: 'Transferencia' });
        expect(progress).toMatchObject({ current: 0, notice: 'pending-payment' });
        expect(progress.steps[0]).toBe(S.PENDING);
    });

    it('un Bloqueado se pinta hasta el estado del que venía, con aviso', () => {
        expect(card(S.BLOCKED, S.PROCESSING)).toMatchObject({ current: 1, notice: 'blocked' });
        expect(card(S.BLOCKED, S.SHIPPED)).toMatchObject({ current: 3, notice: 'blocked' });
    });

    it('un Bloqueado sin estado de origen queda en el primer paso', () => {
        expect(card(S.BLOCKED)).toMatchObject({ current: 0, notice: 'blocked' });
    });

    it('un Anulado termina en el paso Anulado, en error y sin aviso', () => {
        const withOrigin = card(S.CANCELLED, S.PREPARED);
        expect(withOrigin.steps).toEqual([S.CONFIRMED, S.PROCESSING, S.PREPARED, S.CANCELLED]);
        expect(withOrigin).toMatchObject({ current: 3, errorStep: 3, notice: null });
        const unknownOrigin = card(S.CANCELLED);
        expect(unknownOrigin.steps).toEqual([S.CONFIRMED, S.CANCELLED]);
        expect(unknownOrigin).toMatchObject({ current: 1, errorStep: 1, notice: null });
    });

    it('un Anulado de transferencia empieza en Pendiente de pago', () => {
        const progress = stepperProgress({ status: S.CANCELLED, paymentMethod: 'Transferencia' });
        expect(progress.steps).toEqual([S.PENDING, S.CANCELLED]);
    });

    it('solo un Anulado lleva paso en error', () => {
        for (const status of ALL)
            expect(card(status).errorStep === null).toBe(status !== S.CANCELLED);
    });

    it('el texto de la anulación dice quién anuló', () => {
        expect(cancellationLabel('Cliente')).toBe('Cancelado por ti');
        expect(cancellationLabel('Administrador')).toBe('Anulado por la tienda');
        expect(cancellationLabel(null)).toBe('Anulado');
    });

    it('un Bloqueado de transferencia sin cobrar recupera su paso Pendiente de pago', () => {
        const progress = stepperProgress({
            status: S.BLOCKED,
            blockedFrom: S.PENDING,
            paymentMethod: 'Transferencia',
        });
        expect(progress).toMatchObject({ current: 0, notice: 'blocked' });
        expect(progress.steps[0]).toBe(S.PENDING);
    });

    it('el índice siempre cae dentro de los pasos', () => {
        for (const method of ['Tarjeta', 'Transferencia'] as const)
            for (const status of ALL)
                for (const blockedFrom of [null, ...ALL]) {
                    const { steps, current } = stepperProgress({
                        status,
                        blockedFrom,
                        paymentMethod: method,
                    });
                    expect(current).toBeGreaterThanOrEqual(0);
                    expect(current).toBeLessThan(steps.length);
                }
    });
});

describe('ORDER_NOTICES', () => {
    it('lleva el texto del diseño y el tipo de cada aviso', () => {
        expect(ORDER_NOTICES['pending-payment']).toEqual({
            type: 'warning',
            title: 'Estamos esperando tu transferencia.',
            description: 'Prepararemos el pedido cuando la recibamos.',
        });
        expect(ORDER_NOTICES.blocked).toMatchObject({
            type: 'warning',
            title: 'Tu pedido está en revisión.',
            description: 'Nos pondremos en contacto contigo.',
        });
    });
});
