import { describe, expect, it, vi } from 'vitest';
import { cancelOrderRequest } from './cancel-order-request';

const reply = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('cancelOrderRequest', () => {
    it('hace POST a la ruta del pedido', async () => {
        const request = reply(200, { status: 'Anulado', refund: 'done' });
        await cancelOrderRequest(12, request);
        expect(request).toHaveBeenCalledWith('/api/pedidos/12/cancelar', { method: 'POST' });
    });

    it.each(['none', 'done', 'failed'] as const)('éxito con reembolso %s', async (refund) => {
        expect(await cancelOrderRequest(1, reply(200, { status: 'Anulado', refund }))).toEqual({
            kind: 'cancelled',
            refund,
        });
    });

    it('un reembolso desconocido cuenta como ninguno', async () => {
        expect(await cancelOrderRequest(1, reply(200, { refund: 'x' }))).toEqual({
            kind: 'cancelled',
            refund: 'none',
        });
    });

    it('409 devuelve el mensaje de la API (plazo, estado o cambio simultáneo)', async () => {
        expect(
            await cancelOrderRequest(
                1,
                reply(409, { message: 'Ya no puedes cancelar este pedido' }),
            ),
        ).toEqual({ kind: 'rejected', message: 'Ya no puedes cancelar este pedido' });
    });

    it.each([401, 404, 500])('%i es un error genérico', async (status) => {
        expect(await cancelOrderRequest(1, reply(status, { message: 'x' }))).toEqual({
            kind: 'error',
        });
    });

    it('un fallo de red es un error genérico y no lanza', async () => {
        expect(
            await cancelOrderRequest(1, vi.fn().mockRejectedValue(new Error('offline'))),
        ).toEqual({
            kind: 'error',
        });
    });

    it('un cuerpo que no es JSON no rompe', async () => {
        const request = vi.fn().mockResolvedValue(new Response('<html>', { status: 502 }));
        expect(await cancelOrderRequest(1, request)).toEqual({ kind: 'error' });
    });
});
