import { describe, expect, it, vi } from 'vitest';
import { valueRequest } from './value-request';

const reply = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('valueRequest', () => {
    it('envía el cuerpo como JSON y devuelve ok', async () => {
        const request = reply(201, { id: 1 });
        expect(await valueRequest('/api/admin/uvas', 'POST', { name: 'Romé' }, request)).toEqual({
            kind: 'ok',
        });
        expect(request).toHaveBeenCalledWith('/api/admin/uvas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{"name":"Romé"}',
        });
    });
    it('DELETE va sin cuerpo', async () => {
        const request = reply(200, { deleted: true });
        await valueRequest('/api/admin/uvas/3', 'DELETE', undefined, request);
        expect(request).toHaveBeenCalledWith('/api/admin/uvas/3', { method: 'DELETE' });
    });
    it.each([400, 404, 409])('%s con mensaje es un rechazo', async (status) => {
        expect(await valueRequest('/x', 'PATCH', {}, reply(status, { message: 'No' }))).toEqual({
            kind: 'rejected',
            status,
            message: 'No',
        });
    });
    it.each([[401], [403], [500]])('%s es un error', async (status) => {
        expect(await valueRequest('/x', 'PATCH', {}, reply(status, { message: 'No' }))).toEqual({
            kind: 'error',
        });
    });
    it('un 409 sin mensaje y un fallo de red son error', async () => {
        expect(await valueRequest('/x', 'PATCH', {}, reply(409, {}))).toEqual({ kind: 'error' });
        expect(
            await valueRequest('/x', 'PATCH', {}, vi.fn().mockRejectedValue(new Error('red'))),
        ).toEqual({ kind: 'error' });
    });
});
