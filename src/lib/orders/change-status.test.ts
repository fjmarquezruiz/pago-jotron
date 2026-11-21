import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tx = { tx: true };
const transaction = vi.fn();
vi.mock('@/db', () => ({
    db: { transaction: (run: (tx: unknown) => Promise<unknown>) => transaction(run) },
}));

const getOrderForStatusChange = vi.fn();
const getOrderStatuses = vi.fn();
const cancellationTypeExists = vi.fn();
const changeOrderStatusQuery = vi.fn();
const orderStockLinesQuery = vi.fn();
const restoreStockQuery = vi.fn();
const insertAuditLogQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getOrderForStatusChange: (...a: unknown[]) => getOrderForStatusChange(...a),
    getOrderStatuses: (...a: unknown[]) => getOrderStatuses(...a),
    cancellationTypeExists: (...a: unknown[]) => cancellationTypeExists(...a),
    changeOrderStatusQuery: (...a: unknown[]) => changeOrderStatusQuery(...a),
    orderStockLinesQuery: (...a: unknown[]) => orderStockLinesQuery(...a),
    restoreStockQuery: (...a: unknown[]) => restoreStockQuery(...a),
    insertAuditLogQuery: (...a: unknown[]) => insertAuditLogQuery(...a),
}));

const refund = vi.fn();
vi.mock('@/lib/payments', () => ({ refund: (...a: unknown[]) => refund(...a) }));

import { changeOrderStatus, CUSTOMER_CANCELLATION_TYPE_ID } from './change-status';
import { ORDER_STATUS as S } from './status';

const STATUS_IDS = {
    [S.PENDING]: 1,
    [S.CONFIRMED]: 2,
    [S.PROCESSING]: 3,
    [S.PREPARED]: 4,
    [S.SHIPPED]: 5,
    [S.DELIVERED]: 6,
    [S.CANCELLED]: 7,
    [S.BLOCKED]: 8,
};

const OWNER = { role: 'Cliente', userId: 12 } as const;
const ADMIN = { role: 'Administrador', userId: 1 } as const;
const NOW = new Date('2026-11-01T20:00:00Z');

/** Un pedido de tarjeta de la cuenta 12, hecho hace 10 horas. */
const order = (overrides: Record<string, unknown> = {}) => ({
    id: 5,
    userId: 12,
    statusId: STATUS_IDS[S.CONFIRMED],
    paymentMethod: 'Tarjeta',
    paymentIntentId: 'pi_1',
    createdAt: '2026-11-01 10:00:00',
    statusUpdatedAt: '2026-11-01 10:00:00',
    blockedFromStatusId: null,
    ...overrides,
});

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    transaction.mockReset().mockImplementation((run) => run(tx));
    getOrderForStatusChange.mockReset().mockResolvedValue(order());
    getOrderStatuses
        .mockReset()
        .mockResolvedValue(Object.entries(STATUS_IDS).map(([name, id]) => ({ id, name })));
    cancellationTypeExists.mockReset().mockResolvedValue(true);
    changeOrderStatusQuery.mockReset().mockResolvedValue([{ affectedRows: 1 }]);
    orderStockLinesQuery.mockReset().mockResolvedValue([
        { variantId: 4, quantity: 2 },
        { variantId: 9, quantity: 1 },
    ]);
    restoreStockQuery.mockReset().mockResolvedValue(undefined);
    insertAuditLogQuery.mockReset().mockResolvedValue(undefined);
    refund.mockReset().mockResolvedValue({ id: 're_1', status: 'succeeded', amountCents: 3345 });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('changeOrderStatus: cambios de estado', () => {
    it('hace el cambio con un UPDATE condicionado al estado esperado y lo anota en la auditoría', async () => {
        const result = await changeOrderStatus(5, S.PROCESSING, ADMIN, { now: NOW });

        expect(result).toEqual({ ok: true, from: S.CONFIRMED, to: S.PROCESSING, refund: 'none' });
        expect(changeOrderStatusQuery).toHaveBeenCalledWith(
            tx,
            5,
            STATUS_IDS[S.CONFIRMED],
            STATUS_IDS[S.PROCESSING],
            {},
        );
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({
                userId: 1,
                action: 'Pedido PJ-5: Confirmado → En proceso',
            }),
        );
        expect(restoreStockQuery).not.toHaveBeenCalled();
        expect(refund).not.toHaveBeenCalled();
    });

    it('rechaza saltarse estados sin tocar la BD', async () => {
        const result = await changeOrderStatus(5, S.SHIPPED, ADMIN, { now: NOW });
        expect(result).toMatchObject({ ok: false, code: 'invalid_transition' });
        expect(transaction).not.toHaveBeenCalled();
    });

    it('un pedido que no existe responde not_found', async () => {
        getOrderForStatusChange.mockResolvedValue(null);
        expect(await changeOrderStatus(5, S.PROCESSING, ADMIN)).toMatchObject({
            ok: false,
            code: 'not_found',
        });
    });

    it('si otro proceso movió el pedido, responde conflict y no devuelve stock ni anota nada', async () => {
        changeOrderStatusQuery.mockResolvedValue([{ affectedRows: 0 }]);
        const result = await changeOrderStatus(5, S.CANCELLED, ADMIN, {
            cancellationTypeId: 2,
            now: NOW,
        });
        expect(result).toMatchObject({ ok: false, code: 'conflict' });
        expect(restoreStockQuery).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
        expect(refund).not.toHaveBeenCalled();
    });

    it('desbloquear vuelve al estado siguiente al que tenía y borra el estado de origen', async () => {
        getOrderForStatusChange.mockResolvedValue(
            order({
                statusId: STATUS_IDS[S.BLOCKED],
                blockedFromStatusId: STATUS_IDS[S.CONFIRMED],
            }),
        );
        const result = await changeOrderStatus(5, S.PROCESSING, ADMIN, { now: NOW });
        expect(result).toMatchObject({ ok: true, from: S.BLOCKED, to: S.PROCESSING });
        expect(changeOrderStatusQuery).toHaveBeenCalledWith(
            tx,
            5,
            STATUS_IDS[S.BLOCKED],
            STATUS_IDS[S.PROCESSING],
            { blockedFromStatusId: null },
        );
    });

    it('desbloquear a un estado que no es el siguiente se rechaza', async () => {
        getOrderForStatusChange.mockResolvedValue(
            order({
                statusId: STATUS_IDS[S.BLOCKED],
                blockedFromStatusId: STATUS_IDS[S.CONFIRMED],
            }),
        );
        expect(await changeOrderStatus(5, S.PREPARED, ADMIN)).toMatchObject({
            ok: false,
            code: 'invalid_transition',
        });
    });
});

