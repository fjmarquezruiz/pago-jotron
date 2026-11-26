import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/lib/db/queries', () => ({ insertAuditLogQuery: vi.fn() }));
const createGrape = vi.fn();
const updateGrapeValues = vi.fn();
const deleteGrape = vi.fn();
vi.mock('@/lib/admin/grapes-service', () => ({
    createGrape: (...a: unknown[]) => createGrape(...a),
    updateGrapeValues: (...a: unknown[]) => updateGrapeValues(...a),
    deleteGrape: (...a: unknown[]) => deleteGrape(...a),
}));

import { POST } from './route';
import { DELETE, PATCH } from './[id]/route';

const send = (method: string, body?: unknown) =>
    new Request('http://localhost/api/admin/uvas', {
        method,
        ...(body !== undefined && { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });
const valid = { name: 'Romé', color: 'Tinta' };

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 2, role: 'Editor' } });
    createGrape.mockReset().mockResolvedValue({ ok: true, value: { id: 11 } });
    updateGrapeValues.mockReset().mockResolvedValue({ ok: true, value: { changed: true } });
    deleteGrape.mockReset().mockResolvedValue({ ok: true, value: { deleted: true } });
});

describe('POST /api/admin/uvas', () => {
    it('exige Editor o Administrador y devuelve el rechazo tal cual', async () => {
        const denied = new Response('{}', { status: 403 });
        requireRole.mockResolvedValue({ response: denied });
        expect(await POST(send('POST', valid), { params: {} })).toBe(denied);
        expect(requireRole).toHaveBeenCalledWith(['Editor', 'Administrador']);
        expect(createGrape).not.toHaveBeenCalled();
    });
    it('crea con 201 y la cuenta de la sesión', async () => {
        const response = await POST(send('POST', valid), { params: {} });
        expect(response.status).toBe(201);
        await expect(response.json()).resolves.toEqual({ id: 11 });
        expect(createGrape).toHaveBeenCalledWith({ id: 2, role: 'Editor' }, valid);
    });
    it.each([
        ['JSON roto', '{no'],
        ['sin color', { name: 'Romé' }],
        ['campo de más', { ...valid, id: 1 }],
    ])('400 con %s', async (_, body) => {
        expect((await POST(send('POST', body), { params: {} })).status).toBe(400);
        expect(createGrape).not.toHaveBeenCalled();
    });
    it('409 con un nombre repetido', async () => {
        createGrape.mockResolvedValue({ ok: false, code: 'duplicate', message: 'Repetido' });
        const response = await POST(send('POST', valid), { params: {} });
        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({ message: 'Repetido' });
    });
});

describe('PATCH y DELETE /api/admin/uvas/[id]', () => {
    it.each(['abc', '0', '2147483648'])('400 con el id %s', async (id) => {
        expect((await PATCH(send('PATCH', valid), { params: { id } })).status).toBe(400);
        expect((await DELETE(send('DELETE'), { params: { id } })).status).toBe(400);
    });
    it('PATCH edita', async () => {
        const response = await PATCH(send('PATCH', valid), { params: { id: '5' } });
        expect(response.status).toBe(200);
        expect(updateGrapeValues).toHaveBeenCalledWith({ id: 2, role: 'Editor' }, 5, valid);
    });
    it('DELETE borra y exige el rol', async () => {
        const response = await DELETE(send('DELETE'), { params: { id: '5' } });
        expect(response.status).toBe(200);
        expect(deleteGrape).toHaveBeenCalledWith({ id: 2, role: 'Editor' }, 5);
        requireRole.mockResolvedValue({ response: new Response('{}', { status: 401 }) });
        expect((await DELETE(send('DELETE'), { params: { id: '5' } })).status).toBe(401);
    });
    it.each([
        ['not_found', 404],
        ['in_use', 409],
    ])('DELETE: %s -> %s', async (code, status) => {
        deleteGrape.mockResolvedValue({ ok: false, code, message: 'x' });
        expect((await DELETE(send('DELETE'), { params: { id: '5' } })).status).toBe(status);
    });
});
