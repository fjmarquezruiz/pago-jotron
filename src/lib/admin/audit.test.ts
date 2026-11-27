import { describe, expect, it } from 'vitest';
import {
    AUDIT_KINDS,
    adminAuditFilterLabels,
    adminAuditHref,
    adminAuditRangeText,
    auditDotClass,
    auditKind,
    hasAdminAuditFilters,
} from './audit';
import { parseAdminAuditParams } from '@/lib/validations/admin-audit';

describe('auditKind', () => {
    it.each([
        ['Pedido PJ-4521: Confirmado → En proceso', 'Pedido'],
        ['Pedido anulado: no se pudo cobrar el pago', 'Pedido'],
        ['Producto 7: cambia: nombre, precio', 'Catálogo'],
        ['Denominación de origen 2: creada', 'Catálogo'],
        ['Variedad de uva 4: creada', 'Catálogo'],
        ['Tipología 1: cambia: nombre', 'Catálogo'],
        ['Bodega 3: ventas bloqueadas', 'Bodega'],
        ['Usuario USR-004: rol Cliente → Editor', 'Usuario'],
        ['Tipo de envío 2: desactivado', 'Envío'],
        ['Reembolso pendiente', 'Sistema'],
        ['Estado del cobro desconocido', 'Sistema'],
        ['', 'Sistema'],
    ])('%s es %s', (action, kind) => {
        expect(auditKind(action)).toBe(kind);
    });

    it('«Pedidos» sin número también es Pedido y «Productos» no confunde con Producto', () => {
        expect(auditKind('Pedido 5: Enviado')).toBe('Pedido');
        expect(auditKind('Productora: x')).toBe('Sistema');
    });

    it('cada tipo tiene su color y no se repite', () => {
        const dots = AUDIT_KINDS.map(({ kind }) => auditDotClass(kind));
        expect(new Set(dots).size).toBe(AUDIT_KINDS.length);
    });
});

describe('adminAuditHref', () => {
    it('sin nada es la ruta a secas; la página 1 va sin pagina', () => {
        expect(adminAuditHref({})).toBe('/admin/auditoria');
        expect(adminAuditHref({ page: 1 })).toBe('/admin/auditoria');
    });
    it('conserva los filtros', () => {
        expect(
            adminAuditHref({
                page: 3,
                from: '2026-10-01',
                to: '2026-10-31',
                userId: 4,
                kind: 'Pedido',
                q: 'PJ-1',
            }),
        ).toBe(
            '/admin/auditoria?pagina=3&desde=2026-10-01&hasta=2026-10-31&usuario=4&tipo=Pedido&q=PJ-1',
        );
    });
});

describe('filtros', () => {
    it('hasAdminAuditFilters', () => {
        expect(hasAdminAuditFilters({})).toBe(false);
        expect(hasAdminAuditFilters({ kind: 'Bodega' })).toBe(true);
        expect(hasAdminAuditFilters({ userId: 2 })).toBe(true);
    });
    it('chips', () => {
        expect(adminAuditFilterLabels({})).toEqual({
            date: 'Fechas: todas',
            user: 'Usuarios: todos',
            kind: 'Tipo: todos',
        });
        expect(
            adminAuditFilterLabels(
                { from: '2026-10-01', to: '2026-10-31', userId: 4, kind: 'Pedido', q: 'x' },
                'Ana Pérez',
            ),
        ).toEqual({
            date: 'Fechas: 1 oct 2026 – 31 oct 2026',
            user: 'Usuarios: Ana Pérez',
            kind: 'Tipo: pedido',
            search: 'x',
        });
        expect(adminAuditFilterLabels({ from: '2026-10-01' }).date).toBe(
            'Fechas: desde 1 oct 2026',
        );
        expect(adminAuditFilterLabels({ to: '2026-10-31' }).date).toBe('Fechas: hasta 31 oct 2026');
        expect(adminAuditFilterLabels({ userId: 9 }).user).toBe('Usuarios: cuenta 9');
    });
});

describe('adminAuditRangeText', () => {
    const base = { page: 1, pageSize: 10, shown: 10, total: 142, overall: 142, filtered: false };
    it('sin filtros', () => {
        expect(adminAuditRangeText(base)).toBe('Mostrando 1–10 de 142 registros');
        expect(adminAuditRangeText({ ...base, page: 3, shown: 2 })).toBe(
            'Mostrando 21–22 de 142 registros',
        );
    });
    it('con filtros', () => {
        expect(adminAuditRangeText({ ...base, filtered: true, total: 3 })).toBe(
            'Mostrando 3 registros filtrados de 142',
        );
        expect(adminAuditRangeText({ ...base, filtered: true, total: 1 })).toBe(
            'Mostrando 1 registro filtrado de 142',
        );
    });
    it('sin resultados', () => {
        expect(adminAuditRangeText({ ...base, shown: 0, total: 0 })).toBe('Mostrando 0 de 0');
    });
});

describe('parseAdminAuditParams', () => {
    it('por defecto, página 1 y sin filtros', () => {
        expect(parseAdminAuditParams({})).toEqual({ page: 1 });
    });
    it('lee los parámetros válidos', () => {
        expect(
            parseAdminAuditParams({
                pagina: '2',
                desde: '2026-10-01',
                hasta: '2026-10-31',
                usuario: '4',
                tipo: 'Pedido',
                q: ' PJ ',
            }),
        ).toEqual({
            page: 2,
            from: '2026-10-01',
            to: '2026-10-31',
            userId: 4,
            kind: 'Pedido',
            q: 'PJ',
        });
    });
    it('ignora lo que no es válido', () => {
        expect(
            parseAdminAuditParams({
                pagina: '0',
                desde: '2026-02-30',
                usuario: 'abc',
                tipo: 'Blog',
                q: '   ',
            }),
        ).toEqual({ page: 1 });
        expect(parseAdminAuditParams({ tipo: ['Pedido', 'Bodega'] })).toEqual({ page: 1 });
    });
    it('descarta las dos fechas si el rango está al revés', () => {
        expect(parseAdminAuditParams({ desde: '2026-10-31', hasta: '2026-10-01' })).toEqual({
            page: 1,
        });
    });
});