describe('changeOrderStatus: anular (stock, motivo y reembolso)', () => {
    it('devuelve el stock de cada línea en la misma transacción y guarda quién anula y por qué', async () => {
        const result = await changeOrderStatus(5, S.CANCELLED, ADMIN, {
            cancellationTypeId: 2,
            now: NOW,
        });

        expect(result).toMatchObject({ ok: true, to: S.CANCELLED });
        expect(changeOrderStatusQuery).toHaveBeenCalledWith(
            tx,
            5,
            STATUS_IDS[S.CONFIRMED],
            STATUS_IDS[S.CANCELLED],
            { cancelledBy: 'Administrador', cancellationTypeId: 2 },
        );
        expect(restoreStockQuery.mock.calls).toEqual([
            [tx, 4, 2],
            [tx, 9, 1],
        ]);
        expect(insertAuditLogQuery).toHaveBeenCalledTimes(1);
        expect(transaction).toHaveBeenCalledTimes(1);
    });

    it('un fallo al devolver el stock deshace todo: no hay reembolso', async () => {
        restoreStockQuery.mockRejectedValue(new Error('deadlock'));
        await expect(
            changeOrderStatus(5, S.CANCELLED, ADMIN, { cancellationTypeId: 2, now: NOW }),
        ).rejects.toThrow('deadlock');
        expect(refund).not.toHaveBeenCalled();
    });

    it('reembolsa DESPUÉS del commit un pedido de tarjeta', async () => {
        const order_: string[] = [];
        transaction.mockImplementation(async (run) => {
            const value = await run(tx);
            order_.push('commit');
            return value;
        });
        refund.mockImplementation(async () => {
            order_.push('refund');
            return { id: 're_1', status: 'succeeded', amountCents: 3345 };
        });

        const result = await changeOrderStatus(5, S.CANCELLED, ADMIN, {
            cancellationTypeId: 2,
            now: NOW,
        });
        expect(result).toMatchObject({ ok: true, refund: 'done' });
        expect(refund).toHaveBeenCalledWith('pi_1');
        expect(order_).toEqual(['commit', 'refund']);
    });

    it('si el reembolso falla, el pedido sigue anulado y se anota como crítico', async () => {
        refund.mockRejectedValue(new Error('stripe caído'));
        const result = await changeOrderStatus(5, S.CANCELLED, ADMIN, {
            cancellationTypeId: 2,
            now: NOW,
        });

        expect(result).toMatchObject({ ok: true, to: S.CANCELLED, refund: 'failed' });
        expect(insertAuditLogQuery).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.objectContaining({ userId: 12, action: 'Reembolso pendiente' }),
        );
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('[CRÍTICO]'));
    });

    it('no reembolsa una transferencia ni un pedido sin cobrar', async () => {
        getOrderForStatusChange.mockResolvedValue(
            order({
                statusId: STATUS_IDS[S.PENDING],
                paymentMethod: 'Transferencia',
                paymentIntentId: null,
            }),
        );
        const result = await changeOrderStatus(5, S.CANCELLED, ADMIN, {
            cancellationTypeId: 5,
            now: NOW,
        });
        expect(result).toMatchObject({ ok: true, refund: 'none' });
        expect(restoreStockQuery).toHaveBeenCalledTimes(2);
        expect(refund).not.toHaveBeenCalled();
    });

    it('administración debe indicar un motivo que exista', async () => {
        expect(await changeOrderStatus(5, S.CANCELLED, ADMIN, { now: NOW })).toMatchObject({
            ok: false,
            code: 'invalid_cancellation_type',
        });
        cancellationTypeExists.mockResolvedValue(false);
        expect(
            await changeOrderStatus(5, S.CANCELLED, ADMIN, { cancellationTypeId: 99, now: NOW }),
        ).toMatchObject({ ok: false, code: 'invalid_cancellation_type' });
        expect(transaction).not.toHaveBeenCalled();
    });

    it('no se puede anular un pedido ya preparado', async () => {
        getOrderForStatusChange.mockResolvedValue(order({ statusId: STATUS_IDS[S.PREPARED] }));
        expect(
            await changeOrderStatus(5, S.CANCELLED, ADMIN, { cancellationTypeId: 2, now: NOW }),
        ).toMatchObject({ ok: false, code: 'invalid_transition' });
    });
});

