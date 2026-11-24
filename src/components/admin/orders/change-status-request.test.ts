import { describe, expect, it, vi } from 'vitest';
import { changeStatusRequest } from './change-status-request';

const reply = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });

describe('changeStatusRequest', () => {
    it('manda PATCH con el estado y el motivo', async () => {
        const request = reply(200, { status: 'Anulado', refund: 'done', invoiceNumber: null });
        const outcome = await changeStatusRequest(7, 'Anulado', 2, request);
        expect(request).toHaveBeenCalledWith('/api/admin/pedidos/7/estado', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Anulado', cancellationTypeId: 2 }),
        });
        expect(outcome).toEqual({ kind: 'changed', refund: 'done', invoiceNumber: null });
    });
    it('recoge el número de factura al entregar', async () => {
        const outcome = await changeStatusRequest(
            7,
            'Entregado',
            undefined,
            reply(200, { refund: 'none', invoiceNumber: 'F-2026-0001' }),
        );
        expect(outcome).toEqual({ kind: 'changed', refund: 'none', invoiceNumber: 'F-2026-0001' });
    });
    it.each([409, 400, 503])('un %s con mensaje es un rechazo', async (status) => {
        await expect(
            changeStatusRequest(7, 'Enviado', undefined, reply(status, { message: 'No' })),
        ).resolves.toEqual({ kind: 'rejected', message: 'No' });
    });
    it.each([401, 403, 500])('un %s es un error', async (status) => {
        await expect(
            changeStatusRequest(7, 'Enviado', undefined, reply(status, { message: 'x' })),
        ).resolves.toEqual({ kind: 'error' });
    });
    it('sin red es un error y no lanza', async () => {
        const request = vi.fn().mockRejectedValue(new Error('offline'));
        await expect(changeStatusRequest(7, 'Enviado', undefined, request)).resolves.toEqual({
            kind: 'error',
        });
    });
});
