import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import type { AdminUser } from '@/lib/db/admin-users';
import { changeAccessRequest } from './change-access-request';
import { AdminUserDetail } from './admin-user-detail';
import { AdminUsersFilters } from './admin-users-filters';
import { AdminUsersTable } from './admin-users-table';
import { UserRoleBadge, UserStatusBadge } from './user-badges';

const row = (id: number, role: 'Cliente' | 'Editor' | 'Administrador', isActive = true) => ({
    id,
    name: 'Sophia',
    lastName: 'Sterling',
    email: 'sophia.s@luxe.com',
    role,
    isActive,
    registrationDate: '2026-01-12 10:00:00',
});

describe('AdminUsersTable', () => {
    const html = renderToStaticMarkup(
        createElement(AdminUsersTable, {
            rows: [row(1, 'Cliente'), row(2, 'Administrador', false)],
        }),
    );
    it('enseña id, nombre, correo, rol, fecha y estado', () => {
        expect(html).toContain('USR-001');
        expect(html).toContain('Sophia Sterling');
        expect(html).toContain('sophia.s@luxe.com');
        expect(html).toContain('12 ene 2026');
        expect(html).toContain('Activo');
        expect(html).toContain('Inactivo');
        expect(html).toContain('Administrador');
    });
    it('el ojo lleva a la ficha; no hay editar, papelera ni exportar', () => {
        expect(html).toContain('href="/admin/usuarios/2"');
        expect(html).not.toMatch(/Eliminar|Editar|Exportar|Nuevo usuario/);
    });
});

describe('insignias', () => {
    it('rol y estado', () => {
        expect(renderToStaticMarkup(createElement(UserRoleBadge, { role: 'Editor' }))).toContain(
            'Editor',
        );
        expect(renderToStaticMarkup(createElement(UserStatusBadge, { isActive: false }))).toContain(
            'Inactivo',
        );
    });
});

describe('AdminUsersFilters', () => {
    it('chips de rol y estado, y la búsqueda como chip aparte', () => {
        const html = renderToStaticMarkup(
            createElement(AdminUsersFilters, {
                filters: { role: 'Cliente', status: 'Activo', q: 'sophia' },
            }),
        );
        expect(html).toContain('Rol: cliente');
        expect(html).toContain('Estado: activo');
        expect(html).toContain('>sophia<');
        expect(html).toContain('Limpiar todo');
        expect(html).not.toContain('Nuevo usuario');
    });
    it('cerrada, la búsqueda es la lupa', () => {
        const html = renderToStaticMarkup(createElement(AdminUsersFilters, { filters: {} }));
        expect(html).toContain('aria-label="Buscar usuarios"');
    });
});

const data = (over: Partial<AdminUser> = {}): AdminUser => ({
    user: {
        id: 1,
        name: 'Sophia',
        lastName: 'Sterling',
        email: 'sophia.s@luxe.com',
        phone: '+34 611 123 456',
        idCard: null,
        birthDate: '1992-03-15',
        role: 'Cliente',
        isActive: true,
        registrationDate: '2026-01-12 10:00:00',
    },
    orderCount: 2,
    spent: '822.00',
    orders: [
        { id: 8423, createdAt: '2026-01-10 10:00:00', total: '148.00', status: 'Entregado' },
        { id: 8400, createdAt: '2026-01-02 10:00:00', total: '46.00', status: 'Anulado' },
    ],
    addresses: [
        {
            id: 1,
            type: 'Envío',
            recipientName: 'Sophia Sterling',
            streetType: 'Calle',
            streetName: 'de la Encina',
            number: '12',
            floor: '4B',
            postalCode: '29001',
            city: 'Málaga',
            province: 'Málaga',
            country: 'España',
        },
    ],
    isLastAdmin: false,
    ...over,
});
const render = (d: AdminUser) =>
    renderToStaticMarkup(
        createElement(AdminUserDetail, { data: d, now: new Date('2026-01-26T12:00:00Z') }),
    );

describe('AdminUserDetail', () => {
    const html = render(data());
    it('datos personales y de registro', () => {
        expect(html).toContain('Información personal');
        expect(html).toContain('15 / 03 / 1992');
        expect(html).toContain('12 ene 2026 (hace 14 días)');
        expect(html).toContain('+34 611 123 456');
    });
    it('total de pedidos y gasto', () => {
        expect(html).toContain('Total de pedidos');
        expect(html).toContain('2 pedidos');
        expect(html).toContain('Gasto total');
    });
    it('dirección y pedidos con factura solo en Entregado', () => {
        expect(html).toContain('Calle de la Encina, 12, 4B');
        expect(html).toContain('29001 Málaga, España');
        expect(html).toContain('/api/admin/pedidos/8423/factura');
        expect(html).not.toContain('/api/admin/pedidos/8400/factura');
    });
    it('sin Editar, Eliminar ni Añadir nuevo', () => {
        expect(html).not.toMatch(/Eliminar|Editar|Añadir nuevo/);
    });
    it('botones: Cambiar rol y Desactivar; Reactivar si está desactivada', () => {
        expect(html).toContain('Cambiar rol');
        expect(html).toContain('Desactivar');
        const inactive = render(data({ user: { ...data().user, isActive: false } }));
        expect(inactive).toContain('Reactivar');
        expect(inactive).toContain('Desactivado');
    });
    it('sin pedidos ni direcciones: estados vacíos y sin bloque de gasto', () => {
        const empty = render(data({ orderCount: 0, orders: [], addresses: [], spent: '0.00' }));
        expect(empty).toContain('Todavía no hay pedidos');
        expect(empty).toContain('no tiene direcciones guardadas');
        expect(empty).not.toContain('Gasto total');
    });
});

describe('changeAccessRequest', () => {
    const reply = (status: number, body: unknown) =>
        vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });

    it('manda PATCH con el cambio', async () => {
        const request = reply(200, { changed: true });
        await expect(changeAccessRequest(7, { role: 'Editor' }, request)).resolves.toEqual({
            kind: 'changed',
            changed: true,
        });
        expect(request).toHaveBeenCalledWith('/api/admin/usuarios/7', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'Editor' }),
        });
    });
    it('un 409 es el último administrador', async () => {
        await expect(
            changeAccessRequest(1, { isActive: false }, reply(409, { message: 'x' })),
        ).resolves.toEqual({ kind: 'last_admin' });
    });
    it.each([404, 400])('un %s con mensaje es un rechazo', async (status) => {
        await expect(
            changeAccessRequest(1, { isActive: false }, reply(status, { message: 'No' })),
        ).resolves.toEqual({ kind: 'rejected', message: 'No' });
    });
    it.each([401, 403, 500])('un %s es un error', async (status) => {
        await expect(
            changeAccessRequest(1, { isActive: false }, reply(status, { message: 'x' })),
        ).resolves.toEqual({ kind: 'error' });
    });
    it('sin red es un error y no lanza', async () => {
        const request = vi.fn().mockRejectedValue(new Error('offline'));
        await expect(changeAccessRequest(1, { isActive: false }, request)).resolves.toEqual({
            kind: 'error',
        });
    });
});
