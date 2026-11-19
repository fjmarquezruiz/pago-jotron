import { describe, expect, it } from 'vitest';
import { loadConfirmationOrder, type OrderFetch } from './order-load';

const order = {
    id: 12,
    number: 'PJ-12',
    status: 'Confirmado',
    paymentMethod: 'Tarjeta',
    createdAt: '2026-10-16 18:30:00',
    shippingAddress: {
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
    },
    shippingType: { name: 'Estándar', cost: '4.95', minDeliveryDays: 1, maxDeliveryDays: 2 },
    estimatedDelivery: '2026-10-20',
    lines: [
        {
            variantId: 4,
            name: 'Tinto Roble',
            vintage: 2020,
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            quantity: 2,
            unitPrice: '11.50',
        },
    ],
    quote: { subtotalCents: 2300, shippingCents: 495, totalCents: 2795, vat: [] },
};
const profile = {
    name: 'Ana',
    lastName: 'García',
    email: 'ana@ejemplo.com',
    phone: null,
    idCard: null,
};

const json = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

const routes =
    (map: Record<string, () => Promise<Response>>): OrderFetch =>
    (url) =>
        (map[url] ?? (() => Promise.reject(new Error('ruta inesperada'))))();

describe('loadConfirmationOrder', () => {
    it('devuelve el pedido y el perfil', async () => {
        const result = await loadConfirmationOrder(12, {
            fetchFn: routes({
                '/api/pedidos/12': () => json({ order }),
                '/api/cuenta/perfil': () => json({ profile }),
            }),
        });
        expect(result).toMatchObject({
            ok: true,
            order: { number: 'PJ-12' },
            profile: { email: 'ana@ejemplo.com' },
        });
    });

    it('si el perfil falla, el pedido se enseña igual', async () => {
        const result = await loadConfirmationOrder(12, {
            fetchFn: routes({
                '/api/pedidos/12': () => json({ order }),
                '/api/cuenta/perfil': () => json({ message: 'x' }, 500),
            }),
        });
        expect(result).toMatchObject({ ok: true, profile: null });
    });

    it('traduce los códigos de error del pedido', async () => {
        const reason = async (status: number) =>
            loadConfirmationOrder(12, {
                fetchFn: routes({
                    '/api/pedidos/12': () => json({ message: 'x' }, status),
                    '/api/cuenta/perfil': () => json({ profile }),
                }),
            });
        expect(await reason(401)).toEqual({ ok: false, reason: 'unauthorized' });
        expect(await reason(404)).toEqual({ ok: false, reason: 'not-found' });
        expect(await reason(400)).toEqual({ ok: false, reason: 'not-found' });
        expect(await reason(500)).toEqual({ ok: false, reason: 'error' });
    });

    it('una respuesta con otra forma o un fallo de red es un error', async () => {
        expect(
            await loadConfirmationOrder(12, {
                fetchFn: routes({
                    '/api/pedidos/12': () => json({ order: { id: 12 } }),
                    '/api/cuenta/perfil': () => json({ profile }),
                }),
            }),
        ).toEqual({ ok: false, reason: 'error' });
        expect(
            await loadConfirmationOrder(12, {
                fetchFn: () => Promise.reject(new Error('sin red')),
            }),
        ).toEqual({ ok: false, reason: 'error' });
    });
});
