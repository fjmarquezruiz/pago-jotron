import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getBlockCandidateIds = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getBlockCandidateIds: (...a: unknown[]) => getBlockCandidateIds(...a),
}));
const blockOrder = vi.fn();
vi.mock('./block', () => ({ blockOrder: (...a: unknown[]) => blockOrder(...a) }));

import { blockOverdueOrders } from './block-overdue';

const NOW = new Date('2026-11-20T10:30:45Z');
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getBlockCandidateIds.mockReset().mockResolvedValue([]);
    blockOrder.mockReset().mockResolvedValue({ ok: true, from: 'Confirmado' });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

describe('blockOverdueOrders', () => {
    it('preselecciona con el corte de hace 15 días, en UTC', async () => {
        await blockOverdueOrders(NOW);
        expect(getBlockCandidateIds).toHaveBeenCalledWith('2026-11-05 10:30:45');
    });

    it('bloquea cada candidato con el mismo reloj y cuenta los bloqueados', async () => {
        getBlockCandidateIds.mockResolvedValue([3, 8]);
        const summary = await blockOverdueOrders(NOW);
        expect(blockOrder).toHaveBeenCalledWith(3, NOW);
        expect(blockOrder).toHaveBeenCalledWith(8, NOW);
        expect(summary).toEqual({ checked: 2, blocked: 2, skipped: 0, failed: [] });
    });

    it('los que ya no cumplen o cambiaron de estado se cuentan como saltados', async () => {
        getBlockCandidateIds.mockResolvedValue([3, 8, 9]);
        blockOrder
            .mockResolvedValueOnce({ ok: true, from: 'Enviado' })
            .mockResolvedValueOnce({ ok: false, code: 'conflict', message: 'x' })
            .mockResolvedValueOnce({ ok: false, code: 'not_blockable', message: 'x' });
        expect(await blockOverdueOrders(NOW)).toEqual({
            checked: 3,
            blocked: 1,
            skipped: 2,
            failed: [],
        });
    });

    it('un pedido que falla no frena a los demás: queda en failed y en el log', async () => {
        getBlockCandidateIds.mockResolvedValue([3, 8, 9]);
        blockOrder
            .mockResolvedValueOnce({ ok: true, from: 'Enviado' })
            .mockRejectedValueOnce(new Error('BD'))
            .mockResolvedValueOnce({ ok: true, from: 'Enviado' });
        expect(await blockOverdueOrders(NOW)).toEqual({
            checked: 3,
            blocked: 2,
            skipped: 0,
            failed: [8],
        });
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('8'), expect.any(Error));
    });

    it('sin candidatos no hace nada', async () => {
        expect(await blockOverdueOrders(NOW)).toEqual({
            checked: 0,
            blocked: 0,
            skipped: 0,
            failed: [],
        });
        expect(blockOrder).not.toHaveBeenCalled();
    });
});
