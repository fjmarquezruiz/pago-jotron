import { describe, expect, it } from 'vitest';
import { leavesNoAdmin, type AccessChange, type AccessTarget } from './last-admin';

const admin = (id: number, isActive = true): AccessTarget => ({
    id,
    role: 'Administrador',
    isActive,
});
const customer: AccessTarget = { id: 9, role: 'Cliente', isActive: true };

describe('leavesNoAdmin: el único administrador', () => {
    const only = [1];
    it.each<[string, AccessChange]>([
        ['degradarlo a Editor', { role: 'Editor' }],
        ['degradarlo a Cliente', { role: 'Cliente' }],
        ['desactivarlo', { isActive: false }],
        ['degradarlo y desactivarlo a la vez', { role: 'Cliente', isActive: false }],
    ])('rechaza %s', (_, change) => {
        expect(leavesNoAdmin({ activeAdminIds: only, target: admin(1), change })).toBe(true);
    });

    it.each<[string, AccessChange]>([
        ['no cambiar nada', {}],
        ['mantener el rol', { role: 'Administrador' }],
        ['mantenerlo activo', { isActive: true }],
    ])('permite %s', (_, change) => {
        expect(leavesNoAdmin({ activeAdminIds: only, target: admin(1), change })).toBe(false);
    });
});

describe('leavesNoAdmin: hay más administradores activos', () => {
    const two = [1, 2];
    it.each<[string, AccessChange]>([
        ['degradar a uno', { role: 'Editor' }],
        ['desactivar a uno', { isActive: false }],
    ])('permite %s', (_, change) => {
        expect(leavesNoAdmin({ activeAdminIds: two, target: admin(1), change })).toBe(false);
        expect(leavesNoAdmin({ activeAdminIds: two, target: admin(2), change })).toBe(false);
    });

    it('rechaza dejar a los dos fuera, uno tras otro', () => {
        // Tras degradar al 1 solo queda el 2: la siguiente petición ya ve un único administrador.
        expect(
            leavesNoAdmin({ activeAdminIds: [2], target: admin(2), change: { role: 'Editor' } }),
        ).toBe(true);
    });
});

describe('leavesNoAdmin: cuentas que no cuentan', () => {
    it('cambiar a un cliente nunca deja sin administrador mientras haya uno', () => {
        for (const change of [{ role: 'Editor' }, { isActive: false }] as AccessChange[])
            expect(leavesNoAdmin({ activeAdminIds: [1], target: customer, change })).toBe(false);
    });

    it('subir a Administrador a una cuenta suma uno', () => {
        expect(
            leavesNoAdmin({
                activeAdminIds: [],
                target: customer,
                change: { role: 'Administrador' },
            }),
        ).toBe(false);
    });

    it('un administrador ya desactivado no cuenta, ni estando en la lista de activos por error', () => {
        const inactive = admin(1, false);
        expect(
            leavesNoAdmin({ activeAdminIds: [2], target: inactive, change: { role: 'Cliente' } }),
        ).toBe(false);
        expect(
            leavesNoAdmin({ activeAdminIds: [], target: inactive, change: { isActive: true } }),
        ).toBe(false);
    });

    it('reactivar a un administrador desactivado suma uno', () => {
        expect(
            leavesNoAdmin({
                activeAdminIds: [],
                target: admin(1, false),
                change: { isActive: true },
            }),
        ).toBe(false);
    });
});
