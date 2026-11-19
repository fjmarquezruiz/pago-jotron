import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe('getStripe', () => {
    it('falla con un mensaje claro si falta STRIPE_SECRET_KEY', async () => {
        vi.stubEnv('STRIPE_SECRET_KEY', '');
        const { getStripe } = await import('./stripe');
        expect(() => getStripe()).toThrow('STRIPE_SECRET_KEY');
    });

    it('crea el cliente una sola vez y lo comparte', async () => {
        vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
        const { getStripe } = await import('./stripe');
        expect(getStripe()).toBe(getStripe());
    });
});
