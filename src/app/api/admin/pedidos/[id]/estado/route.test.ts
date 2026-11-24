import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUser = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUser: () => getSessionUser() }));

const changeOrderStatus = vi.fn();
vi.mock('@/lib/orders/change-status', () => ({
    changeOrderStatus: (...a: unknown[]) => changeOrderStatus(...a),
}));

import { PATCH } from './route';

const patch = (id: string, body: unknown) =>
    PATCH(
        new Request(`http://localhost/api/admin/pedidos/${id}/estado`, {
            method: 'PATCH',
            body: typeof body === 'string' ? body : JSON.stringify(body),
        }),
        { params: { id } },
    );

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUser.mockReset().mockResolvedValue({ id: 1, role: 'Administrador' });
    changeOrderStatus.mockReset().mockResolvedValue({
        ok: true,
        from: 'Confirmado',
        to: 'En proceso',
        refund: 'none',
        invoiceNumber: null,
    });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('PATCH /api/admin/pedidos/[id]/estado', () => {
    it('cambia el estado como administrador', async () => {
        const response = await patch('5', { status: 'En proceso' });
        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(await response.json()).toEqual({
            status: 'En proceso',
            refund: 'none',
            invoiceNumber: null,
        });
        expect(changeOrderStatus).toHaveBeenCalledWith(
            5,
            'En proceso',
            { role: 'Administrador', userId: 1 },
            { cancellationTypeId: undefined },
        );
    });

    it('al entregar devuelve el número de la factura emitida', async () => {
        changeOrderStatus.mockResolvedValue({
            ok: true,
            from: 'Enviado',
            to: 'Entregado',
            refund: 'none',
            invoiceNumber: 'F-2026-0001',
        });
        const response = await patch('5', { status: 'Entregado' });
        expect(await response.json()).toEqual({
            status: 'Entregado',
            refund: 'none',
            invoiceNumber: 'F-2026-0001',
        });
    });

    it('pasa el motivo al anular', async () => {
        await patch('5', { status: 'Anulado', cancellationTypeId: 2 });
        expect(changeOrderStatus).toHaveBeenCalledWith(
            5,
            'Anulado',
            { role: 'Administrador', userId: 1 },
            { cancellationTypeId: 2 },
        );
    });

    it('responde 401 sin sesión', async () => {
        getSessionUser.mockResolvedValue(null);
        expect((await patch('5', { status: 'En proceso' })).status).toBe(401);
        expect(changeOrderStatus).not.toHaveBeenCalled();
    });

    it.each(['Cliente', 'Editor'])(
        'responde 403 al rol %s, comprobado en el servidor',
        async (role) => {
            getSessionUser.mockResolvedValue({ id: 3, role });
            expect((await patch('5', { status: 'En proceso' })).status).toBe(403);
            expect(changeOrderStatus).not.toHaveBeenCalled();
        },
    );

    it.each(['abc', '0', '2147483648'])('responde 400 si el id es %s', async (id) => {
        expect((await patch(id, { status: 'En proceso' })).status).toBe(400);
        expect(changeOrderStatus).not.toHaveBeenCalled();
    });

    it.each([
        ['no es JSON', '{no'],
        ['falta el estado', {}],
        ['el estado no existe', { status: 'Perdido' }],
        ['el motivo no es entero', { status: 'Anulado', cancellationTypeId: 'x' }],
    ])('responde 400 si el cuerpo no es válido: %s', async (_, body) => {
        expect((await patch('5', body)).status).toBe(400);
        expect(changeOrderStatus).not.toHaveBeenCalled();
    });

    it.each([
        ['not_found', 404],
        ['invalid_transition', 409],
        ['conflict', 409],
        ['invalid_cancellation_type', 400],
        ['invoice_unavailable', 503],
    ])('traduce el rechazo %s a %i', async (code, status) => {
        changeOrderStatus.mockResolvedValue({ ok: false, code, message: 'no' });
        expect((await patch('5', { status: 'En proceso' })).status).toBe(status);
    });

    it('si faltan los datos fiscales, el 503 lleva el motivo para el administrador', async () => {
        changeOrderStatus.mockResolvedValue({
            ok: false,
            code: 'invoice_unavailable',
            message: 'Faltan los datos fiscales de la tienda',
        });
        const response = await patch('5', { status: 'Entregado' });
        expect(response.status).toBe(503);
        await expect(response.json()).resolves.toEqual({
            message: 'Faltan los datos fiscales de la tienda',
        });
    });

    it('un fallo inesperado responde 500', async () => {
        changeOrderStatus.mockRejectedValue(new Error('boom'));
        expect((await patch('5', { status: 'En proceso' })).status).toBe(500);
    });
});
