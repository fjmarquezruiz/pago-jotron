import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
const updateDenomination = vi.fn();
const deleteDenomination = vi.fn();
vi.mock('@/lib/admin/denomination-service', () => ({
    updateDenomination: (...a: unknown[]) => updateDenomination(...a),
    deleteDenomination: (...a: unknown[]) => deleteDenomination(...a),
}));

import { DELETE, PATCH } from './route';

const call = (handler: typeof PATCH, id: string, body?: unknown) =>
    handler(
        new Request(`http://localhost/api/admin/denominaciones/${id}`, {
            method: 'PATCH',
            body: body === undefined ? undefined : JSON.stringify(body),
        }),
        { params: { id } },
    );

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 2, role: 'Editor' } });
    updateDenomination.mockReset().mockResolvedValue({ ok: true, changed: true });
    deleteDenomination.mockReset().mockResolvedValue({ ok: true });
});

describe('PATCH /api/admin/denominaciones/[id]', () => {
    it('edita y responde si cambió', async () => {
        const response = await call(PATCH, '3', { name: 'Málaga', classification: 'DO' });
        await expect(response.json()).resolves.toEqual({ changed: true });
        expect(updateDenomination).toHaveBeenCalledWith(
            { id: 2, role: 'Editor' },
            3,
            expect.objectContaining({ name: 'Málaga', classification: 'DO' }),
        );
    });
    it('exige rol y rechaza id y cuerpo no válidos', async () => {
        expect((await call(PATCH, 'abc', { name: 'A', classification: 'DO' })).status).toBe(400);
        expect((await call(PATCH, '3', { name: '' })).status).toBe(400);
        const denied = new Response('{}', { status: 401 });
        requireRole.mockResolvedValue({ response: denied });
        expect(await call(PATCH, '3', { name: 'A', classification: 'DO' })).toBe(denied);
    });
    it('404 y 409 según el servicio', async () => {
        updateDenomination.mockResolvedValue({ ok: false, code: 'not_found', message: 'x' });
        expect((await call(PATCH, '3', { name: 'A', classification: 'DO' })).status).toBe(404);
        updateDenomination.mockResolvedValue({ ok: false, code: 'duplicate', message: 'x' });
        expect((await call(PATCH, '3', { name: 'A', classification: 'DO' })).status).toBe(409);
    });
});

describe('DELETE /api/admin/denominaciones/[id]', () => {
    it('borra una denominación sin productos', async () => {
        const response = await call(DELETE, '3');
        await expect(response.json()).resolves.toEqual({ deleted: true });
    });
    it('409 si está en uso y 404 si no existe', async () => {
        deleteDenomination.mockResolvedValue({
            ok: false,
            code: 'in_use',
            message: 'Tiene productos',
        });
        const response = await call(DELETE, '3');
        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({ message: 'Tiene productos' });
        deleteDenomination.mockResolvedValue({ ok: false, code: 'not_found', message: 'x' });
        expect((await call(DELETE, '3')).status).toBe(404);
    });
});
