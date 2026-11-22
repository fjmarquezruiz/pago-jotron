import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMailConfig } from './config';

afterEach(() => vi.unstubAllEnvs());

function env(values: Record<string, string>) {
    for (const key of [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_SECURE',
        'SMTP_USER',
        'SMTP_PASS',
        'MAIL_FROM',
    ])
        vi.stubEnv(key, values[key] ?? '');
}

describe('getMailConfig', () => {
    it('Mailpit en local: host y puerto, sin credenciales', () => {
        env({ SMTP_HOST: 'localhost', SMTP_PORT: '1025', MAIL_FROM: 'Tienda <t@x.es>' });
        expect(getMailConfig()).toEqual({
            host: 'localhost',
            port: 1025,
            secure: false,
            from: 'Tienda <t@x.es>',
        });
    });

    it('SMTP real: credenciales y TLS directo', () => {
        env({
            SMTP_HOST: 'smtp.real.es',
            SMTP_PORT: '465',
            SMTP_SECURE: 'true',
            SMTP_USER: 'u',
            SMTP_PASS: 'p',
            MAIL_FROM: 't@x.es',
        });
        expect(getMailConfig()).toMatchObject({
            port: 465,
            secure: true,
            auth: { user: 'u', pass: 'p' },
        });
    });

    it('el puerto por defecto es 587', () => {
        env({ SMTP_HOST: 'h', MAIL_FROM: 'a@b.es' });
        expect(getMailConfig()?.port).toBe(587);
    });

    it('sin usuario o sin contraseña no hay autenticación a medias', () => {
        env({ SMTP_HOST: 'h', MAIL_FROM: 'a@b.es', SMTP_USER: 'u' });
        expect(getMailConfig()).not.toHaveProperty('auth');
    });

    it.each([
        ['falta el host', { MAIL_FROM: 'a@b.es' }],
        ['falta el remitente', { SMTP_HOST: 'h' }],
        ['host solo con espacios', { SMTP_HOST: '  ', MAIL_FROM: 'a@b.es' }],
        ['puerto no válido', { SMTP_HOST: 'h', MAIL_FROM: 'a@b.es', SMTP_PORT: 'abc' }],
        ['puerto fuera de rango', { SMTP_HOST: 'h', MAIL_FROM: 'a@b.es', SMTP_PORT: '70000' }],
    ])('%s → null', (_name, values) => {
        env(values);
        expect(getMailConfig()).toBeNull();
    });
});
