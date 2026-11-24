import { describe, expect, it } from 'vitest';
import { ADMIN_NAV, adminNavFor, isAdminNavCurrent } from './nav';

describe('adminNavFor', () => {
    it('el editor ve el panel, el catálogo y los cuatro valores asociados', () => {
        expect(adminNavFor('Editor').map((i) => i.label)).toEqual([
            'Panel de control',
            'Catálogo',
            'Bodegas',
            'Denominaciones',
            'Variedades de uva',
            'Tipologías',
        ]);
    });

    it('el administrador ve además pedidos, usuarios, envíos y registro de actividad', () => {
        const labels = adminNavFor('Administrador').map((i) => i.label);
        expect(labels).toHaveLength(10);
        expect(labels.slice(6)).toEqual([
            'Pedidos',
            'Usuarios',
            'Tipos de envío',
            'Registro de actividad',
        ]);
    });

    it('un cliente no ve ningún enlace', () => {
        expect(adminNavFor('Cliente')).toEqual([]);
    });

    it('no hay enlaces de Eventos, Blog ni Log de errores (son del MVP2)', () => {
        const labels = ADMIN_NAV.map((i) => i.label);
        expect(labels).not.toContain('Eventos');
        expect(labels).not.toContain('Blog');
        expect(labels).not.toContain('Log de errores');
    });

    it('las rutas del menú solo del administrador son las que el middleware le reserva', () => {
        const adminOnly = ADMIN_NAV.filter((i) => !i.roles.includes('Editor')).map((i) => i.href);
        expect(adminOnly).toEqual([
            '/admin/pedidos',
            '/admin/usuarios',
            '/admin/envios',
            '/admin/auditoria',
        ]);
    });
});

describe('isAdminNavCurrent', () => {
    it.each([
        ['/admin', '/admin', true],
        ['/admin', '/admin/productos', false],
        ['/admin/productos', '/admin/productos', true],
        ['/admin/productos', '/admin/productos/12', true],
        ['/admin/productos', '/admin/productosx', false],
        ['/admin/bodegas', '/admin/productos', false],
    ])('%s con la ruta %s → %s', (href, pathname, expected) => {
        expect(isAdminNavCurrent(href, pathname)).toBe(expected);
    });
});
