import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cloudinaryLoader } from './cloudinary';

describe('cloudinaryLoader', () => {
    beforeEach(() => {
        vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'demo');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('monta la URL con la calidad que pide Next', () => {
        expect(
            cloudinaryLoader({
                src: 'pago-jotron/productos/payoya-negra-2022',
                width: 640,
                quality: 75,
            }),
        ).toBe(
            'https://res.cloudinary.com/demo/image/upload/f_auto,c_limit,w_640,q_75/pago-jotron/productos/payoya-negra-2022',
        );
    });

    it('usa q_auto cuando no hay calidad', () => {
        expect(
            cloudinaryLoader({ src: 'pago-jotron/productos/payoya-negra-2022', width: 384 }),
        ).toBe(
            'https://res.cloudinary.com/demo/image/upload/f_auto,c_limit,w_384,q_auto/pago-jotron/productos/payoya-negra-2022',
        );
    });
});
