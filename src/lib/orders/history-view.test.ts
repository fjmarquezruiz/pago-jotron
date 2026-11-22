import { describe, expect, it } from 'vitest';
import {
    hasHistoryFilters,
    historyFilterLabels,
    historyRangeText,
    orderHistoryHref,
} from './history-view';

describe('orderHistoryHref', () => {
    it('sin página ni filtros es la ruta a secas', () => {
        expect(orderHistoryHref({})).toBe('/cuenta/pedidos');
        expect(orderHistoryHref({ page: 1 })).toBe('/cuenta/pedidos');
    });

    it('la página 1 no lleva "pagina"', () => {
        expect(orderHistoryHref({ page: 1, status: 'Enviado' })).toBe(
            '/cuenta/pedidos?estado=Enviado',
        );
    });

    it('conserva los filtros al cambiar de página', () => {
        expect(
            orderHistoryHref({
                page: 3,
                status: 'En proceso',
                from: '2026-01-01',
                to: '2026-03-31',
            }),
        ).toBe('/cuenta/pedidos?pagina=3&estado=En+proceso&desde=2026-01-01&hasta=2026-03-31');
    });
});

describe('hasHistoryFilters', () => {
    it('detecta cualquier filtro', () => {
        expect(hasHistoryFilters({})).toBe(false);
        expect(hasHistoryFilters({ status: 'Anulado' })).toBe(true);
        expect(hasHistoryFilters({ from: '2026-01-01' })).toBe(true);
        expect(hasHistoryFilters({ to: '2026-01-01' })).toBe(true);
    });
});

describe('historyFilterLabels', () => {
    it('sin filtros dice Todos y Todas', () => {
        expect(historyFilterLabels({})).toEqual({
            status: 'Estado: Todos',
            date: 'Fecha: Todas',
        });
    });

    it('con estado y rango', () => {
        expect(
            historyFilterLabels({ status: 'Entregado', from: '2026-07-01', to: '2026-07-31' }),
        ).toEqual({ status: 'Estado: Entregado', date: 'Fecha: 1 jul 2026 – 31 jul 2026' });
    });

    it('con una sola fecha', () => {
        expect(historyFilterLabels({ from: '2026-07-01' }).date).toBe('Fecha: desde 1 jul 2026');
        expect(historyFilterLabels({ to: '2026-07-31' }).date).toBe('Fecha: hasta 31 jul 2026');
    });
});

describe('historyRangeText', () => {
    it('primera página', () => {
        expect(historyRangeText({ page: 1, pageSize: 10, shown: 10, total: 142 })).toBe(
            'Mostrando 1–10 de 142',
        );
    });

    it('última página, incompleta', () => {
        expect(historyRangeText({ page: 15, pageSize: 10, shown: 2, total: 142 })).toBe(
            'Mostrando 141–142 de 142',
        );
    });

    it('sin resultados', () => {
        expect(historyRangeText({ page: 1, pageSize: 10, shown: 0, total: 0 })).toBe(
            'Mostrando 0 de 0',
        );
    });
});
