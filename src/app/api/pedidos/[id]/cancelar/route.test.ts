import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUserId = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUserId: () => getSessionUserId() }));

const changeOrderStatus = vi.fn();
vi.mock('@/lib/orders/change-status', () => ({
    changeOrderStatus: (...a: unknown[]) => changeOrderStatus(...a),
}));

import { POST } from './route';

const post = (id: string) =>
    POST(new Request(`http://localhost/api/pedidos/${id}/cancelar`, { method: 'POST' }), {
        params: { id },
    });

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUserId.mockReset().mockResolvedValue(12);
    changeOrderStatus
        .mockReset()
        .mockResolvedValue({ ok: true, from: 'Confirmado', to: 'Anulado', refund: 'done' });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('POST /api/pedidos/[id]/cancelar', () => {
    it('cancela el pedido de la cuenta de la sesión', async () => {
        const response = await post('5');
        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(await response.json()).toEqual({ status: 'Anulado', refund: 'done' });
        expect(changeOrderStatus).toHaveBeenCalledWith(5, 'Anulado', {
            role: 'Cliente',
            userId: 12,
        });
    });

    it('responde 401 sin sesión y no toca el pedido', async () => {
        getSessionUserId.mockResolvedValue(null);
        expect((await post('5')).status).toBe(401);
        expect(changeOrderStatus).not.toHaveBeenCalled();
    });

    it.each(['abc', '0', '-1', '1.5', '2147483648'])('responde 400 si el id es %s', async (id) => {
        expect((await post(id)).status).toBe(400);
        expect(changeOrderStatus).not.toHaveBeenCalled();
    });

    it.each([
        ['not_found', 404],
        ['cancel_window_closed', 409],
        ['invalid_transition', 409],
        ['conflict', 409],
    ])('traduce el rechazo %s a %i', async (code, status) => {
        changeOrderStatus.mockResolvedValue({ ok: false, code, message: 'no' });
        const response = await post('5');
        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({ message: 'no' });
    });

    it('un fallo inesperado responde 500 sin detalles', async () => {
        changeOrderStatus.mockRejectedValue(new Error('conexión caída'));
        const response = await post('5');
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ message: 'Error interno del servidor' });
    });
});
