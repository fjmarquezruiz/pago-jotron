import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import type { OrderDetail } from '@/lib/orders/detail';
import { quoteOrder } from '@/lib/orders/quote';
import type { AdminOrderActionsProps } from './admin-order-actions';
import { AdminOrderDetail } from './admin-order-detail';
import { AdminOrdersFilters } from './admin-orders-filters';
import { AdminOrdersTable } from './admin-orders-table';

const row = (id: number, status: string, invoiceNumber: string | null = null) => ({
    id,
    createdAt: '2026-10-15 09:00:00',
    total: '135.00',
    status,
    customerName: 'Lucía',
    customerLastName: 'Fernández',
    customerEmail: 'lucia@x.es',
    invoiceNumber,
});

describe('AdminOrdersTable', () => {
    const html = renderToStaticMarkup(
        createElement(AdminOrdersTable, {
            rows: [row(4521, 'Entregado', 'F-2026-0001'), row(4520, 'En proceso')],
        }),
    );
    it('enseña cliente, fecha, total y estado', () => {
        expect(html).toContain('Lucía Fernández');
        expect(html).toContain('#PJ-4521');
        expect(html).toContain('15 oct 2026');
        expect(html).toContain('Entregado');
    });
    it('el ojo lleva al detalle y la factura solo sale en un Entregado con factura', () => {
        expect(html).toContain('href="/admin/pedidos/4520"');
        expect(html).toContain('/api/admin/pedidos/4521/factura');
        expect(html).not.toContain('/api/admin/pedidos/4520/factura');
    });
    it('no hay papelera ni exportación', () => {
        expect(html).not.toMatch(/Eliminar|Exportar|trash/i);
    });
});

describe('AdminOrdersFilters', () => {
    it('chips de estado y fecha, y la búsqueda como chip aparte', () => {
        const html = renderToStaticMarkup(
            createElement(AdminOrdersFilters, { filters: { status: 'En proceso', q: 'lucia' } }),
        );
        expect(html).toContain('Estado: en proceso');
        expect(html).toContain('Fecha: todas');
        expect(html).toContain('>lucia<');
        expect(html).toContain('Limpiar todo');
        expect(html).not.toContain('Exportar CSV');
    });
    it('cerrada, la búsqueda es la lupa', () => {
        const html = renderToStaticMarkup(createElement(AdminOrdersFilters, { filters: {} }));
        expect(html).toContain('aria-label="Buscar pedidos"');
        expect(html).not.toContain('Número o correo');
    });
});

const detail = (overrides: Partial<OrderDetail> = {}): OrderDetail => ({
    id: 4521,
    number: 'PJ-4521',
    status: 'Preparado',
    paymentMethod: 'Tarjeta',
    createdAt: '2026-10-15 07:12:00',
    statusUpdatedAt: '2026-10-15 08:30:00',
    blockedFrom: null,
    invoiceNumber: null,
    cancelledBy: null,
    canCancel: false,
    shippingAddress: {
        recipientName: 'Lucía Fernández',
        streetType: 'Calle',
        streetName: 'Larios',
        number: '5',
        floor: null,
        postalCode: '29005',
        city: 'Málaga',
        province: 'Málaga',
        country: 'España',
        phone: '+34 600 123 456',
    },
    shippingType: { name: 'Estándar', cost: '0.00', minDeliveryDays: 2, maxDeliveryDays: 4 },
    estimatedDelivery: null,
    lines: [
        {
            variantId: 1,
            name: 'Gran Jotrón Selección',
            vintage: 2019,
            image: null,
            originName: 'Málaga',
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            quantity: 2,
            unitPrice: '45.00',
        },
    ],
    quote: quoteOrder([{ quantity: 2, price: '45.00', taxRate: '21.00' }], '0.00'),
    ...overrides,
});

const actions: AdminOrderActionsProps = {
    orderId: 4521,
    orderNumber: 'PJ-4521',
    status: 'Preparado',
    primary: { label: 'Pasar a Enviado', to: 'Enviado' },
    canCancel: false,
    cancelNotice: null,
    reasons: [],
    invoiceHref: null,
};
const customer = { label: 'Lucía Fernández', email: 'lucia@x.es', phone: '+34 600 123 456' };
const render = (d: OrderDetail, a = actions) =>
    renderToStaticMarkup(createElement(AdminOrderDetail, { detail: d, customer, actions: a }));

describe('AdminOrderDetail', () => {
    const html = render(detail());
    it('migas, título y frase de estado', () => {
        expect(html).toContain('Pedidos');
        expect(html).toContain('Pedido #PJ-4521');
        expect(html).toContain('Realizado el 15 de octubre de 2026');
        expect(html).toContain('2 artículos');
    });
    it('las líneas llevan la presentación en lugar del SKU', () => {
        expect(html).toContain('Botella 75 cl');
        expect(html).not.toContain('SKU');
    });
    it('cliente, dirección con el código postal delante y pago', () => {
        expect(html).toContain('lucia@x.es');
        expect(html).toContain('29005 Málaga');
        expect(html).toContain('Tarjeta');
    });
    it('sin Eliminar, seguimiento ni dígitos de tarjeta', () => {
        expect(html).not.toMatch(/Eliminar|Guardar|seguimiento|4242/i);
    });
    it('el botón principal sale en la cabecera y en el pie', () => {
        expect(html.match(/Pasar a Enviado/g)).toHaveLength(2);
    });
    it('Anular solo si se puede', () => {
        expect(html).not.toContain('Anular pedido');
        expect(render(detail(), { ...actions, canCancel: true })).toContain('Anular pedido');
    });
    it('Entregado enseña la factura y ningún botón de avance', () => {
        const delivered = render(detail({ status: 'Entregado' }), {
            ...actions,
            status: 'Entregado',
            primary: null,
            invoiceHref: '/api/admin/pedidos/4521/factura',
        });
        expect(delivered).toContain('/api/admin/pedidos/4521/factura');
        expect(delivered).not.toContain('Pasar a');
    });
    it('Bloqueado es un paso del seguimiento, no un aviso', () => {
        const blocked = render(detail({ status: 'Bloqueado', blockedFrom: 'En proceso' }));
        expect(blocked).toContain('Bloqueado: lleva más de 15 días');
        expect(blocked).not.toContain('Tu pedido está en revisión');
    });
});
