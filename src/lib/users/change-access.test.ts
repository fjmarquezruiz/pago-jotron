import { beforeEach, describe, expect, it, vi } from 'vitest';

const tx = { tx: true };
const transaction = vi.fn();
vi.mock('@/db', () => ({
    db: { transaction: (run: (tx: unknown) => Promise<unknown>) => transaction(run) },
}));

const lockActiveAdminIds = vi.fn();
const lockUserAccess = vi.fn();
const updateUserAccess = vi.fn();
vi.mock('@/lib/db/admin-users', () => ({
    lockActiveAdminIds: (...a: unknown[]) => lockActiveAdminIds(...a),
    lockUserAccess: (...a: unknown[]) => lockUserAccess(...a),
    updateUserAccess: (...a: unknown[]) => updateUserAccess(...a),
}));
const insertAuditLogQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    insertAuditLogQuery: (...a: unknown[]) => insertAuditLogQuery(...a),
}));

import { changeUserAccess } from './change-access';

const calls: string[] = [];

beforeEach(() => {
    calls.length = 0;
    transaction.mockReset().mockImplementation((run) => run(tx));
    lockActiveAdminIds.mockReset().mockImplementation(async () => {
        calls.push('admins');
        return [1, 2];
    });
    lockUserAccess.mockReset().mockImplementation(async () => {
        calls.push('usuario');
        return { id: 3, role: 'Cliente', isActive: true };
    });
    updateUserAccess.mockReset().mockImplementation(async () => {
        calls.push('update');
    });
    insertAuditLogQuery.mockReset().mockImplementation(async () => {
        calls.push('auditoría');
    });
});

describe('changeUserAccess', () => {
    it('cambia el rol y lo anota en la auditoría, dentro de la misma transacción', async () => {
        await expect(changeUserAccess(1, 3, { role: 'Editor' })).resolves.toEqual({
            ok: true,
            changed: true,
        });
        expect(transaction).toHaveBeenCalledTimes(1);
        expect(updateUserAccess).toHaveBeenCalledWith(tx, 3, { role: 'Editor' });
        expect(insertAuditLogQuery).toHaveBeenCalledWith(tx, {
            userId: 1,
            action: 'Usuario USR-003: rol Cliente → Editor',
            details: 'cuenta 3; lo cambia Administrador (cuenta 1)',
        });
    });

    it('bloquea primero a los administradores y luego la cuenta, y escribe después', async () => {
        await changeUserAccess(1, 3, { isActive: false });
        expect(calls).toEqual(['admins', 'usuario', 'update', 'auditoría']);
    });

    it('desactiva y reactiva', async () => {
        await changeUserAccess(1, 3, { isActive: false });
        expect(insertAuditLogQuery).toHaveBeenLastCalledWith(
            tx,
            expect.objectContaining({ action: 'Usuario USR-003: desactivada' }),
        );
        lockUserAccess.mockResolvedValue({ id: 3, role: 'Cliente', isActive: false });
        await changeUserAccess(1, 3, { isActive: true });
        expect(insertAuditLogQuery).toHaveBeenLastCalledWith(
            tx,
            expect.objectContaining({ action: 'Usuario USR-003: reactivada' }),
        );
    });

    it('un cambio que no cambia nada no escribe ni anota', async () => {
        await expect(changeUserAccess(1, 3, { role: 'Cliente' })).resolves.toEqual({
            ok: true,
            changed: false,
        });
        expect(updateUserAccess).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });

    it('404 si la cuenta no existe', async () => {
        lockUserAccess.mockResolvedValue(null);
        await expect(changeUserAccess(1, 99, { role: 'Editor' })).resolves.toMatchObject({
            ok: false,
            code: 'not_found',
        });
        expect(updateUserAccess).not.toHaveBeenCalled();
    });

    describe('último administrador (RNF6)', () => {
        const rejected = {
            ok: false,
            code: 'last_admin',
            message: 'Siempre debe quedar al menos un administrador',
        };

        beforeEach(() => {
            lockActiveAdminIds.mockResolvedValue([1]);
            lockUserAccess.mockResolvedValue({ id: 1, role: 'Administrador', isActive: true });
        });

        it.each([
            ['degradarse a sí mismo', 1, { role: 'Editor' }],
            ['desactivarse a sí mismo', 1, { isActive: false }],
        ] as const)('rechaza %s', async (_, actor, change) => {
            await expect(changeUserAccess(actor, 1, change)).resolves.toEqual(rejected);
            expect(updateUserAccess).not.toHaveBeenCalled();
            expect(insertAuditLogQuery).not.toHaveBeenCalled();
        });

        it('rechaza degradar o desactivar al único administrador aunque lo pida otra cuenta', async () => {
            await expect(changeUserAccess(7, 1, { role: 'Cliente' })).resolves.toEqual(rejected);
            await expect(changeUserAccess(7, 1, { isActive: false })).resolves.toEqual(rejected);
        });

        it('permite degradarse si hay otro administrador activo', async () => {
            lockActiveAdminIds.mockResolvedValue([1, 2]);
            await expect(changeUserAccess(1, 1, { role: 'Editor' })).resolves.toMatchObject({
                ok: true,
                changed: true,
            });
            expect(insertAuditLogQuery).toHaveBeenCalledWith(
                tx,
                expect.objectContaining({
                    details: 'cuenta 1; lo cambia Administrador (cuenta 1) sobre su propia cuenta',
                }),
            );
        });
    });

    it('deja pasar un fallo inesperado de la BD', async () => {
        updateUserAccess.mockRejectedValue(new Error('db'));
        await expect(changeUserAccess(1, 3, { role: 'Editor' })).rejects.toThrow('db');
    });
});
