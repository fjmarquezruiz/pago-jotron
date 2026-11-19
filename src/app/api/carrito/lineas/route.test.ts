import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_MAX_LINES } from '@/lib/cart/cart';

const getCartLines = vi.fn();
vi.mock('@/lib/db/queries', () => ({ getCartLines: (ids: number[]) => getCartLines(ids) }));

import { POST } from './route';

/** Petición `POST` con un cuerpo en bruto (para poder mandar JSON roto). */
const post = (body: string) =>
    POST(new Request('http://localhost/api/carrito/lineas', { method: 'POST', body }));
const postJson = (body: unknown) => post(JSON.stringify(body));

const line = {
    variantId: 4,
    productId: 2,
    slug: 'tinto-roble-2023',
    name: 'Tinto Roble',
    image: 'pago-jotron/tinto-roble',
    vintage: 2023,
    originName: 'Sierras de Málaga',
    format: 'Botella',
    capacity: 750,
    capacityUnit: 'ml',
    price: '9.50',
    stock: 12,
};

describe('POST /api/carrito/lineas', () => {
    beforeEach(() => {
        getCartLines.mockReset();
    });

    it('devuelve las líneas de los ids pedidos', async () => {
        getCartLines.mockResolvedValue([line]);

        const response = await postJson({ variantIds: [4] });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ lines: [line] });
        expect(getCartLines).toHaveBeenCalledWith([4]);
    });

    it('no deja que se guarde la respuesta: el precio y el stock cambian', async () => {
        getCartLines.mockResolvedValue([]);
        const response = await postJson({ variantIds: [4] });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('junta los ids repetidos antes de consultar', async () => {
        getCartLines.mockResolvedValue([]);
        await postJson({ variantIds: [4, 7, 4] });
        expect(getCartLines).toHaveBeenCalledWith([4, 7]);
    });

    it('un carrito vacío da una lista vacía', async () => {
        getCartLines.mockResolvedValue([]);
        const response = await postJson({ variantIds: [] });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ lines: [] });
    });

    it.each([
        ['JSON roto', '{no es json'],
        ['cuerpo vacío', ''],
    ])('400 con %s', async (_, body) => {
        const response = await post(body);
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            message: 'El cuerpo de la petición no es JSON válido',
        });
        expect(getCartLines).not.toHaveBeenCalled();
    });

    it.each([
        ['sin variantIds', {}],
        ['variantIds que no es una lista', { variantIds: 4 }],
        ['un id como texto', { variantIds: ['4'] }],
        ['un id que no existe en el int de MySQL', { variantIds: [2_147_483_648] }],
        ['un id decimal', { variantIds: [1.5] }],
        ['un id negativo', { variantIds: [-1] }],
        [
            'más ids que líneas caben en un carrito',
            {
                variantIds: Array.from({ length: CART_MAX_LINES + 1 }, (_, i) => i + 1),
            },
        ],
        ['un cuerpo null', null],
        ['un cuerpo que es una lista', [4, 7]],
        ['un número', 4],
    ])('400 con %s, sin tocar la BD', async (_, body) => {
        const response = await postJson(body);

        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ message: 'Datos del carrito inválidos' });
        expect(getCartLines).not.toHaveBeenCalled();
    });

    it('detalla en errors qué campo falló', async () => {
        const response = await postJson({ variantIds: ['x'] });
        expect((await response.json()).errors).toHaveProperty('variantIds');
    });

    it('500 si falla la BD, sin enseñar el error', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        getCartLines.mockRejectedValue(new Error('Access denied for user root@localhost'));

        const response = await postJson({ variantIds: [4] });

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ message: 'Error interno del servidor' });
        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
