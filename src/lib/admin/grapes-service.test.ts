import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertAuditLogQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    insertAuditLogQuery: (...a: unknown[]) => insertAuditLogQuery(...a),
}));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: vi.fn() }));
vi.mock('@/db', () => ({
    db: { transaction: (fn: (tx: unknown) => unknown) => fn('tx') },
}));
const insertGrape = vi.fn();
const lockGrape = vi.fn();
const updateGrape = vi.fn();
const deleteGrapeRow = vi.fn();
vi.mock('@/lib/db/admin-grapes', () => ({
    insertGrape: (...a: unknown[]) => insertGrape(...a),
    lockGrape: (...a: unknown[]) => lockGrape(...a),
    updateGrape: (...a: unknown[]) => updateGrape(...a),
    deleteGrapeRow: (...a: unknown[]) => deleteGrapeRow(...a),
}));

import { createGrape, deleteGrape, updateGrapeValues } from './grapes-service';

const editor = { id: 2, role: 'Editor' as const };

beforeEach(() => {
    for (const mock of [insertGrape, lockGrape, updateGrape, deleteGrapeRow, insertAuditLogQuery])
        mock.mockReset();
});

describe('createGrape', () => {
    it('inserta y deja el asiento en la misma transacción', async () => {
        insertGrape.mockResolvedValue(11);
        const result = await createGrape(editor, { name: 'Romé', color: 'Tinta' });
        expect(result).toEqual({ ok: true, value: { id: 11 } });
        expect(insertGrape).toHaveBeenCalledWith('tx', { name: 'Romé', color: 'Tinta' });
        expect(insertAuditLogQuery).toHaveBeenCalledWith('tx', {
            userId: 2,
            action: 'Variedad de uva 11: creada',
            details: '«Romé»; lo cambia Editor (cuenta 2)',
        });
    });
    it('un nombre repetido es duplicate y no deja asiento', async () => {
        insertGrape.mockRejectedValue({ code: 'ER_DUP_ENTRY', errno: 1062 });
        expect(await createGrape(editor, { name: 'Romé', color: 'Tinta' })).toEqual({
            ok: false,
            code: 'duplicate',
            message: 'Ya existe una variedad con ese nombre',
        });
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('un error inesperado se propaga', async () => {
        insertGrape.mockRejectedValue(new Error('caída'));
        await expect(createGrape(editor, { name: 'x', color: 'Tinta' })).rejects.toThrow('caída');
    });
});

describe('updateGrapeValues', () => {
    it('no existe', async () => {
        lockGrape.mockResolvedValue(null);
        const result = await updateGrapeValues(editor, 5, { name: 'a', color: 'Tinta' });
        expect(result).toMatchObject({ ok: false, code: 'not_found' });
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('sin cambios no escribe ni audita', async () => {
        lockGrape.mockResolvedValue({ id: 5, name: 'Romé', color: 'Tinta', wineCount: 2 });
        expect(await updateGrapeValues(editor, 5, { name: 'Romé', color: 'Tinta' })).toEqual({
            ok: true,
            value: { changed: false },
        });
        expect(updateGrape).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('guarda y audita los campos que cambian', async () => {
        lockGrape.mockResolvedValue({ id: 5, name: 'Rome', color: 'Tinta', wineCount: 0 });
        const result = await updateGrapeValues(editor, 5, { name: 'Romé', color: 'Blanca' });
        expect(result).toEqual({ ok: true, value: { changed: true } });
        expect(updateGrape).toHaveBeenCalledWith('tx', 5, { name: 'Romé', color: 'Blanca' });
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            'tx',
            expect.objectContaining({ action: 'Variedad de uva 5: cambia: nombre, color' }),
        );
    });
    it('un nombre que ya es de otra uva es duplicate', async () => {
        lockGrape.mockResolvedValue({ id: 5, name: 'a', color: 'Tinta', wineCount: 0 });
        updateGrape.mockRejectedValue({ code: 'ER_DUP_ENTRY' });
        expect(await updateGrapeValues(editor, 5, { name: 'b', color: 'Tinta' })).toMatchObject({
            ok: false,
            code: 'duplicate',
        });
    });
});

describe('deleteGrape', () => {
    it('no se borra una uva en uso', async () => {
        lockGrape.mockResolvedValue({ id: 5, name: 'Romé', color: 'Tinta', wineCount: 3 });
        expect(await deleteGrape(editor, 5)).toMatchObject({ ok: false, code: 'in_use' });
        expect(deleteGrapeRow).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('no existe', async () => {
        lockGrape.mockResolvedValue(null);
        expect(await deleteGrape(editor, 5)).toMatchObject({ ok: false, code: 'not_found' });
    });
    it('borra la que ningún producto usa y audita', async () => {
        lockGrape.mockResolvedValue({ id: 5, name: 'Romé', color: 'Tinta', wineCount: 0 });
        expect(await deleteGrape(editor, 5)).toEqual({ ok: true, value: { deleted: true } });
        expect(deleteGrapeRow).toHaveBeenCalledWith('tx', 5);
        expect(insertAuditLogQuery).toHaveBeenCalledWith('tx', {
            userId: 2,
            action: 'Variedad de uva 5: eliminada',
            details: '«Romé»; lo cambia Editor (cuenta 2)',
        });
    });
});
