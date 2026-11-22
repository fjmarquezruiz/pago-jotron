import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));
vi.mock('nodemailer', () => ({
    default: {
        createTransport: (...a: unknown[]) =>
            (createTransport as (...x: unknown[]) => unknown)(...a),
    },
}));

import { sendEmail } from './send';

const message = { to: 'ana@x.es', subject: 'Hola', html: '<p>Hola</p>', text: 'Hola' };
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    vi.stubEnv('SMTP_HOST', 'localhost');
    vi.stubEnv('SMTP_PORT', '1025');
    vi.stubEnv('MAIL_FROM', 'Tienda <t@x.es>');
    sendMail.mockReset().mockResolvedValue({});
    createTransport.mockClear();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    vi.unstubAllEnvs();
    consoleError.mockRestore();
});

describe('sendEmail', () => {
    it('envía con el remitente de la configuración y devuelve true', async () => {
        expect(await sendEmail(message)).toBe(true);
        expect(sendMail).toHaveBeenCalledWith({ from: 'Tienda <t@x.es>', ...message });
        expect(createTransport).toHaveBeenCalledWith(
            expect.objectContaining({ host: 'localhost', port: 1025, connectionTimeout: 10_000 }),
        );
    });

    it('si el servidor falla NO lanza: devuelve false y lo deja en el log', async () => {
        sendMail.mockRejectedValue(new Error('ECONNREFUSED'));
        await expect(sendEmail(message)).resolves.toBe(false);
        expect(consoleError).toHaveBeenCalledWith(
            expect.stringContaining('Hola'),
            expect.any(Error),
        );
    });

    it('sin configuración no intenta conectar: false y log', async () => {
        vi.stubEnv('SMTP_HOST', '');
        await expect(sendEmail(message)).resolves.toBe(false);
        expect(createTransport).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('SMTP_HOST'));
    });
});
