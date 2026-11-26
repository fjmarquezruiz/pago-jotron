import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertAuditLogQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    insertAuditLogQuery: (...a: unknown[]) => insertAuditLogQuery(...a),
}));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: vi.fn() }));
vi.mock('@/db', () => ({
    db: { transaction: (fn: (tx: unknown) => unknown) => fn('tx') },
}));
const insertShippingType = vi.fn();
const lockShippingType = vi.fn();
const countOtherActiveShippingTypes = vi.fn();
const updateShippingTypeRow = vi.fn();
vi.mock('@/lib/db/admin-shipping', () => ({
    insertShippingType: (...a: unknown[]) => insertShippingType(...a),
    lockShippingType: (...a: unknown[]) => lockShippingType(...a),
    countOtherActiveShippingTypes: (...a: unknown[]) => countOtherActiveShippingTypes(...a),
    updateShippingTypeRow: (...a: unknown[]) => updateShippingTypeRow(...a),
}));

import { createShippingType, updateShippingType } from './shipping-types-service';

const admin = { id: 1, role: 'Administrador' as const };
const input = {
    name: 'Exprés',
    cost: 9.95,
    minDeliveryDays: 1,
    maxDeliveryDays: 1,
    isBlocked: false,
};
const stored = {
    id: 2,
    name: 'Exprés',
    cost: '9.95',
    minDeliveryDays: 1,
    maxDeliveryDays: 1,
    isBlocked: false,
};

beforeEach(() => {
    for (const mock of [
        insertShippingType,
        lockShippingType,
        countOtherActiveShippingTypes,
        updateShippingTypeRow,
        insertAuditLogQuery,
    ])
        mock.mockReset();
});

describe('createShippingType', () => {
    it('inserta con el coste en decimal y deja el asiento en la misma transacción', async () => {
        insertShippingType.mockResolvedValue(5);
        const result = await createShippingType(admin, input);
        expect(result).toEqual({ ok: true, value: { id: 5 } });
        expect(insertShippingType).toHaveBeenCalledWith('tx', { ...input, cost: '9.95' });
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            'tx',
            expect.objectContaining({ userId: 1, action: 'Tipo de envío 5: creado' }),
        );
    });
    it('nombre repetido: duplicate y sin asiento', async () => {
        insertShippingType.mockRejectedValue(
            Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY', errno: 1062 }),
        );
        const result = await createShippingType(admin, input);
        expect(result).toMatchObject({ ok: false, code: 'duplicate' });
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
});

describe('updateShippingType', () => {
    it('no existe: not_found', async () => {
        lockShippingType.mockResolvedValue(null);
        expect(await updateShippingType(admin, 9, input)).toMatchObject({
            ok: false,
            code: 'not_found',
        });
    });
    it('sin cambios: no escribe ni audita', async () => {
        lockShippingType.mockResolvedValue(stored);
        expect(await updateShippingType(admin, 2, input)).toEqual({
            ok: true,
            value: { changed: false },
        });
        expect(updateShippingTypeRow).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('edita y audita los campos que cambian', async () => {
        lockShippingType.mockResolvedValue(stored);
        const result = await updateShippingType(admin, 2, { ...input, cost: 12 });
        expect(result).toEqual({ ok: true, value: { changed: true } });
        expect(updateShippingTypeRow).toHaveBeenCalledWith('tx', 2, { ...input, cost: '12.00' });
        expect(insertAuditLogQuery).toHaveBeenCalledWith(
            'tx',
            expect.objectContaining({ action: 'Tipo de envío 2: cambia: precio' }),
        );
        expect(countOtherActiveShippingTypes).not.toHaveBeenCalled();
    });
    it('no desactiva el último activo', async () => {
        lockShippingType.mockResolvedValue(stored);
        countOtherActiveShippingTypes.mockResolvedValue(0);
        const result = await updateShippingType(admin, 2, { ...input, isBlocked: true });
        expect(result).toMatchObject({ ok: false, code: 'last_active' });
        expect(updateShippingTypeRow).not.toHaveBeenCalled();
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });
    it('desactiva si queda otro activo', async () => {
        lockShippingType.mockResolvedValue(stored);
        countOtherActiveShippingTypes.mockResolvedValue(2);
        const result = await updateShippingType(admin, 2, { ...input, isBlocked: true });
        expect(result).toEqual({ ok: true, value: { changed: true } });
        expect(countOtherActiveShippingTypes).toHaveBeenCalledWith('tx', 2);
    });
    it('reactivar no comprueba nada', async () => {
        lockShippingType.mockResolvedValue({ ...stored, isBlocked: true });
        await updateShippingType(admin, 2, input);
        expect(countOtherActiveShippingTypes).not.toHaveBeenCalled();
    });
});
