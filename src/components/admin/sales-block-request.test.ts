import { describe, expect, it, vi } from 'vitest';
import { fetchAffectedOrders } from './sales-block-request';

const json = (body: unknown, status = 200) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('fetchAffectedOrders', () => {
    it('devuelve los pedidos', async () => {
        const orders = [{ id: 4, number: 'PJ-4', status: 'En proceso' }];
        expect(await fetchAffectedOrders('/x', json({ orders }))).toEqual({ kind: 'ok', orders });
    });

    it('error si la respuesta falla o no trae la lista', async () => {
        expect(await fetchAffectedOrders('/x', json({}, 403))).toEqual({ kind: 'error' });
        expect(await fetchAffectedOrders('/x', json({ orders: 1 }))).toEqual({ kind: 'error' });
        expect(await fetchAffectedOrders('/x', vi.fn().mockRejectedValue(1))).toEqual({
            kind: 'error',
        });
    });
});
