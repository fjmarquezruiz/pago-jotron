import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
const createDenomination = vi.fn();
vi.mock('@/lib/admin/denomination-service', () => ({
    createDenomination: (...a: unknown[]) => createDenomination(...a),
}));

import { POST } from './route';

const post = (body: unknown) =>
    POST(
        new Request('http://localhost/api/admin/denominaciones', {
            method: 'POST',
            body: typeof body === 'string' ? body : JSON.stringify(body),
        }),
        { params: {} },
    );

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 2, role: 'Editor' } });
    createDenomination.mockReset().mockResolvedValue({ ok: true, id: 11 });
});

describe('POST /api/admin/denominaciones', () => {
    it('exige Editor o Administrador', async () => {
        const denied = new Response('{}', { status: 403 });
        requireRole.mockResolvedValue({ response: denied });
        expect(await post({ name: 'A', classification: 'DO' })).toBe(denied);
        expect(requireRole).toHaveBeenCalledWith(['Editor', 'Administrador']);
        expect(createDenomination).not.toHaveBeenCalled();
    });
    it('crea con los datos validados y responde 201', async () => {
        const response = await post({ name: ' Málaga ', classification: 'DO', region: 'Málaga' });
        expect(response.status).toBe(201);
        await expect(response.json()).resolves.toEqual({ id: 11 });
        expect(createDenomination).toHaveBeenCalledWith(
            { id: 2, role: 'Editor' },
            expect.objectContaining({ name: 'Málaga', classification: 'DO', foundedYear: null }),
        );
    });
    it.each([
        ['JSON roto', '{no'],
        ['sin nombre', { classification: 'DO' }],
        ['sin clasificación', { name: 'A' }],
        ['un campo que no existe', { name: 'A', classification: 'DO', isBlocked: true }],
    ])('400 con %s', async (_label, body) => {
        expect((await post(body)).status).toBe(400);
        expect(createDenomination).not.toHaveBeenCalled();
    });
    it('409 si el nombre ya existe', async () => {
        createDenomination.mockResolvedValue({
            ok: false,
            code: 'duplicate',
            message: 'Ya existe',
        });
        expect((await post({ name: 'A', classification: 'DO' })).status).toBe(409);
    });
});
