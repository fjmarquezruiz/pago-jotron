import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const blockOverdueOrders = vi.fn();
vi.mock('@/lib/orders/block-overdue', () => ({
    blockOverdueOrders: (...a: unknown[]) => blockOverdueOrders(...a),
}));

import { GET } from './route';

const call = (authorization?: string) =>
    GET(
        new Request('http://localhost/api/cron/bloquear-pedidos', {
            headers: authorization === undefined ? {} : { authorization },
        }),
    );
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 's3creto');
    blockOverdueOrders
        .mockReset()
        .mockResolvedValue({ checked: 2, blocked: 2, skipped: 0, failed: [] });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    vi.unstubAllEnvs();
    consoleError.mockRestore();
});

describe('GET /api/cron/bloquear-pedidos', () => {
    it('con el secreto correcto bloquea y devuelve el recuento', async () => {
        const response = await call('Bearer s3creto');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ checked: 2, blocked: 2, skipped: 0, failed: [] });
        expect(blockOverdueOrders).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['sin cabecera', undefined],
        ['secreto incorrecto', 'Bearer otro'],
        ['más largo', 'Bearer s3creto-y-mas'],
        ['sin Bearer', 's3creto'],
        ['vacío', 'Bearer '],
    ])('%s → 401 y no toca nada', async (_name, header) => {
        expect((await call(header)).status).toBe(401);
        expect(blockOverdueOrders).not.toHaveBeenCalled();
    });

    it.each(['', '   '])(
        'sin CRON_SECRET (%j) no atiende a nadie, ni con «Bearer undefined»',
        async (value) => {
            vi.stubEnv('CRON_SECRET', value);
            expect((await call('Bearer undefined')).status).toBe(500);
            expect((await call('Bearer ')).status).toBe(500);
            expect(blockOverdueOrders).not.toHaveBeenCalled();
        },
    );

    it('si falla la BD responde 500 sin detalles', async () => {
        blockOverdueOrders.mockRejectedValue(new Error('secreto interno'));
        const response = await call('Bearer s3creto');
        expect(response.status).toBe(500);
        expect(JSON.stringify(await response.json())).not.toContain('secreto interno');
    });
});
