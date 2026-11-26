import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/lib/db/queries', () => ({ insertAuditLogQuery: vi.fn() }));
const createShippingType = vi.fn();
const updateShippingType = vi.fn();
vi.mock('@/lib/admin/shipping-types-service', () => ({
    createShippingType: (...a: unknown[]) => createShippingType(...a),
    updateShippingType: (...a: unknown[]) => updateShippingType(...a),
}));

import { POST } from './route';
import { PATCH } from './[id]/route';

const send = (method: string, body?: unknown) =>
    new Request('http://localhost/api/admin/envios', {
        method,
        ...(body !== undefined && { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });
const valid = {
    name: 'Exprés',
    cost: 9.95,
    minDeliveryDays: 1,
    maxDeliveryDays: 1,
    isBlocked: false,
};

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 1, role: 'Administrador' } });
    createShippingType.mockReset().mockResolvedValue({ ok: true, value: { id: 5 } });
    updateShippingType.mockReset().mockResolvedValue({ ok: true, value: { changed: true } });
});

describe('POST /api/admin/envios', () => {
    it('solo el Administrador: un editor recibe el rechazo tal cual', async () => {
        const denied = new Response('{}', { status: 403 });
        requireRole.mockResolvedValue({ response: denied });
        expect(await POST(send('POST', valid), { params: {} })).toBe(denied);
        expect(requireRole).toHaveBeenCalledWith(['Administrador']);
        expect(createShippingType).not.toHaveBeenCalled();
    });
    it('crea con 201', async () => {
        const response = await POST(send('POST', valid), { params: {} });
        expect(response.status).toBe(201);
        await expect(response.json()).resolves.toEqual({ id: 5 });
    });
    it('400 con cuerpo no válido', async () => {
        expect((await POST(send('POST', { ...valid, cost: -1 }), { params: {} })).status).toBe(400);
    });
    it('409 con un nombre repetido', async () => {
        createShippingType.mockResolvedValue({ ok: false, code: 'duplicate', message: 'Repetido' });
        expect((await POST(send('POST', valid), { params: {} })).status).toBe(409);
    });
});

describe('PATCH /api/admin/envios/[id]', () => {
    it('solo el Administrador', async () => {
        await PATCH(send('PATCH', valid), { params: { id: '2' } });
        expect(requireRole).toHaveBeenCalledWith(['Administrador']);
    });
    it('400 con un id no válido', async () => {
        expect((await PATCH(send('PATCH', valid), { params: { id: 'x' } })).status).toBe(400);
    });
    it('404 si no existe y 409 si es el último activo', async () => {
        updateShippingType.mockResolvedValue({ ok: false, code: 'not_found', message: 'No' });
        expect((await PATCH(send('PATCH', valid), { params: { id: '2' } })).status).toBe(404);
        updateShippingType.mockResolvedValue({ ok: false, code: 'last_active', message: 'Último' });
        expect((await PATCH(send('PATCH', valid), { params: { id: '2' } })).status).toBe(409);
    });
    it('200 con changed', async () => {
        const response = await PATCH(send('PATCH', valid), { params: { id: '2' } });
        expect(response.status).toBe(200);
        expect(updateShippingType).toHaveBeenCalledWith({ id: 1, role: 'Administrador' }, 2, valid);
    });
});