describe('changeOrderStatus: el cliente (CU7, RNF3)', () => {
    it('cancela dentro de las primeras 24 h, con el motivo del cliente', async () => {
        const result = await changeOrderStatus(5, S.CANCELLED, OWNER, { now: NOW });
        expect(result).toMatchObject({ ok: true, refund: 'done' });
        expect(changeOrderStatusQuery).toHaveBeenCalledWith(
            tx,
            5,
            STATUS_IDS[S.CONFIRMED],
            STATUS_IDS[S.CANCELLED],
            { cancelledBy: 'Cliente', cancellationTypeId: CUSTOMER_CANCELLATION_TYPE_ID },
        );
    });

    it('no cancela pasadas las 24 h', async () => {
        const result = await changeOrderStatus(5, S.CANCELLED, OWNER, {
            now: new Date('2026-11-02T10:00:01Z'),
        });
        expect(result).toMatchObject({ ok: false, code: 'cancel_window_closed' });
        expect(transaction).not.toHaveBeenCalled();
        expect(refund).not.toHaveBeenCalled();
    });

    it('en Pendiente de pago cancela aunque haya pasado más de un día', async () => {
        getOrderForStatusChange.mockResolvedValue(
            order({
                statusId: STATUS_IDS[S.PENDING],
                paymentMethod: 'Transferencia',
                paymentIntentId: null,
            }),
        );
        const result = await changeOrderStatus(5, S.CANCELLED, OWNER, {
            now: new Date('2026-12-01T00:00:00Z'),
        });
        expect(result).toMatchObject({ ok: true });
    });

    it('un pedido de otra cuenta responde como si no existiera', async () => {
        const result = await changeOrderStatus(5, S.CANCELLED, { role: 'Cliente', userId: 99 });
        expect(result).toMatchObject({ ok: false, code: 'not_found' });
        expect(transaction).not.toHaveBeenCalled();
    });

    it('un cliente solo puede cancelar: cualquier otro estado está prohibido', async () => {
        const result = await changeOrderStatus(5, S.PROCESSING, OWNER, { now: NOW });
        expect(result).toMatchObject({ ok: false, code: 'forbidden' });
        expect(transaction).not.toHaveBeenCalled();
    });

    it('no puede elegir el motivo', async () => {
        await changeOrderStatus(5, S.CANCELLED, OWNER, { cancellationTypeId: 3, now: NOW });
        expect(changeOrderStatusQuery).toHaveBeenCalledWith(
            tx,
            5,
            expect.anything(),
            expect.anything(),
            expect.objectContaining({ cancellationTypeId: CUSTOMER_CANCELLATION_TYPE_ID }),
        );
    });
});
