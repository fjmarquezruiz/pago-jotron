import { beforeEach, describe, expect, it, vi } from 'vitest';

const getServerSession = vi.fn();
vi.mock('next-auth', () => ({
    getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
// Las opciones de NextAuth importan el cliente de BD: aquí solo hace falta que sean reconocibles.
vi.mock('@/lib/auth-options', () => ({ authOptions: { marker: 'auth-options' } }));
const isUserActive = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    isUserActive: (...args: unknown[]) => isUserActive(...args),
}));

import { getSessionUser, getSessionUserId } from './session';

describe('getSessionUserId', () => {
    beforeEach(() => {
        getServerSession.mockReset();
    });

    it('lee la sesión del servidor con las opciones de NextAuth', async () => {
        getServerSession.mockResolvedValue(null);
        await getSessionUserId();
        expect(getServerSession).toHaveBeenCalledTimes(1);
        expect(getServerSession).toHaveBeenCalledWith({ marker: 'auth-options' });
    });

    it.each([
        ['un id corriente', '12', 12],
        ['el primer id', '1', 1],
        ['el id más alto de un int de MySQL', '2147483647', 2_147_483_647],
    ])('devuelve el id como número: %s', async (_, id, expected) => {
        getServerSession.mockResolvedValue({ user: { id, role: 'Cliente' } });
        await expect(getSessionUserId()).resolves.toBe(expected);
    });

    it.each([
        ['no hay sesión', null],
        ['la sesión es undefined', undefined],
        ['la sesión no trae usuario', {}],
        ['el usuario no trae id', { user: { role: 'Cliente' } }],
        ['el id es null', { user: { id: null } }],
        ['el id está vacío', { user: { id: '' } }],
        ['el id es 0', { user: { id: '0' } }],
        ['el id es negativo', { user: { id: '-3' } }],
        ['el id es decimal', { user: { id: '1.5' } }],
        ['el id no es numérico', { user: { id: 'abc' } }],
        ['el id es NaN', { user: { id: 'NaN' } }],
        ['el id es infinito', { user: { id: 'Infinity' } }],
        ['el id no cabe en un int de MySQL', { user: { id: '2147483648' } }],
    ])('devuelve null si %s', async (_, session) => {
        getServerSession.mockResolvedValue(session);
        await expect(getSessionUserId()).resolves.toBeNull();
    });

    it('deja pasar el error si NextAuth falla (lo trata quien llama)', async () => {
        getServerSession.mockRejectedValue(new Error('NEXTAUTH_SECRET missing'));
        await expect(getSessionUserId()).rejects.toThrow('NEXTAUTH_SECRET missing');
    });
});

describe('getSessionUser', () => {
    beforeEach(() => {
        getServerSession.mockReset();
        isUserActive.mockReset();
        isUserActive.mockResolvedValue(true);
    });

    it('devuelve el id y el rol de la sesión', async () => {
        getServerSession.mockResolvedValue({ user: { id: '7', role: 'Administrador' } });
        await expect(getSessionUser()).resolves.toEqual({ id: 7, role: 'Administrador' });
    });

    it.each([
        ['no hay sesión', null],
        ['el id no es válido', { user: { id: 'abc', role: 'Administrador' } }],
        ['falta el rol', { user: { id: '7' } }],
        ['el rol no existe', { user: { id: '7', role: 'Superusuario' } }],
    ])('devuelve null si %s', async (_, session) => {
        getServerSession.mockResolvedValue(session);
        await expect(getSessionUser()).resolves.toBeNull();
    });

    it('devuelve null si la cuenta está desactivada aunque el JWT siga vigente', async () => {
        getServerSession.mockResolvedValue({ user: { id: '7', role: 'Administrador' } });
        isUserActive.mockResolvedValue(false);
        await expect(getSessionUser()).resolves.toBeNull();
        expect(isUserActive).toHaveBeenCalledWith(7);
    });

    it('no consulta la BD si la sesión ya no vale', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'abc', role: 'Administrador' } });
        await expect(getSessionUser()).resolves.toBeNull();
        expect(isUserActive).not.toHaveBeenCalled();
    });
});
