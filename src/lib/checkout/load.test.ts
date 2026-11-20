import { describe, expect, it, vi } from 'vitest';
import { loadCheckoutData, type CheckoutFetch } from './load';

const address = {
    id: 3,
    recipientName: 'Ana García',
    phone: '600000000',
    streetType: 'Calle',
    streetName: 'de Alcalá',
    number: '12',
    floor: null,
    postalCode: '28014',
    city: 'Madrid',
    province: 'Madrid',
    country: 'España',
    addressType: 'Envío',
};
const profile = {
    name: 'Ana',
    lastName: 'García',
    email: 'ana@ejemplo.com',
    phone: '600000000',
    idCard: null,
};

const json = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

/** `fetch` falso que contesta según la ruta. */
const routes =
    (map: Record<string, () => Promise<Response>>): CheckoutFetch =>
    (url) =>
        (map[url] ?? (() => Promise.reject(new Error('ruta inesperada'))))();

describe('loadCheckoutData', () => {
    it('devuelve direcciones y perfil', async () => {
        const result = await loadCheckoutData({
            fetchFn: routes({
                '/api/cuenta/direcciones': () => json({ addresses: [address] }),
                '/api/cuenta/perfil': () => json({ profile }),
            }),
        });
        expect(result).toEqual({ ok: true, data: { addresses: [address], profile } });
    });

    it('pide sin caché y con una señal', async () => {
        const fetchFn = vi.fn<CheckoutFetch>((url) =>
            url === '/api/cuenta/perfil' ? json({ profile }) : json({ addresses: [] }),
        );
        await loadCheckoutData({ fetchFn });
        for (const [, init] of fetchFn.mock.calls) {
            expect(init?.cache).toBe('no-store');
            expect(init?.signal).toBeInstanceOf(AbortSignal);
        }
    });

    it('un 401 en cualquiera es "unauthorized"', async () => {
        const result = await loadCheckoutData({
            fetchFn: routes({
                '/api/cuenta/direcciones': () => json({ message: 'no' }, 401),
                '/api/cuenta/perfil': () => json({ profile }),
            }),
        });
        expect(result).toEqual({ ok: false, reason: 'unauthorized' });
    });

    it.each([
        ['un 500', () => json({ message: 'mal' }, 500)],
        ['un 404 (la ruta aún no existe)', () => json({ message: 'no' }, 404)],
        ['una respuesta con otra forma', () => json({ nada: true })],
        ['un fallo de red', () => Promise.reject(new TypeError('Failed to fetch'))],
    ])('%s en el perfil es "error"', async (_name, perfil) => {
        const result = await loadCheckoutData({
            fetchFn: routes({
                '/api/cuenta/direcciones': () => json({ addresses: [] }),
                '/api/cuenta/perfil': perfil,
            }),
        });
        expect(result).toEqual({ ok: false, reason: 'error' });
    });

    it('un JSON roto es "error"', async () => {
        const result = await loadCheckoutData({
            fetchFn: routes({
                '/api/cuenta/direcciones': () => Promise.resolve(new Response('{no')),
                '/api/cuenta/perfil': () => json({ profile }),
            }),
        });
        expect(result).toEqual({ ok: false, reason: 'error' });
    });

    it('una petición que no contesta se da por perdida pasado el tiempo máximo', async () => {
        const hang: CheckoutFetch = (_url, init) =>
            new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
            });
        const result = await loadCheckoutData({ fetchFn: hang, timeoutMs: 20 });
        expect(result).toEqual({ ok: false, reason: 'error' });
    });
});
