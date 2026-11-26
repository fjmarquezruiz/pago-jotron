import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
const createWinery = vi.fn();
vi.mock('@/lib/admin/winery-service', () => ({
    createWinery: (...a: unknown[]) => createWinery(...a),
}));

import { POST } from './route';

const post = (body: unknown) =>
    POST(
        new Request('http://localhost/api/admin/bodegas', {
            method: 'POST',
            body: typeof body === 'string' ? body : JSON.stringify(body),
        }),
        { params: {} },
    );

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 2, role: 'Editor' } });
    createWinery.mockReset().mockResolvedValue({ ok: true, id: 11 });
});

describe('POST /api/admin/bodegas', () => {
    it('exige Editor o Administrador', async () => {
        const denied = new Response('{}', { status: 403 });
        requireRole.mockResolvedValue({ response: denied });
        expect(await post({ name: 'A' })).toBe(denied);
        expect(requireRole).toHaveBeenCalledWith(['Editor', 'Administrador']);
        expect(createWinery).not.toHaveBeenCalled();
    });
    it('crea con los datos validados y responde 201', async () => {
        const response = await post({ name: ' Lustau ', city: 'Jerez' });
        expect(response.status).toBe(201);
        await expect(response.json()).resolves.toEqual({ id: 11 });
        expect(createWinery).toHaveBeenCalledWith(
            { id: 2, role: 'Editor' },
            expect.objectContaining({
                name: 'Lustau',
                city: 'Jerez',
                country: 'España',
                phone: null,
            }),
        );
    });
    it.each([
        ['JSON roto', '{no'],
        ['sin nombre', {}],
        ['un campo que no existe', { name: 'A', isBlocked: true }],
    ])('400 con %s', async (_label, body) => {
        expect((await post(body)).status).toBe(400);
        expect(createWinery).not.toHaveBeenCalled();
    });
    it('409 si el nombre ya existe', async () => {
        createWinery.mockResolvedValue({ ok: false, code: 'duplicate', message: 'Ya existe' });
        expect((await post({ name: 'A' })).status).toBe(409);
    });
});
