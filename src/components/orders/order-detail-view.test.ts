import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/components/ui/cloudinary-image', () => ({
    CloudinaryImage: ({ src }: { src: string }) => createElement('img', { src, alt: '' }),
}));

import type { OrderDetail } from '@/lib/orders/detail';
import { ORDER_STATUS as S, type OrderStatus } from '@/lib/orders/status';
import { OrderDetailView } from './order-detail-view';

const detail = (overrides: Partial<OrderDetail> = {}): OrderDetail => ({
    id: 4521,
    number: 'PJ-4521',
    status: S.CONFIRMED,
    paymentMethod: 'Tarjeta',
    createdAt: '2026-10-15 07:12:00',
    statusUpdatedAt: '2026-10-15 07:12:00',
    blockedFrom: null,
    invoiceNumber: null,
    cancelledBy: null,
    canCancel: true,
    shippingAddress: {
        recipientName: 'Juan Moreno',
        streetType: 'Calle',
        streetName: 'de Alcalá',
        number: '12',
        floor: null,
        postalCode: '28014',
        city: 'Madrid',
        province: 'Madrid',
        country: 'España',
        phone: '600000000',
    },
    shippingType: { name: 'Estándar', cost: '0.00', minDeliveryDays: 1, maxDeliveryDays: 3 },
    estimatedDelivery: null,
    lines: [
        {
            variantId: 1,
            name: 'Payoya Negra',
            vintage: 2021,
            image: 'pago-jotron/productos/payoya',
            originName: 'Sierras de Málaga',
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            quantity: 2,
            unitPrice: '45.00',
        },
        {
            variantId: 2,
            name: 'Pasas Moscatel',
            vintage: null,
            image: null,
            originName: 'Málaga',
            format: 'Caja',
            capacity: 500,
            capacityUnit: 'g',
            quantity: 1,
            unitPrice: '60.50',
        },
    ],
    quote: {
        subtotalCents: 15050,
        shippingCents: 0,
        totalCents: 15050,
        vat: [],
    } as unknown as OrderDetail['quote'],
    ...overrides,
});

const html = (d: OrderDetail) =>
    renderToStaticMarkup(createElement(OrderDetailView, { detail: d }));
const of = (status: OrderStatus, extra: Partial<OrderDetail> = {}) =>
    html(detail({ status, ...extra }));

describe('OrderDetailView', () => {
    it('Confirmado en plazo: título, estado, Cancelar, frase del plazo y sin Factura', () => {
        const out = of(S.CONFIRMED);
        expect(out).toContain('Pedido #PJ-4521');
        expect(out).toContain('Cancelar pedido');
        expect(out).toContain('Puedes cancelar el pedido durante las 24 h siguientes a la compra.');
        expect(out).not.toContain('Factura (PDF)');
    });

    it('Confirmado fuera de plazo: ni Cancelar ni la frase', () => {
        const out = of(S.CONFIRMED, { canCancel: false });
        expect(out).not.toContain('Cancelar pedido');
        expect(out).not.toContain('Puedes cancelar');
    });

    it('Entregado con factura: enlace de descarga al PDF y sin Cancelar', () => {
        const out = of(S.DELIVERED, { canCancel: false, invoiceNumber: 'F-2026-0001' });
        expect(out).toContain('Factura (PDF)');
        expect(out).toContain('href="/api/pedidos/4521/factura"');
        // Sin `download`: la descarga la fuerza la cabecera de la ruta y un error se ve en pantalla.
        expect(out).not.toMatch(/<a[^>]*\sdownload[=\s>]/);
        expect(out).not.toMatch(/<button[^>]*disabled[^>]*>.*Factura \(PDF\)/);
        expect(out).not.toContain('Cancelar pedido');
    });

    it('Entregado sin factura emitida: Factura deshabilitada, sin enlace', () => {
        const out = of(S.DELIVERED, { canCancel: false, invoiceNumber: null });
        expect(out).toMatch(/<button[^>]*disabled[^>]*>.*Factura \(PDF\)/);
        expect(out).not.toContain('/factura');
    });

    it('Bloqueado: aviso de revisión y nunca Cancelar ni Factura', () => {
        const out = of(S.BLOCKED, { canCancel: false, blockedFrom: S.PROCESSING });
        expect(out).toContain('Tu pedido está en revisión.');
        expect(out).not.toContain('Cancelar pedido');
        expect(out).not.toContain('Factura (PDF)');
    });

    it('Pendiente de pago: aviso de transferencia, Cancelar sin frase del plazo', () => {
        const out = of(S.PENDING, { paymentMethod: 'Transferencia' });
        expect(out).toContain('Estamos esperando tu transferencia.');
        expect(out).toContain('Cancelar pedido');
        expect(out).not.toContain('Puedes cancelar');
        expect(out).toContain('Transferencia bancaria');
    });

    it('Anulado por el cliente: el seguimiento lleva la cancelación con su fecha y hora', () => {
        const out = of(S.CANCELLED, {
            canCancel: false,
            cancelledBy: 'Cliente',
            createdAt: '2026-10-15 07:12:00',
            statusUpdatedAt: '2026-10-15 15:40:00',
        });
        expect(out).toContain('Cancelado por ti');
        expect(out).toContain('15 oct, 17:40');
        expect(out).toContain('15 oct, 09:12');
        expect(out).not.toContain('Cancelar pedido');
        expect(out).not.toContain('Este pedido está anulado.');
    });

    it('Anulado por administración o por el sistema: lo dice el último paso', () => {
        expect(of(S.CANCELLED, { canCancel: false, cancelledBy: 'Administrador' })).toContain(
            'Anulado por la tienda',
        );
        const system = of(S.CANCELLED, { canCancel: false, cancelledBy: null });
        expect(system).not.toContain('Cancelado por ti');
        expect(system).not.toContain('por la tienda');
    });

    it('no enseña datos que no guardamos', () => {
        const out = of(S.CONFIRMED);
        for (const text of ['4532', 'Visa', 'seguimiento', 'Termina en', 'Ubicación'])
            expect(out).not.toContain(text);
    });

    it('lleva las líneas, el resumen y la dirección', () => {
        const out = of(S.CONFIRMED);
        expect(out).toContain('Artículos del pedido (2)');
        expect(out).toContain('Payoya Negra');
        expect(out).toContain('Sierras de Málaga');
        expect(out).toContain('90,00');
        expect(out).toContain('150,50');
        expect(out).toContain('Gratis');
        expect(out).toContain('Calle de Alcalá, 12');
        expect(out).toContain('Madrid, 28014');
        expect(out).toContain('Estándar (Gratis)');
        expect(out).toContain('15 de octubre de 2026');
        expect(out).toContain('a las 9:12');
    });

    it('una línea sin añada no pinta el chip y una sin foto no pinta imagen', () => {
        const out = of(S.CONFIRMED);
        expect(out).toContain('2021');
        // Cada línea sale en la lista móvil y en la tabla de escritorio: una foto en cada una.
        expect((out.match(/<img/g) ?? []).length).toBe(2);
    });
});
