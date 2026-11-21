import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUserId = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUserId: () => getSessionUserId() }));

const getUserOrder = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getUserOrder: (userId: number, orderId: number) => getUserOrder(userId, orderId),
}));

import { GET } from './route';

const get = (id: string) =>
    GET(new Request(`http://localhost/api/pedidos/${id}`), { params: { id } });

// 2026-10-16 es viernes; el envío tarda como máximo 2 días laborables.
const found = {
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
        {
            variantId: 9,
            name: 'Dulce',
            vintage: null,
            image: null,
            originName: 'Málaga',
            format: 'Botella',
            capacity: '50.00',
            capacityUnit: 'cl',
            quantity: 1,
            unitPrice: '5.50',
            taxRate: '10.00',
        },
    ],
};

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUserId.mockReset().mockResolvedValue(12);
    getUserOrder.mockReset().mockResolvedValue(found);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('GET /api/pedidos/[id]', () => {
    it('devuelve el pedido de la cuenta de la sesión', async () => {
        const response = await get('12');
        const { order } = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(getUserOrder).toHaveBeenCalledWith(12, 12);
        expect(order).toMatchObject({
            id: 12,
            number: 'PJ-12',
            status: 'Confirmado',
            paymentMethod: 'Tarjeta',
            createdAt: '2026-10-16 18:30:00',
            shippingType: {
                name: 'Estándar',
                cost: '4.95',
                minDeliveryDays: 1,
                maxDeliveryDays: 2,
            },
        });
        expect(order.shippingAddress).toEqual({
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
        });
    });

    it('incluye cuándo entró en el estado actual y de cuál venía si está bloqueado', async () => {
        const { order } = await (await get('12')).json();
        expect(order.statusUpdatedAt).toBe('2026-10-16 18:30:00');
        expect(order.blockedFrom).toBeNull();

        getUserOrder.mockResolvedValue({
            ...found,
            order: { ...found.order, status: 'Bloqueado', blockedFrom: 'Enviado' },
        });
        expect((await (await get('12')).json()).order.blockedFrom).toBe('Enviado');
    });

    describe('canCancel', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('es true dentro de las 24 h de un pedido Confirmado', async () => {
            vi.useFakeTimers({ now: new Date('2026-10-17T10:00:00Z') });
            expect((await (await get('12')).json()).order.canCancel).toBe(true);
        });

        it('es false pasadas las 24 h', async () => {
            vi.useFakeTimers({ now: new Date('2026-10-17T19:00:00Z') });
            expect((await (await get('12')).json()).order.canCancel).toBe(false);
        });

        it('es false en un pedido Bloqueado, aunque sea reciente', async () => {
            vi.useFakeTimers({ now: new Date('2026-10-17T10:00:00Z') });
            getUserOrder.mockResolvedValue({
                ...found,
                order: { ...found.order, status: 'Bloqueado', blockedFrom: 'Confirmado' },
            });
            expect((await (await get('12')).json()).order.canCancel).toBe(false);
        });
    });

    it('las líneas llevan el precio guardado y no el IVA', async () => {
        const { order } = await (await get('12')).json();
        expect(order.lines[0]).toEqual({
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
        });
    });

    it('recalcula el presupuesto con los precios y el envío guardados', async () => {
        const { order } = await (await get('12')).json();
        expect(order.quote).toEqual({
            subtotalCents: 2850,
            shippingCents: 495,
            totalCents: 3345,
            vat: [
                { rate: '10.00', grossCents: 550, baseCents: 500, taxCents: 50 },
                { rate: '21.00', grossCents: 2795, baseCents: 2310, taxCents: 485 },
            ],
        });
    });

    it('la entrega estimada salta el fin de semana: viernes + 2 laborables = martes', async () => {
        const { order } = await (await get('12')).json();
        expect(order.estimatedDelivery).toBe('2026-10-20');
    });

    it('sin plazo máximo la entrega estimada es null', async () => {
        getUserOrder.mockResolvedValue({
            ...found,
            order: { ...found.order, maxDeliveryDays: null },
        });
        expect((await (await get('12')).json()).order.estimatedDelivery).toBeNull();
    });

    it('un pedido que no existe o es de otra cuenta da 404', async () => {
        getUserOrder.mockResolvedValue(null);
        const response = await get('12');
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ message: 'El pedido no existe' });
    });

    it('sin sesión responde 401 y no consulta la BD', async () => {
        getSessionUserId.mockResolvedValue(null);
        expect((await get('12')).status).toBe(401);
        expect(getUserOrder).not.toHaveBeenCalled();
    });

    it.each(['abc', '1.5', '-3', '0', '', '12abc', '99999999999', '1e3'])(
        'el id %j no válido da 400 sin consultar la BD',
        async (id) => {
            expect((await get(id)).status).toBe(400);
            expect(getUserOrder).not.toHaveBeenCalled();
        },
    );

    it('un error de la BD da 500 sin filtrar el mensaje', async () => {
        getUserOrder.mockRejectedValue(new Error('select secreto'));
        const response = await get('12');
        expect(response.status).toBe(500);
        expect(JSON.stringify(await response.json())).not.toContain('secreto');
    });
});
