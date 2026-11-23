import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdminDashboard, type DashboardData } from './dashboard';

const NOW = new Date('2026-10-15T12:00:00Z');

const data: DashboardData = {
    catalog: { totalProducts: 142, lowStockProducts: 7 },
    topSelling: [
        { productId: 1, name: 'Jotrón Reserva 2019', units: 412 },
        { productId: 2, name: 'Gran Jotrón Selección', units: 1 },
    ],
    orders: {
        stats: { activeOrders: 38, pendingShipment: 5, monthRevenue: '24850.00' },
        recent: [
            {
                id: 4521,
                customerName: 'Lucía',
                customerLastName: 'Fernández',
                customerEmail: 'lucia@x.es',
                createdAt: '2026-10-15 09:00:00',
                total: '135.00',
                status: 'Entregado',
            },
        ],
        activity: [
            {
                id: 1,
                action: 'Reembolso pendiente',
                details: 'pedido 4 anulado',
                loggedAt: '2026-10-15 11:50:00',
            },
        ],
    },
};

const html = (isAdmin: boolean, d: DashboardData = data) =>
    renderToStaticMarkup(createElement(AdminDashboard, { isAdmin, data: d, now: NOW }));

describe('AdminDashboard (administrador)', () => {
    const out = html(true);

    it('enseña las cuatro cifras, en el orden de Figma', () => {
        const order = [
            'Total de vinos',
            'Pedidos activos',
            'Ingresos del mes hasta la fecha',
            'Alertas de existencias bajas',
        ].map((label) => out.indexOf(label));
        expect(order.every((i) => i >= 0)).toBe(true);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
        expect(out).toContain('142');
        expect(out).toContain('5 pendientes de envío');
        expect(out).toContain('24.850,00');
        expect(out).toContain('vinos por debajo del umbral');
    });

    it('enseña pedidos recientes, vinos más vendidos, acciones y actividad', () => {
        expect(out).toContain('Pedidos recientes');
        expect(out).toContain('PJ-4521');
        expect(out).toContain('Lucía Fernández');
        expect(out).toContain('Entregado');
        expect(out).toContain('Vinos más vendidos');
        expect(out).toContain('412 unidades');
        expect(out).toContain('1 unidad<');
        expect(out).toContain('Actividad reciente');
        expect(out).toContain('Hace 10 minutos');
        expect(out).toContain('Reembolso pendiente: pedido 4 anulado');
        expect(out).toContain('Tramitar pedidos');
    });

    it('no trae «+12 % respecto al mes pasado» ni «Ver informes»', () => {
        expect(out).not.toContain('respecto al mes pasado');
        expect(out).not.toContain('Ver informes');
    });
});

describe('AdminDashboard (editor)', () => {
    // Aunque por error llegaran datos de pedidos, el editor no los ve.
    const out = html(false);

    it('solo enseña lo de catálogo', () => {
        expect(out).toContain('Total de vinos');
        expect(out).toContain('Alertas de existencias bajas');
        expect(out).toContain('Vinos más vendidos');
        expect(out).toContain('Añadir vino');
    });

    it('no enseña pedidos, ingresos, actividad ni «Tramitar pedidos» (su rol no los abre)', () => {
        for (const text of [
            'Pedidos activos',
            'Ingresos del mes',
            'Pedidos recientes',
            'PJ-4521',
            'Actividad reciente',
            'Reembolso pendiente',
            'Tramitar pedidos',
            '/admin/pedidos',
            '/admin/auditoria',
        ])
            expect(out).not.toContain(text);
    });
});

describe('AdminDashboard (estados vacíos)', () => {
    const empty: DashboardData = {
        catalog: { totalProducts: 0, lowStockProducts: 0 },
        topSelling: [],
        orders: {
            stats: { activeOrders: 0, pendingShipment: 1, monthRevenue: '0.00' },
            recent: [],
            activity: [],
        },
    };
    const out = html(true, empty);

    it('avisa de que no hay datos en cada tarjeta', () => {
        expect(out).toContain('Todavía no hay pedidos.');
        expect(out).toContain('Aún no hay ventas en los últimos 30 días.');
        expect(out).toContain('Todavía no hay actividad registrada.');
    });

    it('sin existencias bajas, no avisa en rojo', () => {
        expect(out).toContain('ningún vino por debajo del umbral');
        expect(out).not.toContain('text-destructive');
        expect(out).toContain('1 pendiente de envío');
    });
});
