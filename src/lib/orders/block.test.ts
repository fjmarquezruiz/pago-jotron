import { beforeEach, describe, expect, it, vi } from 'vitest';

const tx = { tx: true };
const transaction = vi.fn();
vi.mock('@/db', () => ({
    db: { transaction: (run: (tx: unknown) => Promise<unknown>) => transaction(run) },
}));

const getOrderForStatusChange = vi.fn();
const getOrderStatuses = vi.fn();
const changeOrderStatusQuery = vi.fn();
const insertAuditLogQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getOrderForStatusChange: (...a: unknown[]) => getOrderForStatusChange(...a),
    getOrderStatuses: (...a: unknown[]) => getOrderStatuses(...a),
    changeOrderStatusQuery: (...a: unknown[]) => changeOrderStatusQuery(...a),
    insertAuditLogQuery: (...a: unknown[]) => insertAuditLogQuery(...a),
}));

import { blockOrder } from './block';
import { ORDER_STATUS as S } from './status';

const IDS = {
    [S.PENDING]: 1,
    [S.CONFIRMED]: 2,
    [S.PROCESSING]: 3,
    [S.PREPARED]: 4,
    [S.SHIPPED]: 5,
    [S.DELIVERED]: 6,
    [S.CANCELLED]: 7,
    [S.BLOCKED]: 8,
};
// Lleva en el estado desde el 1 de noviembre a las 00:00 UTC.
const order = (statusId: number) => ({
    id: 5,
    userId: 12,
    statusId,
    paymentMethod: 'Tarjeta',
    paymentIntentId: 'pi_1',
    createdAt: '2026-10-20 10:00:00',
    statusUpdatedAt: '2026-11-01 00:00:00',
    blockedFromStatusId: null,
});
const LATE = new Date('2026-11-16T00:00:01Z');

beforeEach(() => {
    transaction.mockReset().mockImplementation((run) => run(tx));
    getOrderForStatusChange.mockReset().mockResolvedValue(order(IDS[S.PROCESSING]));
    getOrderStatuses
        .mockReset()
        .mockResolvedValue(Object.entries(IDS).map(([name, id]) => ({ id, name })));
    changeOrderStatusQuery.mockReset().mockResolvedValue([{ affectedRows: 1 }]);
    insertAuditLogQuery.mockReset().mockResolvedValue(undefined);
});

describe('blockOrder', () => {
    it('bloquea el pedido y guarda el estado del que venía en el mismo UPDATE', async () => {
        const result = await blockOrder(5, LATE);

        expect(result).toEqual({ ok: true, from: S.PROCESSING });
        expect(changeOrderStatusQuery).toHaveBeenCalledWith(
            tx,
            5,
            IDS[S.PROCESSING],
            IDS[S.BLOCKED],
            { blockedFromStatusId: IDS[S.PROCESSING] },
        );
    });

    it('lo anota en la auditoría como acción del sistema (sin usuario)', async () => {
        await blockOrder(5, LATE);
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({
                userId: null,
                action: 'Pedido PJ-5: En proceso → Bloqueado',
            }),
        );
    });

    it.each([S.PENDING, S.CONFIRMED, S.PROCESSING, S.PREPARED, S.SHIPPED])(
        'bloquea un pedido en %s y recuerda ese estado',
        async (status) => {
            getOrderForStatusChange.mockResolvedValue(order(IDS[status]));
            await blockOrder(5, LATE);
            expect(changeOrderStatusQuery).toHaveBeenCalledWith(
                tx,
                5,
                IDS[status],
                IDS[S.BLOCKED],
                { blockedFromStatusId: IDS[status] },
            );
        },
    );

    it('no bloquea antes de los 15 días', async () => {
        const result = await blockOrder(5, new Date('2026-11-16T00:00:00Z'));
        expect(result).toMatchObject({ ok: false, code: 'not_blockable' });
        expect(transaction).not.toHaveBeenCalled();
    });

    it.each([S.DELIVERED, S.CANCELLED, S.BLOCKED])('no bloquea un pedido %s', async (status) => {
        getOrderForStatusChange.mockResolvedValue(order(IDS[status]));
        expect(await blockOrder(5, new Date('2027-06-01T00:00:00Z'))).toMatchObject({
            ok: false,
            code: 'not_blockable',
        });
        expect(transaction).not.toHaveBeenCalled();
    });

    it('si el pedido se movió entre medias, responde conflict y no anota nada', async () => {
        changeOrderStatusQuery.mockResolvedValue([{ affectedRows: 0 }]);
        expect(await blockOrder(5, LATE)).toMatchObject({ ok: false, code: 'conflict' });
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });

    it('un pedido que no existe responde not_found', async () => {
        getOrderForStatusChange.mockResolvedValue(null);
        expect(await blockOrder(5, LATE)).toMatchObject({ ok: false, code: 'not_found' });
    });
});
