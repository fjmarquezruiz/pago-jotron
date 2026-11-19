import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_MAX_LINES } from '@/lib/cart/cart';

const getSessionUserId = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUserId: () => getSessionUserId() }));

const getUserCart = vi.fn();
const saveUserCart = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getUserCart: (userId: number) => getUserCart(userId),
    saveUserCart: (userId: number, items: unknown) => saveUserCart(userId, items),
}));

const normalizeCart = vi.fn();
vi.mock('@/lib/cart/server', () => ({ normalizeCart: (items: unknown) => normalizeCart(items) }));

import { GET, PUT } from './route';

const URL = 'http://localhost/api/carrito';
/** Petición `PUT` con un cuerpo en bruto (para poder mandar JSON roto). */
const put = (body: string) => PUT(new Request(URL, { method: 'PUT', body }));
const putJson = (body: unknown) => put(JSON.stringify(body));

const item = (variantId: number, quantity: number) => ({ variantId, quantity });
const NO_SESSION = { message: 'Inicia sesión para continuar' };
const INTERNAL = { message: 'Error interno del servidor' };

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUserId.mockReset().mockResolvedValue(12);
    getUserCart.mockReset();
    saveUserCart.mockReset().mockResolvedValue(undefined);
    // Por defecto el servidor deja el carrito como llega.
    normalizeCart.mockReset().mockImplementation(async (items: unknown) => items);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('GET /api/carrito', () => {
    it('devuelve el id de la sesión y las líneas guardadas', async () => {
        getUserCart.mockResolvedValue([item(4, 2), item(9, 1)]);

        const response = await GET();

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ userId: 12, items: [item(4, 2), item(9, 1)] });
        expect(getUserCart).toHaveBeenCalledTimes(1);
        expect(getUserCart).toHaveBeenCalledWith(12);
    });

    it('un usuario sin carrito guardado recibe una lista vacía', async () => {
        getUserCart.mockResolvedValue([]);
        const response = await GET();
        expect(await response.json()).toEqual({ userId: 12, items: [] });
    });

    it('devuelve lo guardado tal cual: no lo normaliza ni lo guarda', async () => {
        getUserCart.mockResolvedValue([item(4, 99)]);
        const response = await GET();
        expect(await response.json()).toEqual({ userId: 12, items: [item(4, 99)] });
        expect(normalizeCart).not.toHaveBeenCalled();
        expect(saveUserCart).not.toHaveBeenCalled();
    });

    it('no deja que se guarde la respuesta', async () => {
        getUserCart.mockResolvedValue([]);
        const response = await GET();
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('sin sesión responde 200 con userId null y sin líneas (no un 401), sin tocar la BD', async () => {
        getSessionUserId.mockResolvedValue(null);

        const response = await GET();

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ userId: null, items: [] });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(getUserCart).not.toHaveBeenCalled();
    });

    it.each([
        ['falla la BD', () => getUserCart.mockRejectedValue(new Error('Access denied for root'))],
        ['falla la lectura de la sesión', () => getSessionUserId.mockRejectedValue(new Error('x'))],
    ])('500 si %s, sin enseñar el error', async (_, fail) => {
        fail();

        const response = await GET();

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual(INTERNAL);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(consoleError).toHaveBeenCalled();
    });
});

