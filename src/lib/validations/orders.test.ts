import { describe, expect, it } from 'vitest';
import { ORDER_HISTORY_MAX_PAGE, parseOrderHistoryParams } from './orders';

describe('parseOrderHistoryParams', () => {
    it('sin parámetros: primera página y sin filtros', () => {
        expect(parseOrderHistoryParams({})).toEqual({ page: 1 });
    });

    it('lee página, estado y rango de fechas', () => {
        expect(
            parseOrderHistoryParams({
                pagina: '3',
                estado: 'En proceso',
                desde: '2026-01-01',
                hasta: '2026-03-31',
            }),
        ).toEqual({ page: 3, status: 'En proceso', from: '2026-01-01', to: '2026-03-31' });
    });

    it.each(['0', '-1', '1.5', 'abc', '', ' 2', '1e3', String(ORDER_HISTORY_MAX_PAGE + 1)])(
        'una página inválida (%j) vale 1',
        (pagina) => {
            expect(parseOrderHistoryParams({ pagina })).toEqual({ page: 1 });
        },
    );

    it('acepta la última página permitida', () => {
        expect(parseOrderHistoryParams({ pagina: String(ORDER_HISTORY_MAX_PAGE) }).page).toBe(
            ORDER_HISTORY_MAX_PAGE,
        );
    });

    it('acepta cada estado del pedido', () => {
        for (const estado of [
            'Pendiente de pago',
            'Confirmado',
            'En proceso',
            'Preparado',
            'Enviado',
            'Entregado',
            'Bloqueado',
            'Anulado',
        ])
            expect(parseOrderHistoryParams({ estado }).status).toBe(estado);
    });

    it.each(['Cancelado', 'enviado', '', 'Todos'])('ignora el estado %j', (estado) => {
        expect(parseOrderHistoryParams({ estado })).toEqual({ page: 1 });
    });

    it.each(['2026-02-30', '2026-13-01', '01/02/2026', '2026-1-1', '2026-01-01T10:00', 'ayer'])(
        'ignora la fecha %j',
        (desde) => {
            expect(parseOrderHistoryParams({ desde, hasta: '2026-03-31' })).toEqual({
                page: 1,
                to: '2026-03-31',
            });
        },
    );

    it('acepta un solo extremo del rango y un rango de un día', () => {
        expect(parseOrderHistoryParams({ desde: '2026-01-01' })).toEqual({
            page: 1,
            from: '2026-01-01',
        });
        expect(parseOrderHistoryParams({ desde: '2026-01-01', hasta: '2026-01-01' })).toEqual({
            page: 1,
            from: '2026-01-01',
            to: '2026-01-01',
        });
    });

    it('si el rango está al revés, descarta las dos fechas pero conserva lo demás', () => {
        expect(
            parseOrderHistoryParams({
                pagina: '2',
                estado: 'Enviado',
                desde: '2026-05-01',
                hasta: '2026-01-01',
            }),
        ).toEqual({ page: 2, status: 'Enviado' });
    });

    it('un parámetro repetido no filtra', () => {
        expect(
            parseOrderHistoryParams({ estado: ['Enviado', 'Anulado'], pagina: ['2', '3'] }),
        ).toEqual({
            page: 1,
        });
    });
});
