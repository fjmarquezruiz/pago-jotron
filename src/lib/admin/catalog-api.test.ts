import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
vi.mock('@/lib/auth/require-role', () => ({ requireRole: (roles: unknown) => requireRole(roles) }));
const insertAuditLogQuery = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    insertAuditLogQuery: (...a: unknown[]) => insertAuditLogQuery(...a),
}));
const transaction = vi.fn();
vi.mock('@/db', () => ({ db: { transaction: (fn: unknown) => transaction(fn) } }));

import { auditedCatalogChange, catalogRoute, parseCatalogId, readJsonBody } from './catalog-api';

beforeEach(() => {
    requireRole.mockReset().mockResolvedValue({ user: { id: 2, role: 'Editor' } });
    insertAuditLogQuery.mockReset().mockResolvedValue(undefined);
    transaction.mockReset().mockImplementation((fn: (tx: unknown) => unknown) => fn('tx'));
});

describe('parseCatalogId', () => {
    it.each([
        ['7', 7],
        ['2147483647', 2147483647],
        ['0', null],
        ['-1', null],
        ['1.5', null],
        ['abc', null],
        ['2147483648', null],
        ['', null],
    ])('%s -> %s', (raw, expected) => expect(parseCatalogId(raw)).toBe(expected));
});

describe('readJsonBody', () => {
    it('devuelve el JSON o undefined', async () => {
        expect(
            await readJsonBody(new Request('http://x', { method: 'POST', body: '{"a":1}' })),
        ).toEqual({
            a: 1,
        });
        expect(
            await readJsonBody(new Request('http://x', { method: 'POST', body: 'no' })),
        ).toBeUndefined();
    });
});

describe('catalogRoute', () => {
    const call = (route: ReturnType<typeof catalogRoute<{ id: string }>>) =>
        route(new Request('http://x'), { params: { id: '1' } });

    it('exige Editor o Administrador y devuelve el rechazo tal cual', async () => {
        const denied = new Response('{}', { status: 403 });
        requireRole.mockResolvedValue({ response: denied });
        const handler = vi.fn();
        expect(await call(catalogRoute(handler))).toBe(denied);
        expect(requireRole).toHaveBeenCalledWith(['Editor', 'Administrador']);
        expect(handler).not.toHaveBeenCalled();
    });

    it('pasa al manejador la cuenta, los parámetros y la petición', async () => {
        const handler = vi.fn().mockResolvedValue(new Response('ok'));
        await call(catalogRoute(handler));
        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({ user: { id: 2, role: 'Editor' }, params: { id: '1' } }),
        );
    });

    it('permite restringir los roles (bloqueo de bodega y D.O.)', async () => {
        await call(catalogRoute(vi.fn().mockResolvedValue(new Response('ok')), ['Administrador']));
        expect(requireRole).toHaveBeenCalledWith(['Administrador']);
    });

    it('un error inesperado es un 500 sin detalles', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const response = await call(catalogRoute(vi.fn().mockRejectedValue(new Error('boom'))));
        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({ message: 'Error interno del servidor' });
    });
});

describe('auditedCatalogChange', () => {
    const audit = {
        entity: 'product' as const,
        id: 4,
        name: 'Reserva',
        actor: { id: 2, role: 'Editor' as const },
        changes: ['creado'],
    };

    it('anota el asiento en la misma transacción que el cambio', async () => {
        const result = await auditedCatalogChange(async (tx) => {
            expect(tx).toBe('tx');
            return { result: 'hecho', audit };
        });
        expect(result).toBe('hecho');
        expect(insertAuditLogQuery).toHaveBeenCalledWith('tx', {
            userId: 2,
            action: 'Producto 4: creado',
            details: '«Reserva»; lo cambia Editor (cuenta 2)',
        });
    });

    it('sin cambios no deja asiento', async () => {
        await auditedCatalogChange(async () => ({ result: null, audit: null }));
        expect(insertAuditLogQuery).not.toHaveBeenCalled();
    });

    it('si el asiento falla, el error sube y se deshace todo', async () => {
        insertAuditLogQuery.mockRejectedValue(new Error('fallo'));
        await expect(auditedCatalogChange(async () => ({ result: 1, audit }))).rejects.toThrow(
            'fallo',
        );
    });
});
