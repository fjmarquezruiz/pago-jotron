import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_MAX_LINES } from '@/lib/cart/cart';

const getSessionUserId = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUserId: () => getSessionUserId() }));

const saveUserCart = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    saveUserCart: (userId: number, items: unknown) => saveUserCart(userId, items),
}));

const mergeWithSaved = vi.fn();
vi.mock('@/lib/cart/server', () => ({
    mergeWithSaved: (userId: number, items: unknown) => mergeWithSaved(userId, items),
}));

import { POST } from './route';

const URL = 'http://localhost/api/carrito/fusionar';
/** Petición `POST` con un cuerpo en bruto (para poder mandar JSON roto). */
const post = (body: string) => POST(new Request(URL, { method: 'POST', body }));
const postJson = (body: unknown) => post(JSON.stringify(body));

const item = (variantId: number, quantity: number) => ({ variantId, quantity });
const NO_SESSION = { message: 'Inicia sesión para continuar' };
const INTERNAL = { message: 'Error interno del servidor' };

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUserId.mockReset().mockResolvedValue(12);
    saveUserCart.mockReset().mockResolvedValue(undefined);
    // Por defecto, lo que une el servidor es el carrito del navegador.
    mergeWithSaved.mockReset().mockImplementation(async (_: number, items: unknown) => items);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('POST /api/carrito/fusionar', () => {
    it('une el carrito del navegador con el guardado, lo guarda y lo devuelve', async () => {
        const local = [item(4, 2), item(9, 1)];
        const merged = [item(7, 1), item(4, 3), item(9, 1)];
        mergeWithSaved.mockResolvedValue(merged);

        const response = await postJson({ items: local });

        expect(response.status).toBe(200);
        // Lo que se devuelve es lo unido, no lo que mandó el navegador.
        expect(await response.json()).toEqual({ items: merged });
        expect(mergeWithSaved).toHaveBeenCalledTimes(1);
        expect(mergeWithSaved).toHaveBeenCalledWith(12, local);
        expect(saveUserCart).toHaveBeenCalledTimes(1);
        expect(saveUserCart).toHaveBeenCalledWith(12, merged);
    });

    it('une antes de guardar', async () => {
        await postJson({ items: [item(4, 1)] });
        expect(mergeWithSaved.mock.invocationCallOrder[0]).toBeLessThan(
            saveUserCart.mock.invocationCallOrder[0],
        );
    });

    it('un carrito del navegador vacío devuelve (y guarda) el que ya había', async () => {
        mergeWithSaved.mockResolvedValue([item(4, 2)]);

        const response = await postJson({ items: [] });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ items: [item(4, 2)] });
        expect(mergeWithSaved).toHaveBeenCalledWith(12, []);
        expect(saveUserCart).toHaveBeenCalledWith(12, [item(4, 2)]);
    });

    it(`admite ${CART_MAX_LINES} líneas`, async () => {
        const items = Array.from({ length: CART_MAX_LINES }, (_, i) => item(i + 1, 1));
        const response = await postJson({ items });
        expect(response.status).toBe(200);
        expect(mergeWithSaved).toHaveBeenCalledWith(12, items);
    });

    it('el usuario sale siempre de la sesión: un userId del cuerpo se ignora', async () => {
        getSessionUserId.mockResolvedValue(12);

        const response = await postJson({ userId: 99, items: [item(4, 1)] });

        expect(response.status).toBe(200);
        expect(mergeWithSaved).toHaveBeenCalledWith(12, [item(4, 1)]);
        expect(saveUserCart).toHaveBeenCalledWith(12, [item(4, 1)]);
    });

    it('no deja que se guarde la respuesta', async () => {
        const response = await postJson({ items: [] });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('401 sin sesión: no lee el cuerpo ni toca la BD', async () => {
        getSessionUserId.mockResolvedValue(null);
        const request = new Request(URL, {
            method: 'POST',
            body: JSON.stringify({ items: [item(4, 1)] }),
        });
        const json = vi.spyOn(request, 'json');

        const response = await POST(request);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual(NO_SESSION);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(json).not.toHaveBeenCalled();
        expect(mergeWithSaved).not.toHaveBeenCalled();
        expect(saveUserCart).not.toHaveBeenCalled();
    });

    it('401 sin sesión aunque el cuerpo no sea válido', async () => {
        getSessionUserId.mockResolvedValue(null);
        const response = await post('{no es json');
        expect(response.status).toBe(401);
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
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(mergeWithSaved).not.toHaveBeenCalled();
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
        const response = await postJson(body);

        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ message: 'Datos del carrito inválidos' });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(mergeWithSaved).not.toHaveBeenCalled();
        expect(saveUserCart).not.toHaveBeenCalled();
    });

    it('detalla en errors qué campo falló', async () => {
        const response = await postJson({ items: [item(4, 1), item(4, 2)] });
        expect((await response.json()).errors).toEqual({ items: ['Hay presentaciones repetidas'] });
    });

    it.each([
        ['falla la unión', () => mergeWithSaved.mockRejectedValue(new Error('Access denied'))],
        [
            'falla el guardado (por ejemplo, una clave foránea)',
            () => saveUserCart.mockRejectedValue(new Error('fk_cartproduct_variant')),
        ],
        ['falla la lectura de la sesión', () => getSessionUserId.mockRejectedValue(new Error('x'))],
    ])('500 si %s, sin enseñar el error', async (_, fail) => {
        fail();

        const response = await postJson({ items: [item(4, 1)] });

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual(INTERNAL);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(consoleError).toHaveBeenCalled();
    });

    it('si falla la unión no se guarda nada', async () => {
        mergeWithSaved.mockRejectedValue(new Error('boom'));
        await postJson({ items: [item(4, 1)] });
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

        const response = await postJson({ items: [item(4, 1)] });

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

        const response = await postJson({ items: [item(4, 1)] });

        expect(response.status).toBe(500);
        expect(consoleError).toHaveBeenCalled();
    });
});
