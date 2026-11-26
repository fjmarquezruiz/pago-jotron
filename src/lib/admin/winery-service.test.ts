import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Resultados que devuelven, en orden, las consultas de la transacción simulada. */
let results: unknown[];
const tx = {
    select: vi.fn(() => {
        const next = results.shift();
        const chain: Record<string, unknown> = {
            from: () => chain,
            where: () => chain,
            for: () => Promise.resolve(next),
            then: (resolve: (value: unknown) => unknown) => resolve(next),
        };
        return chain;
    }),
    insert: vi.fn(() => ({ values: () => ({ $returningId: async () => [{ id: 9 }] }) })),
    update: vi.fn(() => ({ set: () => ({ where: async () => undefined }) })),
    delete: vi.fn(() => ({ where: async () => undefined })),
};
vi.mock('@/db', () => ({
    db: { transaction: (run: (t: unknown) => Promise<unknown>) => run(tx) },
}));
const insertAuditLogQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    insertAuditLogQuery: (...a: unknown[]) => insertAuditLogQuery(...a),
}));

import { createWinery, deleteWinery, setWinerySalesBlocked, updateWinery } from './winery-service';

const user = { id: 2, role: 'Editor' as const };
const row = {
    id: 3,
    name: 'Lustau',
    description: null,
    address: null,
    city: 'Jerez',
    province: null,
    country: 'España',
    phone: null,
    email: null,
    website: null,
    isBlocked: false,
};
const input = {
    name: 'Lustau',
    description: null,
    address: null,
    city: 'Jerez',
    province: null,
    country: 'España',
    phone: null,
    email: null,
    website: null,
};

beforeEach(() => {
    results = [];
    vi.clearAllMocks();
    insertAuditLogQuery.mockResolvedValue(undefined);
});

describe('createWinery', () => {
    it('inserta y audita en la misma transacción', async () => {
        expect(await createWinery(user, input)).toEqual({ ok: true, id: 9 });
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({ userId: 2, action: 'Bodega 9: creada' }),
        );
    });
    it('un nombre repetido es duplicate y no deja asiento', async () => {
        tx.insert.mockImplementationOnce(() => {
            throw Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY', errno: 1062 });
        });
        expect(await createWinery(user, input)).toMatchObject({ ok: false, code: 'duplicate' });
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
});

describe('updateWinery', () => {
    it('sin cambios no escribe ni audita', async () => {
        results = [[row]];
        expect(await updateWinery(user, 3, input)).toEqual({ ok: true, changed: false });
        expect(tx.update).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('con cambios, anota qué campos', async () => {
        results = [[row]];
        expect(
            await updateWinery(user, 3, { ...input, city: 'Ronda', phone: '952000000' }),
        ).toEqual({
            ok: true,
            changed: true,
        });
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({ action: 'Bodega 3: cambia: ciudad, teléfono' }),
        );
    });
    it('no existe', async () => {
        results = [[]];
        expect(await updateWinery(user, 3, input)).toMatchObject({ ok: false, code: 'not_found' });
    });
});

describe('setWinerySalesBlocked', () => {
    it('bloquea y audita', async () => {
        results = [[row]];
        expect(await setWinerySalesBlocked({ id: 1, role: 'Administrador' }, 3, true)).toEqual({
            ok: true,
            changed: true,
        });
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({ action: 'Bodega 3: ventas bloqueadas', userId: 1 }),
        );
    });
    it('el mismo estado no cambia nada', async () => {
        results = [[row]];
        expect(await setWinerySalesBlocked(user, 3, false)).toEqual({ ok: true, changed: false });
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
});

describe('deleteWinery', () => {
    it('con productos no se borra (in_use)', async () => {
        results = [[row], [{ total: 2 }]];
        expect(await deleteWinery(user, 3)).toMatchObject({ ok: false, code: 'in_use' });
        expect(tx.delete).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('sin productos se borra y se audita', async () => {
        results = [[row], [{ total: 0 }]];
        expect(await deleteWinery(user, 3)).toEqual({ ok: true });
        expect(tx.delete).toHaveBeenCalled();
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({ action: 'Bodega 3: borrada' }),
        );
    });
    it('no existe', async () => {
        results = [[]];
        expect(await deleteWinery(user, 3)).toMatchObject({ ok: false, code: 'not_found' });
    });
});
