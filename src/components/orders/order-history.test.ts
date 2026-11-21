import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OrderHistoryEmpty } from './order-history-empty';
import { OrderHistoryPagination } from './order-history-pagination';
import { OrderHistoryTable, type OrderHistoryRow } from './order-history-table';

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

const rows: OrderHistoryRow[] = [
    { id: 4501, createdAt: '2025-07-10 08:00:00', total: '189.00', status: 'Entregado' },
    { id: 4498, createdAt: '2025-07-03 08:00:00', total: '312.50', status: 'Pendiente de pago' },
    { id: 4410, createdAt: '2025-05-18 08:00:00', total: '93.20', status: 'Anulado' },
];

describe('OrderHistoryTable', () => {
    const out = html(createElement(OrderHistoryTable, { rows }));

    it('pinta número, fecha, total y estado de cada pedido', () => {
        expect(out).toContain('#PJ-4501');
        expect(out).toContain('10 jul 2025');
        expect(out).toContain('189,00');
        expect(out).toContain('#PJ-4498');
        expect(out).toContain('312,50');
    });

    it('cada estado lleva su badge', () => {
        for (const status of ['Entregado', 'Pendiente de pago', 'Anulado'])
            expect(out).toContain(status);
        expect(out).toContain('bg-success');
        expect(out).toContain('bg-destructive');
    });

    it('el ojo lleva al detalle del pedido, con nombre accesible', () => {
        expect(out).toContain('href="/pedidos/4501"');
        expect(out).toContain('aria-label="Ver pedido PJ-4501"');
    });

    it('tiene las cinco columnas con su cabecera', () => {
        for (const head of ['ID del pedido', 'Fecha', 'Total', 'Estado', 'Acciones'])
            expect(out).toContain(`>${head}</th>`);
    });
});

describe('OrderHistoryPagination', () => {
    const pagination = (props: Partial<React.ComponentProps<typeof OrderHistoryPagination>> = {}) =>
        html(
            createElement(OrderHistoryPagination, {
                summary: 'Mostrando 11–20 de 142',
                page: 2,
                totalPages: 15,
                filters: {},
                ...props,
            }),
        );

    it('enseña el rango mostrado', () => {
        expect(pagination()).toContain('Mostrando 11–20 de 142');
    });

    it('cada página es un enlace y la actual se marca', () => {
        const out = pagination();
        expect(out).toContain('href="/cuenta/pedidos"');
        expect(out).toContain('href="/cuenta/pedidos?pagina=3"');
        expect(out).toContain('aria-current="page"');
    });

    it('conserva los filtros en los enlaces', () => {
        expect(pagination({ filters: { status: 'Enviado' } })).toContain(
            'href="/cuenta/pedidos?pagina=3&amp;estado=Enviado"',
        );
    });

    it('en la primera página Anterior no tiene enlace; en la última, Siguiente tampoco', () => {
        const first = pagination({ page: 1 });
        expect(first).toMatch(/<a[^>]*aria-disabled="true"[^>]*aria-label="Página anterior"/);
        expect(first).not.toContain('rel="prev"');
        const last = pagination({ page: 15 });
        expect(last).toMatch(/<a[^>]*aria-disabled="true"[^>]*aria-label="Página siguiente"/);
        expect(last).not.toContain('rel="next"');
    });

    it('con una sola página solo se ve el rango', () => {
        const out = pagination({ page: 1, totalPages: 1, summary: 'Mostrando 1–3 de 3' });
        expect(out).toContain('Mostrando 1–3 de 3');
        expect(out).not.toContain('Paginación');
    });
});

describe('OrderHistoryEmpty', () => {
    it('sin filtros invita a comprar', () => {
        const out = html(createElement(OrderHistoryEmpty, { filtered: false }));
        expect(out).toContain('Todavía no tienes pedidos');
        expect(out).toContain('href="/productos"');
    });

    it('con filtros ofrece borrarlos', () => {
        const out = html(createElement(OrderHistoryEmpty, { filtered: true }));
        expect(out).toContain('No hay pedidos con estos filtros');
        expect(out).toContain('href="/cuenta/pedidos"');
        expect(out).toContain('Borrar todo');
    });
});
