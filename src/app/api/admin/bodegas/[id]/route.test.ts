import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
const updateWinery = vi.fn();
const deleteWinery = vi.fn();
vi.mock('@/lib/admin/winery-service', () => ({
    updateWinery: (...a: unknown[]) => updateWinery(...a),
    deleteWinery: (...a: unknown[]) => deleteWinery(...a),
}));

import { DELETE, PATCH } from './route';

const call = (handler: typeof PATCH, id: string, body?: unknown) =>
    handler(
        new Request(`http://localhost/api/admin/bodegas/${id}`, {
            method: 'PATCH',
            body: body === undefined ? undefined : JSON.stringify(body),
        }),
        { params: { id } },
    );

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 2, role: 'Editor' } });
    updateWinery.mockReset().mockResolvedValue({ ok: true, changed: true });
    deleteWinery.mockReset().mockResolvedValue({ ok: true });
});

describe('PATCH /api/admin/bodegas/[id]', () => {
    it('edita y responde si cambió', async () => {
        const response = await call(PATCH, '3', { name: 'Lustau' });
        await expect(response.json()).resolves.toEqual({ changed: true });
        expect(updateWinery).toHaveBeenCalledWith(
            { id: 2, role: 'Editor' },
            3,
            expect.objectContaining({ name: 'Lustau' }),
        );
    });
    it('exige rol y rechaza id y cuerpo no válidos', async () => {
        expect((await call(PATCH, 'abc', { name: 'A' })).status).toBe(400);
        expect((await call(PATCH, '3', { name: '' })).status).toBe(400);
        const denied = new Response('{}', { status: 401 });
        requireRole.mockResolvedValue({ response: denied });
        expect(await call(PATCH, '3', { name: 'A' })).toBe(denied);
    });
    it('404 y 409 según el servicio', async () => {
        updateWinery.mockResolvedValue({ ok: false, code: 'not_found', message: 'x' });
        expect((await call(PATCH, '3', { name: 'A' })).status).toBe(404);
        updateWinery.mockResolvedValue({ ok: false, code: 'duplicate', message: 'x' });
        expect((await call(PATCH, '3', { name: 'A' })).status).toBe(409);
    });
});

describe('DELETE /api/admin/bodegas/[id]', () => {
    it('borra una bodega sin productos', async () => {
        const response = await call(DELETE, '3');
        await expect(response.json()).resolves.toEqual({ deleted: true });
    });
    it('409 si está en uso y 404 si no existe', async () => {
        deleteWinery.mockResolvedValue({ ok: false, code: 'in_use', message: 'Tiene productos' });
        const response = await call(DELETE, '3');
        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({ message: 'Tiene productos' });
        deleteWinery.mockResolvedValue({ ok: false, code: 'not_found', message: 'x' });
        expect((await call(DELETE, '3')).status).toBe(404);
    });
});
