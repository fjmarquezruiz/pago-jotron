import { describe, expect, it } from 'vitest';
import {
    adminUserFilterLabels,
    adminUsersHref,
    adminUsersRangeText,
    formatBirthDate,
    hasAdminUserFilters,
    otherRoles,
    registrationText,
    selfChangeWarning,
    userFullName,
    userNumber,
} from './users';
import { parseAdminUserParams } from '@/lib/validations/admin-users';

describe('adminUsersHref', () => {
    it('sin nada es la ruta a secas; la página 1 va sin pagina', () => {
        expect(adminUsersHref({})).toBe('/admin/usuarios');
        expect(adminUsersHref({ page: 1 })).toBe('/admin/usuarios');
    });
    it('conserva los filtros', () => {
        expect(adminUsersHref({ page: 2, role: 'Editor', status: 'Activo', q: 'lu' })).toBe(
            '/admin/usuarios?pagina=2&rol=Editor&estado=Activo&q=lu',
        );
    });
});

describe('filtros', () => {
    it('hasAdminUserFilters', () => {
        expect(hasAdminUserFilters({})).toBe(false);
        expect(hasAdminUserFilters({ status: 'Inactivo' })).toBe(true);
    });
    it('chips', () => {
        expect(adminUserFilterLabels({})).toEqual({ role: 'Rol: todos', status: 'Estado: todos' });
        expect(adminUserFilterLabels({ role: 'Cliente', status: 'Activo', q: 'x' })).toEqual({
            role: 'Rol: cliente',
            status: 'Estado: activo',
            search: 'x',
        });
    });
});

describe('adminUsersRangeText', () => {
    const base = { page: 2, pageSize: 10, shown: 10, total: 142, overall: 142, filtered: false };
    it('rango, filtrados y vacío', () => {
        expect(adminUsersRangeText(base)).toBe('Mostrando 11-20 de 142');
        expect(adminUsersRangeText({ ...base, total: 3, shown: 3, filtered: true })).toBe(
            'Mostrando 3 usuarios filtrados de 142',
        );
        expect(adminUsersRangeText({ ...base, total: 1, shown: 1, filtered: true })).toBe(
            'Mostrando 1 usuario filtrado de 142',
        );
        expect(adminUsersRangeText({ ...base, shown: 0 })).toBe('Mostrando 0 de 0');
    });
});

describe('textos de la ficha', () => {
    it('userNumber', () => {
        expect(userNumber(1)).toBe('USR-001');
        expect(userNumber(1234)).toBe('USR-1234');
    });
    it('userFullName', () => {
        expect(userFullName({ name: 'Sophia', lastName: 'Sterling', email: 'a@b.c' })).toBe(
            'Sophia Sterling',
        );
        expect(userFullName({ name: ' Ana ', lastName: null, email: 'a@b.c' })).toBe('Ana');
        expect(userFullName({ name: null, lastName: null, email: 'a@b.c' })).toBe('a@b.c');
    });
    it('formatBirthDate', () => {
        expect(formatBirthDate('1992-03-15')).toBe('15 / 03 / 1992');
    });
    it('registrationText', () => {
        const now = new Date('2026-01-26T12:00:00Z');
        expect(registrationText('2026-01-12 10:00:00', now)).toBe('12 ene 2026 (hace 14 días)');
        expect(registrationText('2026-01-25 10:00:00', now)).toBe('25 ene 2026 (hace 1 día)');
        expect(registrationText('2026-01-26 10:00:00', now)).toBe('26 ene 2026 (hoy)');
    });
    it('otherRoles', () => {
        expect(otherRoles('Cliente')).toEqual(['Editor', 'Administrador']);
        expect(otherRoles('Administrador')).toEqual(['Cliente', 'Editor']);
    });
});

describe('selfChangeWarning', () => {
    it('desactivarse o pasar a Cliente pierde el panel', () => {
        expect(selfChangeWarning('disable')).toBe('Perderás el acceso al panel ahora mismo.');
        expect(selfChangeWarning('Cliente')).toBe('Perderás el acceso al panel ahora mismo.');
    });
    it('pasar a Editor solo pierde las secciones de administrador, tal como las dice el menú', () => {
        expect(selfChangeWarning('Editor')).toBe(
            'Dejarás de ver Pedidos, Usuarios, Tipos de envío y Registro de actividad.',
        );
    });
    it('ser Administrador no pierde nada', () => {
        expect(selfChangeWarning('Administrador')).toBeNull();
    });
});

describe('parseAdminUserParams', () => {
    it('lee página, filtros y búsqueda', () => {
        expect(
            parseAdminUserParams({ pagina: '2', rol: 'Editor', estado: 'Inactivo', q: ' lu ' }),
        ).toEqual({ page: 2, role: 'Editor', status: 'Inactivo', q: 'lu' });
    });
    it.each([
        ['rol inexistente', { rol: 'Root' }],
        ['estado inexistente', { estado: 'Pausado' }],
        ['página 0', { pagina: '0' }],
        ['q repetido', { q: ['a', 'b'] }],
        ['q vacío', { q: '   ' }],
        ['q largo', { q: 'x'.repeat(101) }],
    ])('ignora %s', (_, input) => {
        expect(parseAdminUserParams(input)).toEqual({ page: 1 });
    });
});
