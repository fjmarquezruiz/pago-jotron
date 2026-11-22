import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvoiceDocument } from '@/lib/invoices/types';

const getSessionUserId = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUserId: () => getSessionUserId() }));

const getUserInvoice = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getUserInvoice: (userId: number, orderId: number) => getUserInvoice(userId, orderId),
}));

import { GET } from './route';

const get = (id: string) =>
    GET(new Request(`http://localhost/api/pedidos/${id}/factura`), { params: { id } });

const document: InvoiceDocument = {
    number: 'F-2026-0001',
    kind: 'Completa',
    issueDate: '2026-10-15 07:12:00',
    orderNumber: 'PJ-12',
    issuer: {
        name: 'Bodegas Jotrón S.L.',
        taxId: 'B12345678',
        address: 'Calle Larios 1, 29005 Málaga',
    },
    recipient: {
        name: 'Juan Moreno',
        taxId: '12345678Z',
        address: 'Calle Alcalá 12, 28014 Madrid',
    },
    lines: [
        {
            description: 'Jotrón Tinto Roble 2021',
            quantity: 2,
            unitPriceCents: 1150,
            totalCents: 2300,
            taxRate: '21.00',
        },
    ],
    shipping: { description: 'Envío estándar', cents: 495, taxRate: '21.00' },
    vat: [{ rate: '21.00', grossCents: 2795, baseCents: 2310, taxCents: 485 }],
    taxBaseCents: 2310,
    taxAmountCents: 485,
    totalCents: 2795,
};

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUserId.mockReset().mockResolvedValue(12);
    getUserInvoice.mockReset().mockResolvedValue({ status: 'Entregado', document });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
    vi.unstubAllEnvs();
});

describe('GET /api/pedidos/[id]/factura', () => {
    it('devuelve el PDF de la factura de la cuenta de la sesión', async () => {
        const response = await get('12');
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
        expect(response.headers.get('Content-Disposition')).toBe(
            'attachment; filename="F-2026-0001.pdf"',
        );
        expect(response.headers.get('Cache-Control')).toBe('private, no-store');
        const body = Buffer.from(await response.arrayBuffer());
        expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
        expect(getUserInvoice).toHaveBeenCalledWith(12, 12);
    });

    it('sanea el número de factura en el nombre del archivo', async () => {
        getUserInvoice.mockResolvedValue({
            status: 'Entregado',
            document: { ...document, number: 'F/2026 "0001"\r\n' },
        });
        const disposition = (await get('12')).headers.get('Content-Disposition');
        expect(disposition).toBe('attachment; filename="F_2026__0001___.pdf"');
    });

    it('responde 401 sin sesión y no consulta nada', async () => {
        getSessionUserId.mockResolvedValue(null);
        expect((await get('12')).status).toBe(401);
        expect(getUserInvoice).not.toHaveBeenCalled();
    });

    it.each(['abc', '0', '-1', '1.5', '2147483648', '12abc'])(
        'responde 400 si el id es %s',
        async (id) => {
            expect((await get(id)).status).toBe(400);
            expect(getUserInvoice).not.toHaveBeenCalled();
        },
    );

    it('responde 404 si el pedido no existe, es de otra cuenta o no tiene factura', async () => {
        getUserInvoice.mockResolvedValue(null);
        const response = await get('12');
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ message: 'El pedido no existe' });
    });

    it.each([
        'Pendiente de pago',
        'Confirmado',
        'En proceso',
        'Preparado',
        'Enviado',
        'Bloqueado',
        'Anulado',
    ])('responde 404 si el pedido está %s, con el mismo mensaje', async (status) => {
        getUserInvoice.mockResolvedValue({ status, document });
        const response = await get('12');
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ message: 'El pedido no existe' });
    });

    it('no lee el entorno: descargar una factura emitida funciona aunque falten o cambien los datos del emisor', async () => {
        vi.stubEnv('INVOICE_ISSUER_NAME', '');
        vi.stubEnv('INVOICE_ISSUER_TAX_ID', '');
        vi.stubEnv('INVOICE_ISSUER_ADDRESS', '');
        const response = await get('12');
        expect(response.status).toBe(200);
        expect(
            Buffer.from(await response.arrayBuffer())
                .subarray(0, 5)
                .toString(),
        ).toBe('%PDF-');
    });

    it('un fallo inesperado responde 500 sin detalles', async () => {
        getUserInvoice.mockRejectedValue(new Error('conexión caída'));
        const response = await get('12');
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ message: 'Error interno del servidor' });
    });
});
