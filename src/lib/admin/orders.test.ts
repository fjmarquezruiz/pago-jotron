import { describe, expect, it } from 'vitest';
import {
    adminCancellationLabel,
    adminFilterLabels,
    adminOrderDescription,
    adminOrdersHref,
    adminRangeText,
    adminStepperProgress,
    canAdminCancel,
    cancelNotice,
    hasAdminOrderFilters,
    parseOrderSearch,
    primaryAction,
} from './orders';
import { stepperProgress } from '@/lib/orders/status-ui';

describe('adminOrdersHref', () => {
    it('sin nada es la ruta a secas y la página 1 va sin pagina', () => {
        expect(adminOrdersHref({})).toBe('/admin/pedidos');
        expect(adminOrdersHref({ page: 1 })).toBe('/admin/pedidos');
    });
    it('conserva los filtros y la búsqueda', () => {
        expect(adminOrdersHref({ page: 2, status: 'Enviado', q: 'PJ-4' })).toBe(
            '/admin/pedidos?pagina=2&estado=Enviado&q=PJ-4',
        );
    });
});

describe('hasAdminOrderFilters', () => {
    it('detecta cada filtro', () => {
        expect(hasAdminOrderFilters({})).toBe(false);
        expect(hasAdminOrderFilters({ q: 'x' })).toBe(true);
        expect(hasAdminOrderFilters({ from: '2026-01-01' })).toBe(true);
    });
});

describe('adminFilterLabels', () => {
    it('sin filtros', () => {
        expect(adminFilterLabels({})).toEqual({ status: 'Estado: todos', date: 'Fecha: todas' });
    });
    it('estado en minúsculas, rango y búsqueda', () => {
        expect(
            adminFilterLabels({
                status: 'En proceso',
                from: '2026-07-01',
                to: '2026-07-31',
                q: 'lucia',
            }),
        ).toEqual({
            status: 'Estado: en proceso',
            date: 'Fecha: 1 jul 2026 – 31 jul 2026',
            search: 'lucia',
        });
    });
});

describe('adminRangeText', () => {
    const base = { page: 2, pageSize: 10, shown: 10, total: 142, overall: 142, filtered: false };
    it('rango sin filtros', () => {
        expect(adminRangeText(base)).toBe('Mostrando 11-20 de 142');
    });
    it('con filtros cuenta los filtrados sobre el total', () => {
        expect(adminRangeText({ ...base, total: 3, shown: 3, filtered: true })).toBe(
            'Mostrando 3 pedidos filtrados de 142',
        );
        expect(adminRangeText({ ...base, total: 1, shown: 1, filtered: true })).toBe(
            'Mostrando 1 pedido filtrado de 142',
        );
    });
    it('sin resultados', () => {
        expect(adminRangeText({ ...base, shown: 0 })).toBe('Mostrando 0 de 0');
    });
});

describe('parseOrderSearch', () => {
    it.each([
        ['4521', 4521],
        ['PJ-4521', 4521],
        ['#pj-4521', 4521],
        [' pj4521 ', 4521],
    ])('%s es un número de pedido', (text, id) => {
        expect(parseOrderSearch(text)).toEqual({ kind: 'id', id });
    });
    it('lo demás busca en el correo', () => {
        expect(parseOrderSearch('lucia@x.es')).toEqual({ kind: 'email', text: 'lucia@x.es' });
        expect(parseOrderSearch('PJ-12abc')).toEqual({ kind: 'email', text: 'PJ-12abc' });
    });
    it('un id imposible o vacío', () => {
        expect(parseOrderSearch('0')).toEqual({ kind: 'email', text: '0' });
        expect(parseOrderSearch('   ')).toBeNull();
        expect(parseOrderSearch(undefined)).toBeNull();
    });
});

describe('primaryAction', () => {
    it.each([
        ['Pendiente de pago', null, 'Confirmar pago', 'Confirmado'],
        ['Confirmado', null, 'Pasar a En proceso', 'En proceso'],
        ['En proceso', null, 'Pasar a Preparado', 'Preparado'],
        ['Preparado', null, 'Pasar a Enviado', 'Enviado'],
        ['Enviado', null, 'Pasar a Entregado', 'Entregado'],
        ['Bloqueado', 'En proceso', 'Reanudar pedido', 'Preparado'],
    ] as const)('%s (desde %s) → %s', (status, blockedFrom, label, to) => {
        expect(primaryAction(status, blockedFrom)).toEqual({ label, to });
    });
    it('los finales y un Bloqueado sin origen no avanzan', () => {
        expect(primaryAction('Entregado', null)).toBeNull();
        expect(primaryAction('Anulado', null)).toBeNull();
        expect(primaryAction('Bloqueado', null)).toBeNull();
    });
});