describe('PUT /api/carrito', () => {
    it('sanea el carrito, lo guarda y devuelve lo guardado', async () => {
        const sent = [item(4, 9), item(7, 1)];
        const saved = [item(4, 6)];
        normalizeCart.mockResolvedValue(saved);

        const response = await putJson({ items: sent });

        expect(response.status).toBe(200);
        // Lo que se devuelve es lo saneado, no lo que mandó el navegador.
        expect(await response.json()).toEqual({ items: saved });
        expect(normalizeCart).toHaveBeenCalledTimes(1);
        expect(normalizeCart).toHaveBeenCalledWith(sent);
        expect(saveUserCart).toHaveBeenCalledTimes(1);
        expect(saveUserCart).toHaveBeenCalledWith(12, saved);
    });

    it('sanea antes de guardar', async () => {
        await putJson({ items: [item(4, 1)] });
        expect(normalizeCart.mock.invocationCallOrder[0]).toBeLessThan(
            saveUserCart.mock.invocationCallOrder[0],
        );
    });

    it('un carrito vacío vacía el guardado', async () => {
        const response = await putJson({ items: [] });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ items: [] });
        expect(saveUserCart).toHaveBeenCalledWith(12, []);
    });

    it(`admite ${CART_MAX_LINES} líneas`, async () => {
        const items = Array.from({ length: CART_MAX_LINES }, (_, i) => item(i + 1, 1));
        const response = await putJson({ items });
        expect(response.status).toBe(200);
        expect(saveUserCart).toHaveBeenCalledWith(12, items);
    });

    it('el usuario sale siempre de la sesión: un userId del cuerpo se ignora', async () => {
        getSessionUserId.mockResolvedValue(12);

        const response = await putJson({ userId: 99, items: [item(4, 1)] });

        expect(response.status).toBe(200);
        expect(saveUserCart).toHaveBeenCalledWith(12, [item(4, 1)]);
        expect(normalizeCart).toHaveBeenCalledWith([item(4, 1)]);
        expect(await response.json()).toEqual({ items: [item(4, 1)] });
    });

    it('no deja que se guarde la respuesta', async () => {
        const response = await putJson({ items: [] });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('401 sin sesión: no lee el cuerpo ni toca la BD', async () => {
        getSessionUserId.mockResolvedValue(null);
        const request = new Request(URL, {
            method: 'PUT',
            body: JSON.stringify({ items: [item(4, 1)] }),
        });
        const json = vi.spyOn(request, 'json');

        const response = await PUT(request);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual(NO_SESSION);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(json).not.toHaveBeenCalled();
        expect(normalizeCart).not.toHaveBeenCalled();
        expect(saveUserCart).not.toHaveBeenCalled();
    });

    it('401 sin sesión aunque el cuerpo no sea válido', async () => {
        getSessionUserId.mockResolvedValue(null);
        const response = await put('{no es json');
        expect(response.status).toBe(401);
    });

    it.each([
        ['JSON roto', '{no es json'],
        ['cuerpo vacío', ''],
    ])('400 con %s', async (_, body) => {
        const response = await put(body);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            message: 'El cuerpo de la petición no es JSON válido',
        });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(normalizeCart).not.toHaveBeenCalled();
        expect(saveUserCart).not.toHaveBeenCalled();
    });

    it.each([
        ['sin items', {}],
        ['items que no es una lista', { items: 4 }],
        ['una línea sin cantidad', { items: [{ variantId: 4 }] }],
        ['una cantidad 0', { items: [item(4, 0)] }],
        ['una cantidad negativa', { items: [item(4, -1)] }],
        ['una cantidad decimal', { items: [item(4, 1.5)] }],
        ['un id como texto', { items: [{ variantId: '4', quantity: 1 }] }],
        ['un id que no existe en el int de MySQL', { items: [item(2_147_483_648, 1)] }],
        [
            'más líneas que caben en un carrito',
            { items: Array.from({ length: CART_MAX_LINES + 1 }, (_, i) => item(i + 1, 1)) },
        ],
        ['presentaciones repetidas', { items: [item(4, 1), item(4, 2)] }],
        ['una lista de ids en vez de líneas', { variantIds: [4] }],
        ['un cuerpo null', null],
        ['un cuerpo que es una lista', [item(4, 1)]],
        ['un número', 4],
    ])('400 con %s, sin tocar la BD', async (_, body) => {
        const response = await putJson(body);

        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ message: 'Datos del carrito inválidos' });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(normalizeCart).not.toHaveBeenCalled();
        expect(saveUserCart).not.toHaveBeenCalled();
    });

    it('detalla en errors qué campo falló', async () => {
        const response = await putJson({ items: [item(4, 1), item(4, 2)] });
        expect((await response.json()).errors).toEqual({ items: ['Hay presentaciones repetidas'] });
    });

    it.each([
        ['falla el saneado', () => normalizeCart.mockRejectedValue(new Error('Access denied'))],
        [
            'falla el guardado (por ejemplo, una clave foránea)',
            () => saveUserCart.mockRejectedValue(new Error('fk_cartproduct_variant')),
        ],
        ['falla la lectura de la sesión', () => getSessionUserId.mockRejectedValue(new Error('x'))],
    ])('500 si %s, sin enseñar el error', async (_, fail) => {
        fail();

        const response = await putJson({ items: [item(4, 1)] });

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual(INTERNAL);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(consoleError).toHaveBeenCalled();
    });

    it('si falla el saneado no se guarda nada', async () => {
        normalizeCart.mockRejectedValue(new Error('boom'));
        await putJson({ items: [item(4, 1)] });
        expect(saveUserCart).not.toHaveBeenCalled();
    });

    it('401 si la sesión es de una cuenta que ya no existe (falla fk_cartproduct_user), sin tratarlo como error del servidor', async () => {
        saveUserCart.mockRejectedValue(
            Object.assign(new Error('Failed query'), {
                cause: {
                    code: 'ER_NO_REFERENCED_ROW_2',
                    sqlMessage:
                        'Cannot add or update a child row: CONSTRAINT `fk_cartproduct_user` FOREIGN KEY (`user_id`)',
                },
            }),
        );

        const response = await putJson({ items: [item(4, 1)] });

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual(NO_SESSION);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('si falla la otra clave foránea (la presentación) sigue siendo un 500', async () => {
        saveUserCart.mockRejectedValue(
            Object.assign(new Error('Failed query'), {
                cause: {
                    code: 'ER_NO_REFERENCED_ROW_2',
                    sqlMessage:
                        'Cannot add or update a child row: CONSTRAINT `fk_cartproduct_variant` FOREIGN KEY (`variant_id`)',
                },
            }),
        );

        const response = await putJson({ items: [item(4, 1)] });

        expect(response.status).toBe(500);
        expect(consoleError).toHaveBeenCalled();
    });
});
