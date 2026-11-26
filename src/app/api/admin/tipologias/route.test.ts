import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/lib/db/queries', () => ({ insertAuditLogQuery: vi.fn() }));
const createTypology = vi.fn();
const updateTypologyValues = vi.fn();
const deleteTypology = vi.fn();
vi.mock('@/lib/admin/typologies-service', () => ({
    createTypology: (...a: unknown[]) => createTypology(...a),
    updateTypologyValues: (...a: unknown[]) => updateTypologyValues(...a),
    deleteTypology: (...a: unknown[]) => deleteTypology(...a),
}));

import { POST } from './route';
import { DELETE, PATCH } from './[id]/route';

const send = (method: string, body?: unknown) =>
    new Request('http://localhost/api/admin/tipologias', {
        method,
        ...(body !== undefined && { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });
const valid = { name: 'Pasa moscatel', productType: 'Pasas', filterOrder: 7, taxRate: 10 };

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 2, role: 'Editor' } });
    createTypology.mockReset().mockResolvedValue({ ok: true, value: { id: 11 } });
    updateTypologyValues.mockReset().mockResolvedValue({ ok: true, value: { changed: true } });
    deleteTypology.mockReset().mockResolvedValue({ ok: true, value: { deleted: true } });
});

describe('POST /api/admin/tipologias', () => {
    it('exige Editor o Administrador y devuelve el rechazo tal cual', async () => {
        const denied = new Response('{}', { status: 403 });
        requireRole.mockResolvedValue({ response: denied });
        expect(await POST(send('POST', valid), { params: {} })).toBe(denied);
        expect(requireRole).toHaveBeenCalledWith(['Editor', 'Administrador']);
        expect(createTypology).not.toHaveBeenCalled();
    });
    it('crea con 201 y la cuenta de la sesión', async () => {
        const response = await POST(send('POST', valid), { params: {} });
        expect(response.status).toBe(201);
        await expect(response.json()).resolves.toEqual({ id: 11 });
        expect(createTypology).toHaveBeenCalledWith({ id: 2, role: 'Editor' }, valid);
    });
    it.each([
        ['JSON roto', '{no'],
        ['sin IVA', { name: 'Pasa', productType: 'Pasas', filterOrder: 1 }],
        ['campo de más', { ...valid, id: 1 }],
    ])('400 con %s', async (_, body) => {
        expect((await POST(send('POST', body), { params: {} })).status).toBe(400);
        expect(createTypology).not.toHaveBeenCalled();
    });
    it('409 con un nombre repetido', async () => {
        createTypology.mockResolvedValue({ ok: false, code: 'duplicate', message: 'Repetido' });
        const response = await POST(send('POST', valid), { params: {} });
        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({ message: 'Repetido' });
    });
});

describe('PATCH y DELETE /api/admin/tipologias/[id]', () => {
    it.each(['abc', '0', '2147483648'])('400 con el id %s', async (id) => {
        expect((await PATCH(send('PATCH', valid), { params: { id } })).status).toBe(400);
        expect((await DELETE(send('DELETE'), { params: { id } })).status).toBe(400);
    });
    it('PATCH edita', async () => {
        const response = await PATCH(send('PATCH', valid), { params: { id: '5' } });
        expect(response.status).toBe(200);
        expect(updateTypologyValues).toHaveBeenCalledWith({ id: 2, role: 'Editor' }, 5, valid);
    });
    it('DELETE borra y exige el rol', async () => {
        const response = await DELETE(send('DELETE'), { params: { id: '5' } });
        expect(response.status).toBe(200);
        expect(deleteTypology).toHaveBeenCalledWith({ id: 2, role: 'Editor' }, 5);
        requireRole.mockResolvedValue({ response: new Response('{}', { status: 401 }) });
        expect((await DELETE(send('DELETE'), { params: { id: '5' } })).status).toBe(401);
    });
    it.each([
        ['not_found', 404],
        ['in_use', 409],
    ])('DELETE: %s -> %s', async (code, status) => {
        deleteTypology.mockResolvedValue({ ok: false, code, message: 'x' });
        expect((await DELETE(send('DELETE'), { params: { id: '5' } })).status).toBe(status);
    });
});
