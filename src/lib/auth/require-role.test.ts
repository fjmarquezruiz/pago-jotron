import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUser = vi.fn();
vi.mock('@/lib/auth/session', () => ({
    getSessionUser: (...args: unknown[]) => getSessionUser(...args),
}));

import { requireRole } from './require-role';

describe('requireRole', () => {
    beforeEach(() => getSessionUser.mockReset());

    it('deja pasar a un rol permitido y devuelve el usuario', async () => {
        getSessionUser.mockResolvedValue({ id: 3, role: 'Editor' });
        await expect(requireRole(['Editor', 'Administrador'])).resolves.toEqual({
            user: { id: 3, role: 'Editor' },
        });
    });

    it('responde 401 sin sesión o con la cuenta desactivada', async () => {
        getSessionUser.mockResolvedValue(null);
        const result = await requireRole(['Administrador']);
        if (!('response' in result)) throw new Error('debía rechazar');
        expect(result.response.status).toBe(401);
        await expect(result.response.json()).resolves.toEqual({
            message: 'Inicia sesión para continuar',
        });
    });

    it.each([
        ['un cliente', 'Cliente'],
        ['un editor', 'Editor'],
    ])('responde 403 a %s en una ruta solo de administrador', async (_, role) => {
        getSessionUser.mockResolvedValue({ id: 3, role });
        const result = await requireRole(['Administrador']);
        if (!('response' in result)) throw new Error('debía rechazar');
        expect(result.response.status).toBe(403);
        await expect(result.response.json()).resolves.toEqual({
            message: 'No tienes permiso para esta acción',
        });
    });

    it('no deja pasar a un cliente en una ruta del editor', async () => {
        getSessionUser.mockResolvedValue({ id: 3, role: 'Cliente' });
        const result = await requireRole(['Editor', 'Administrador']);
        expect('response' in result && result.response.status).toBe(403);
    });
});
