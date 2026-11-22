import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getOrderEmailData = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getOrderEmailData: (...a: unknown[]) => getOrderEmailData(...a),
}));
const sendEmail = vi.fn();
vi.mock('./send', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }));

import { notifyOrderCancelled, notifyOrderConfirmed, notifyTransferReceived } from './order-emails';

const order = {
    orderId: 12,
    email: 'ana@x.es',
    name: 'Ana',
    total: '33.45',
    shippingCost: '4.95',
    paymentMethod: 'Tarjeta',
    createdAt: '2026-11-01 10:00:00',
    lines: [{ name: 'Vino', vintage: null, quantity: 1, unitPrice: '28.50' }],
};
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getOrderEmailData.mockReset().mockResolvedValue(order);
    sendEmail.mockReset().mockResolvedValue(true);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

describe('avisos de pedido', () => {
    it('confirmado: escribe al correo de la cuenta', async () => {
        await notifyOrderConfirmed(12);
        expect(getOrderEmailData).toHaveBeenCalledWith(12);
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({ to: 'ana@x.es', subject: 'Pedido PJ-12 confirmado' }),
        );
    });

    it('transferencia recibida', async () => {
        await notifyTransferReceived(12);
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({ subject: 'Transferencia recibida: pedido PJ-12' }),
        );
    });

    it('anulado: pasa el resultado del reembolso al texto', async () => {
        await notifyOrderCancelled(12, 'failed');
        expect(sendEmail.mock.calls[0][0].text).toContain('Estamos tramitando la devolución');
    });

    it('un pedido que no existe no envía nada ni lanza', async () => {
        getOrderEmailData.mockResolvedValue(null);
        await expect(notifyOrderConfirmed(99)).resolves.toBeUndefined();
        expect(sendEmail).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
    });

    it('si la BD falla al leer el pedido, no lanza (el pedido no se toca)', async () => {
        getOrderEmailData.mockRejectedValue(new Error('BD caída'));
        await expect(notifyOrderCancelled(12, 'none')).resolves.toBeUndefined();
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('12'), expect.any(Error));
    });

    it('si el envío falla, tampoco lanza', async () => {
        sendEmail.mockRejectedValue(new Error('boom'));
        await expect(notifyOrderConfirmed(12)).resolves.toBeUndefined();
    });
});
