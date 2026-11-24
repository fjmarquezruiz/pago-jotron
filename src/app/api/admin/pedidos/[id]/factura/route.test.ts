import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
const getOrderInvoice = vi.fn();
vi.mock('@/lib/db/admin-orders', () => ({
    getOrderInvoice: (id: number) => getOrderInvoice(id),
}));
vi.mock('@/lib/invoices/pdf', () => ({
    renderInvoicePdf: async () => Buffer.from('%PDF-1.4'),
}));

import { GET } from './route';

const get = (id: string) =>
    GET(new Request(`http://localhost/api/admin/pedidos/${id}/factura`), { params: { id } });

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 1, role: 'Administrador' } });
    getOrderInvoice.mockReset().mockResolvedValue({
        status: 'Entregado',
        document: { number: 'F-2026-0001' },
    });
});

describe('GET /api/admin/pedidos/[id]/factura', () => {
    it('exige el rol Administrador y devuelve su respuesta si no lo tiene', async () => {
        const denied = new Response('{}', { status: 403 });
        requireRole.mockResolvedValue({ response: denied });
        const response = await get('5');
        expect(requireRole).toHaveBeenCalledWith(['Administrador']);
        expect(response).toBe(denied);
        expect(getOrderInvoice).not.toHaveBeenCalled();
    });
    it.each(['abc', '0', '2147483648'])('400 con el id %s', async (id) => {
        expect((await get(id)).status).toBe(400);
    });
    it('200 con el PDF como descarga', async () => {
        const response = await get('5');
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
        expect(response.headers.get('Content-Disposition')).toBe(
            'attachment; filename="F-2026-0001.pdf"',
        );
        expect(getOrderInvoice).toHaveBeenCalledWith(5);
    });
    it.each([
        ['no hay factura', null],
        ['no está Entregado', { status: 'Enviado', document: { number: 'F-1' } }],
    ])('404 si %s', async (_, found) => {
        getOrderInvoice.mockResolvedValue(found);
        expect((await get('5')).status).toBe(404);
    });
    it('500 si algo falla', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        getOrderInvoice.mockRejectedValue(new Error('db'));
        expect((await get('5')).status).toBe(500);
    });
});
