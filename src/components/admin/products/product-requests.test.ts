import { describe, expect, it, vi } from 'vitest';
import type { ProductFormValues } from '@/lib/validations/admin-products';
import {
    saveProductRequest,
    setProductBlockedRequest,
    uploadProductImage,
} from './product-requests';

const values = { name: 'x' } as ProductFormValues;
const json = (body: unknown, status = 200) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('saveProductRequest', () => {
    it('crea con POST y devuelve el id', async () => {
        const request = json({ id: 4, slug: 'x' }, 201);
        expect(await saveProductRequest(undefined, values, request)).toEqual({
            kind: 'saved',
            id: 4,
            changed: false,
        });
        expect(request).toHaveBeenCalledWith(
            '/api/admin/productos',
            expect.objectContaining({ method: 'POST' }),
        );
    });
    it('edita con PATCH', async () => {
        const request = json({ changed: true });
        expect(await saveProductRequest(3, values, request)).toEqual({
            kind: 'saved',
            changed: true,
        });
        expect(request).toHaveBeenCalledWith(
            '/api/admin/productos/3',
            expect.objectContaining({ method: 'PATCH' }),
        );
    });
    it('distingue el 409 de existencias del resto de rechazos', async () => {
        expect(
            await saveProductRequest(
                3,
                values,
                json({ message: 'Las existencias han cambiado' }, 409),
            ),
        ).toEqual({ kind: 'stock_conflict', message: 'Las existencias han cambiado' });
        expect(
            await saveProductRequest(
                undefined,
                values,
                json({ message: 'Ya existe un producto con ese nombre y añada' }, 409),
            ),
        ).toEqual({ kind: 'rejected', message: 'Ya existe un producto con ese nombre y añada' });
        expect(await saveProductRequest(3, values, json({ message: 'No existe' }, 404))).toEqual({
            kind: 'rejected',
            message: 'No existe',
        });
    });
    it('error ante un 500, un 403 o sin red', async () => {
        expect(await saveProductRequest(3, values, json({}, 500))).toEqual({ kind: 'error' });
        expect(await saveProductRequest(3, values, json({ message: 'no' }, 403))).toEqual({
            kind: 'error',
        });
        expect(
            await saveProductRequest(3, values, vi.fn().mockRejectedValue(new Error('red'))),
        ).toEqual({ kind: 'error' });
    });
});

describe('setProductBlockedRequest', () => {
    it('saved si se guardó', async () => {
        expect(await setProductBlockedRequest(3, true, json({ changed: true }))).toEqual({
            kind: 'saved',
        });
    });
    it('rejected con el motivo en un 409 o un 404', async () => {
        expect(
            await setProductBlockedRequest(3, false, json({ message: 'Bodega bloqueada' }, 409)),
        ).toEqual({ kind: 'rejected', message: 'Bodega bloqueada' });
        expect(
            await setProductBlockedRequest(3, true, json({ message: 'No existe' }, 404)),
        ).toEqual({ kind: 'rejected', message: 'No existe' });
    });
    it('error en cualquier otro fallo', async () => {
        expect(await setProductBlockedRequest(3, true, json({}, 500))).toEqual({ kind: 'error' });
        expect(await setProductBlockedRequest(3, true, vi.fn().mockRejectedValue(1))).toEqual({
            kind: 'error',
        });
    });
});

describe('uploadProductImage', () => {
    const file = (type = 'image/png', size = 100) => {
        const f = new File(['x'], 'a.png', { type });
        Object.defineProperty(f, 'size', { value: size });
        return f;
    };
    const signature = {
        cloudName: 'demo',
        apiKey: 'k',
        timestamp: 1,
        folder: 'pago-jotron/productos',
        allowedFormats: 'png',
        signature: 's',
    };
    it('rechaza lo que no es imagen o pasa de 5 MB sin llamar a nadie', async () => {
        const request = vi.fn();
        expect(await uploadProductImage(file('text/plain'), request)).toMatchObject({
            kind: 'rejected',
        });
        expect(await uploadProductImage(file('image/png', 6 * 1024 * 1024), request)).toMatchObject(
            { kind: 'rejected' },
        );
        expect(request).not.toHaveBeenCalled();
    });
    it('pide la firma y sube a Cloudinary', async () => {
        const request = vi
            .fn()
            .mockResolvedValueOnce(new Response(JSON.stringify(signature)))
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ public_id: 'pago-jotron/productos/abc' })),
            );
        expect(await uploadProductImage(file(), request)).toEqual({
            kind: 'uploaded',
            publicId: 'pago-jotron/productos/abc',
        });
        expect(request.mock.calls[0][0]).toBe('/api/admin/productos/firma-imagen');
        expect(request.mock.calls[1][0]).toBe('https://api.cloudinary.com/v1_1/demo/image/upload');
        const sent = request.mock.calls[1][1].body as FormData;
        expect(sent.get('signature')).toBe('s');
        expect(sent.get('folder')).toBe('pago-jotron/productos');
    });
    it('error si no hay firma (403, 503) o Cloudinary falla', async () => {
        expect(await uploadProductImage(file(), json({}, 403))).toEqual({ kind: 'error' });
        const request = vi
            .fn()
            .mockResolvedValueOnce(new Response(JSON.stringify(signature)))
            .mockResolvedValueOnce(new Response('{}', { status: 500 }));
        expect(await uploadProductImage(file(), request)).toEqual({ kind: 'error' });
    });
});
