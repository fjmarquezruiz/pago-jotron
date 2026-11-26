import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertAuditLogQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    insertAuditLogQuery: (...a: unknown[]) => insertAuditLogQuery(...a),
}));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: vi.fn() }));
vi.mock('@/db', () => ({
    db: { transaction: (fn: (tx: unknown) => unknown) => fn('tx') },
}));
const insertTypology = vi.fn();
const lockTypology = vi.fn();
const updateTypology = vi.fn();
const deleteTypologyRow = vi.fn();
vi.mock('@/lib/db/admin-typologies', () => ({
    insertTypology: (...a: unknown[]) => insertTypology(...a),
    lockTypology: (...a: unknown[]) => lockTypology(...a),
    updateTypology: (...a: unknown[]) => updateTypology(...a),
    deleteTypologyRow: (...a: unknown[]) => deleteTypologyRow(...a),
}));

import {
    createTypology,
    deleteTypology,
    toTypologyValues,
    updateTypologyValues,
} from './typologies-service';

const admin = { id: 1, role: 'Administrador' as const };
const input = { name: 'Pasa moscatel', productType: 'Pasas' as const, filterOrder: 7, taxRate: 10 };
const stored = {
    id: 7,
    name: 'Pasa moscatel',
    productType: 'Pasas' as const,
    filterOrder: 7,
    taxRate: '10.00',
    productCount: 0,
};

beforeEach(() => {
    for (const mock of [
        insertTypology,
        lockTypology,
        updateTypology,
        deleteTypologyRow,
        insertAuditLogQuery,
    ])
        mock.mockReset();
});

describe('toTypologyValues', () => {
    it('el IVA va como texto decimal con dos cifras', () => {
        expect(toTypologyValues(input).taxRate).toBe('10.00');
        expect(toTypologyValues({ ...input, taxRate: 7.5 }).taxRate).toBe('7.50');
    });
});

describe('createTypology', () => {
    it('inserta y audita en la misma transacción', async () => {
        insertTypology.mockResolvedValue(8);
        expect(await createTypology(admin, input)).toEqual({ ok: true, value: { id: 8 } });
        expect(insertTypology).toHaveBeenCalledWith('tx', { ...input, taxRate: '10.00' });
        expect(insertAuditLogQuery).toHaveBeenCalledWith('tx', {
            userId: 1,
            action: 'Tipología 8: creada',
            details: '«Pasa moscatel»; lo cambia Administrador (cuenta 1)',
        });
    });
    it('un nombre repetido es duplicate', async () => {
        insertTypology.mockRejectedValue({ errno: 1062 });
        expect(await createTypology(admin, input)).toMatchObject({
            ok: false,
            code: 'duplicate',
        });
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
});

describe('updateTypologyValues', () => {
    it('no existe', async () => {
        lockTypology.mockResolvedValue(null);
        expect(await updateTypologyValues(admin, 7, input)).toMatchObject({
            ok: false,
            code: 'not_found',
        });
    });
    it('el IVA 10.00 de la BD y 10 del cuerpo no cuentan como cambio', async () => {
        lockTypology.mockResolvedValue(stored);
        expect(await updateTypologyValues(admin, 7, input)).toEqual({
            ok: true,
            value: { changed: false },
        });
        expect(updateTypology).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('guarda y audita los campos que cambian', async () => {
        lockTypology.mockResolvedValue(stored);
        await updateTypologyValues(admin, 7, { ...input, taxRate: 21, filterOrder: 3 });
        expect(updateTypology).toHaveBeenCalledWith('tx', 7, {
            ...input,
            taxRate: '21.00',
            filterOrder: 3,
        });
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            'tx',
            expect.objectContaining({ action: 'Tipología 7: cambia: orden en filtros, IVA' }),
        );
    });
});

describe('deleteTypology', () => {
    it('no se borra una tipología en uso', async () => {
        lockTypology.mockResolvedValue({ ...stored, productCount: 4 });
        expect(await deleteTypology(admin, 7)).toMatchObject({ ok: false, code: 'in_use' });
        expect(deleteTypologyRow).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('borra la que ningún producto usa y audita', async () => {
        lockTypology.mockResolvedValue(stored);
        expect(await deleteTypology(admin, 7)).toEqual({ ok: true, value: { deleted: true } });
        expect(deleteTypologyRow).toHaveBeenCalledWith('tx', 7);
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            'tx',
            expect.objectContaining({ action: 'Tipología 7: eliminada' }),
        );
    });
});
