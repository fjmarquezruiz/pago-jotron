import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
const setWinerySalesBlocked = vi.fn();
vi.mock('@/lib/admin/winery-service', () => ({
    setWinerySalesBlocked: (...a: unknown[]) => setWinerySalesBlocked(...a),
}));

import { PATCH } from './route';

const patch = (id: string, body: unknown) =>
    PATCH(
        new Request(`http://localhost/api/admin/bodegas/${id}/ventas`, {
            method: 'PATCH',
            body: typeof body === 'string' ? body : JSON.stringify(body),
        }),
        { params: { id } },
    );

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 1, role: 'Administrador' } });
    setWinerySalesBlocked.mockReset().mockResolvedValue({ ok: true, changed: true });
});

describe('PATCH /api/admin/bodegas/[id]/ventas', () => {
    it('es solo del Administrador: un editor recibe lo que devuelve requireRole', async () => {
        const denied = new Response('{}', { status: 403 });
        requireRole.mockResolvedValue({ response: denied });
        expect(await patch('3', { isBlocked: true })).toBe(denied);
        expect(requireRole).toHaveBeenCalledWith(['Administrador']);
        expect(setWinerySalesBlocked).not.toHaveBeenCalled();
    });
    it('bloquea con la cuenta de la sesión', async () => {
        const response = await patch('3', { isBlocked: true });
        await expect(response.json()).resolves.toEqual({ changed: true });
        expect(setWinerySalesBlocked).toHaveBeenCalledWith(
            { id: 1, role: 'Administrador' },
            3,
            true,
        );
    });
    it.each([
        ['id', 'abc', { isBlocked: true }],
        ['JSON', '3', '{no'],
        ['cuerpo', '3', { isBlocked: 'si' }],
    ])('400 con %s no válido', async (_label, id, body) => {
        expect((await patch(id, body)).status).toBe(400);
    });
    it('404 si no existe', async () => {
        setWinerySalesBlocked.mockResolvedValue({ ok: false, code: 'not_found', message: 'x' });
        expect((await patch('3', { isBlocked: false })).status).toBe(404);
    });
});
