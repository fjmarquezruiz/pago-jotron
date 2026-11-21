import { describe, expect, it } from 'vitest';
import type { UserOrder } from '@/lib/db/queries';
import { buildOrderDetail } from './detail';

const found = (overrides: Record<string, unknown> = {}) =>
    ({
        order: {
            id: 12,
            status: 'Confirmado',
            paymentMethod: 'Tarjeta',
            createdAt: '2026-10-16 18:30:00',
            statusUpdatedAt: '2026-10-16 18:30:00',
            blockedFrom: null,
            shippingCost: '4.95',
            shippingTypeName: 'Estándar',
            minDeliveryDays: 1,
            maxDeliveryDays: 2,
            recipientName: 'Ana García',
            streetType: 'Calle',
            streetName: 'Larios',
            number: '5',
            floor: null,
            postalCode: '29005',
            city: 'Málaga',
            province: 'Málaga',
            country: 'España',
            phone: '600123456',
            ...overrides,
        },
        lines: [
            {
                variantId: 4,
                name: 'Tinto Roble',
                vintage: 2020,
                image: 'tinto-roble',
                originName: 'Sierras de Málaga',
                format: 'Botella',
                capacity: '75.00',
                capacityUnit: 'cl',
                quantity: 2,
                unitPrice: '11.50',
                taxRate: '21.00',
            },
        ],
    }) as unknown as UserOrder;

const NOW = new Date('2026-10-17T10:00:00Z');

describe('buildOrderDetail', () => {
    it('monta el número, el presupuesto guardado y la entrega estimada', () => {
        const detail = buildOrderDetail(found(), NOW);
        expect(detail.number).toBe('PJ-12');
        expect(detail.quote.shippingCents).toBe(495);
        // Viernes 16 + 2 días laborables.
        expect(detail.estimatedDelivery).toBe('2026-10-20');
    });

    it('no pinta el IVA de las líneas y conserva imagen y D.O.', () => {
        const [line] = buildOrderDetail(found(), NOW).lines;
        expect(line).not.toHaveProperty('taxRate');
        expect(line).toMatchObject({ image: 'tinto-roble', originName: 'Sierras de Málaga' });
    });

    it('sin plazo de envío no hay entrega estimada', () => {
        expect(
            buildOrderDetail(found({ maxDeliveryDays: null }), NOW).estimatedDelivery,
        ).toBeNull();
    });

    it('canCancel sigue canCustomerCancel: dentro de 24 h sí, después no', () => {
        expect(buildOrderDetail(found(), NOW).canCancel).toBe(true);
        expect(buildOrderDetail(found(), new Date('2026-10-17T19:00:00Z')).canCancel).toBe(false);
    });

    it('canCancel es true en Pendiente de pago aunque haya pasado tiempo', () => {
        expect(
            buildOrderDetail(
                found({ status: 'Pendiente de pago' }),
                new Date('2027-01-01T00:00:00Z'),
            ).canCancel,
        ).toBe(true);
    });

    it.each(['Bloqueado', 'Preparado', 'Enviado', 'Entregado', 'Anulado'])(
        'canCancel es false en %s',
        (status) => {
            expect(buildOrderDetail(found({ status }), NOW).canCancel).toBe(false);
        },
    );

    it('pasa el estado del que venía un pedido bloqueado', () => {
        const detail = buildOrderDetail(
            found({ status: 'Bloqueado', blockedFrom: 'Enviado' }),
            NOW,
        );
        expect(detail.blockedFrom).toBe('Enviado');
        expect(detail.statusUpdatedAt).toBe('2026-10-16 18:30:00');
    });
});
