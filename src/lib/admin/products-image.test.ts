import { describe, expect, it } from 'vitest';
import { productImageSignature, signCloudinaryParams } from './products-image';

describe('signCloudinaryParams', () => {
    it('da la misma firma que `api_sign_request` del SDK oficial de Cloudinary', () => {
        expect(
            signCloudinaryParams(
                {
                    timestamp: 1315060510,
                    public_id: 'sample',
                    eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
                },
                'abcd',
            ),
        ).toBe('7e775a49f317e77d8f0af0fb11891b6e6edf21c0');
    });
    it('no depende del orden en que llegan los parámetros', () => {
        expect(signCloudinaryParams({ b: 2, a: 1 }, 's')).toBe(
            signCloudinaryParams({ a: 1, b: 2 }, 's'),
        );
    });
});

describe('productImageSignature', () => {
    const env = { cloudName: 'demo', apiKey: 'key', apiSecret: 'secret' };
    it('firma la carpeta de productos con el reloj en segundos', () => {
        const signed = productImageSignature(env, 1_700_000_123_456);
        expect(signed).toMatchObject({
            cloudName: 'demo',
            apiKey: 'key',
            timestamp: 1_700_000_123,
            folder: 'pago-jotron/productos',
        });
        expect(signed?.signature).toBe(
            signCloudinaryParams(
                {
                    allowed_formats: 'jpg,jpeg,png,webp',
                    folder: 'pago-jotron/productos',
                    timestamp: 1_700_000_123,
                },
                'secret',
            ),
        );
    });
    it('no incluye el secreto en la respuesta', () => {
        expect(JSON.stringify(productImageSignature(env))).not.toContain('secret');
    });
    it('null si falta alguna variable', () => {
        expect(productImageSignature({ ...env, apiSecret: undefined })).toBeNull();
        expect(productImageSignature({})).toBeNull();
    });
});
