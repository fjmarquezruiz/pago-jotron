import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
const changeUserAccess = vi.fn();
vi.mock('@/lib/users/change-access', () => ({
    changeUserAccess: (...a: unknown[]) => changeUserAccess(...a),
}));

import { PATCH } from './route';

const patch = (id: string, body: unknown) =>
    PATCH(
        new Request(`http://localhost/api/admin/usuarios/${id}`, {
            method: 'PATCH',
            body: typeof body === 'string' ? body : JSON.stringify(body),
        }),
        { params: { id } },
    );

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 1, role: 'Administrador' } });
    changeUserAccess.mockReset().mockResolvedValue({ ok: true, changed: true });
});

describe('PATCH /api/admin/usuarios/[id]', () => {
    it('exige el rol Administrador y devuelve su respuesta si no lo tiene', async () => {
        const denied = new Response('{}', { status: 403 });
        requireRole.mockResolvedValue({ response: denied });
        expect(await patch('3', { role: 'Editor' })).toBe(denied);
        expect(requireRole).toHaveBeenCalledWith(['Administrador']);
        expect(changeUserAccess).not.toHaveBeenCalled();
    });

    it('cambia el rol con la cuenta de la sesión como actora', async () => {
        const response = await patch('3', { role: 'Editor' });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ changed: true });
        expect(changeUserAccess).toHaveBeenCalledWith(1, 3, {
            role: 'Editor',
            isActive: undefined,
        });
    });

    it('desactiva', async () => {
        await patch('3', { isActive: false });
        expect(changeUserAccess).toHaveBeenCalledWith(1, 3, {
            role: undefined,
            isActive: false,
        });
    });

    it.each(['abc', '0', '2147483648'])('400 con el id %s', async (id) => {
        expect((await patch(id, { role: 'Editor' })).status).toBe(400);
    });

    it.each([
        ['JSON roto', '{no'],
        ['cuerpo vacío', {}],
        ['un rol que no existe', { role: 'Superusuario' }],
        ['isActive que no es booleano', { isActive: 'no' }],
        ['campos de más', { role: 'Editor', passwordHash: 'x' }],
    ])('400 con %s', async (_, body) => {
        expect((await patch('3', body)).status).toBe(400);
        expect(changeUserAccess).not.toHaveBeenCalled();
    });

    it.each([
        ['not_found', 404],
        ['last_admin', 409],
    ])('traduce %s a %i', async (code, status) => {
        changeUserAccess.mockResolvedValue({ ok: false, code, message: 'no' });
        const response = await patch('3', { role: 'Editor' });
        expect(response.status).toBe(status);
        await expect(response.json()).resolves.toEqual({ message: 'no' });
    });

    it('un fallo inesperado responde 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        changeUserAccess.mockRejectedValue(new Error('boom'));
        expect((await patch('3', { role: 'Editor' })).status).toBe(500);
    });
});
