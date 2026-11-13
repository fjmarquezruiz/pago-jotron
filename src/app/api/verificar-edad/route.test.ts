import { describe, expect, it } from 'vitest';
import { POST } from './route';

const post = (body: unknown) =>
    POST(
        new Request('http://localhost/api/verificar-edad', {
            method: 'POST',
            body: typeof body === 'string' ? body : JSON.stringify(body),
        }),
    );

const yearsAgo = (years: number) => `${new Date().getFullYear() - years}-01-01`;

describe('POST /api/verificar-edad', () => {
    it('mayor de edad: 200 y cookie age_verified httpOnly, lax y de 30 días', async () => {
        const res = await post({ birthDate: yearsAgo(30) });
        expect(res.status).toBe(200);
        const cookie = res.cookies.get('age_verified');
        expect(cookie?.value).toBe('1');
        expect(cookie?.httpOnly).toBe(true);
        expect(cookie?.sameSite).toBe('lax');
        expect(cookie?.maxAge).toBe(60 * 60 * 24 * 30);
    });

    it('no guarda la fecha: la cookie solo lleva el 1 y la respuesta no la devuelve', async () => {
        const res = await post({ birthDate: '1990-01-15' });
        expect(res.headers.get('set-cookie')).not.toContain('1990');
        expect(JSON.stringify(await res.json())).not.toContain('1990');
    });

    it('menor de edad: 403 y sin cookie', async () => {
        const res = await post({ birthDate: yearsAgo(10) });
        expect(res.status).toBe(403);
        expect(res.cookies.get('age_verified')).toBeUndefined();
    });

    it('fecha que no existe: 400 y sin cookie', async () => {
        const res = await post({ birthDate: '1990-02-30' });
        expect(res.status).toBe(400);
        expect(res.cookies.get('age_verified')).toBeUndefined();
    });

    it('cuerpo sin fecha o que no es JSON: 400', async () => {
        expect((await post({})).status).toBe(400);
        expect((await post('no es json')).status).toBe(400);
    });
});