describe('canAdminCancel', () => {
    it.each([
        ['Pendiente de pago', true],
        ['Confirmado', true],
        ['En proceso', true],
        ['Preparado', false],
        ['Enviado', false],
        ['Entregado', false],
        ['Anulado', false],
        ['Bloqueado', true],
    ] as const)('%s → %s', (status, expected) => {
        expect(canAdminCancel(status, null)).toBe(expected);
    });
});

describe('adminStepperProgress', () => {
    it('Bloqueado es un paso en error tras el último alcanzado', () => {
        const base = stepperProgress({
            status: 'Bloqueado',
            blockedFrom: 'En proceso',
            paymentMethod: 'Tarjeta',
        });
        expect(adminStepperProgress(base, 'Bloqueado')).toEqual({
            steps: ['Confirmado', 'En proceso', 'Bloqueado', 'Preparado', 'Enviado', 'Entregado'],
            current: 2,
            errorStep: 2,
        });
    });
    it('el resto de estados quedan como están', () => {
        const base = stepperProgress({ status: 'Enviado', paymentMethod: 'Tarjeta' });
        expect(adminStepperProgress(base, 'Enviado')).toBe(base);
    });
});

describe('adminCancellationLabel', () => {
    it('nombra quién anuló', () => {
        expect(adminCancellationLabel('Cliente')).toBe('Cancelado por el cliente');
        expect(adminCancellationLabel('Administrador')).toBe('Anulado por la tienda');
        expect(adminCancellationLabel(null)).toBe('Anulado');
    });
});

describe('cancelNotice', () => {
    it('promete solo lo que la API hace', () => {
        expect(
            cancelNotice({ status: 'En proceso', blockedFrom: null, paymentMethod: 'Tarjeta' }),
        ).toBe(
            'El stock vuelve al catálogo y devolveremos el importe al cliente con el mismo método de pago.',
        );
        expect(
            cancelNotice({
                status: 'Pendiente de pago',
                blockedFrom: null,
                paymentMethod: 'Transferencia',
            }),
        ).toBe('El stock vuelve al catálogo.');
        expect(
            cancelNotice({
                status: 'Bloqueado',
                blockedFrom: 'Preparado',
                paymentMethod: 'Tarjeta',
            }),
        ).toBe('Devolveremos el importe al cliente con el mismo método de pago.');
        expect(
            cancelNotice({
                status: 'Bloqueado',
                blockedFrom: 'Preparado',
                paymentMethod: 'PayPal',
            }),
        ).toBeNull();
    });
});

describe('adminOrderDescription', () => {
    const moment = { date: '15 de octubre de 2026', time: '9:12' };
    it('estado normal', () => {
        expect(
            adminOrderDescription({
                status: 'Preparado',
                paymentMethod: 'Tarjeta',
                moment,
                units: 4,
                total: '129,30 €',
            }),
        ).toBe('Realizado el 15 de octubre de 2026 a las 9:12 - 4 artículos - Total 129,30 €');
    });
    it('singular, transferencia pendiente y bloqueado', () => {
        const base = { moment, units: 1, total: '10,00 €' };
        expect(
            adminOrderDescription({ ...base, status: 'Enviado', paymentMethod: 'Tarjeta' }),
        ).toContain('1 artículo -');
        expect(
            adminOrderDescription({
                ...base,
                status: 'Pendiente de pago',
                paymentMethod: 'Transferencia',
            }),
        ).toBe('Pendiente de pago por transferencia. Confirma el cobro cuando llegue el ingreso.');
        expect(
            adminOrderDescription({ ...base, status: 'Bloqueado', paymentMethod: 'Tarjeta' }),
        ).toBe('Bloqueado: lleva más de 15 días sin avanzar. Revísalo y reanúdalo o anúlalo.');
    });
});
