import { describe, expect, it } from 'vitest';
import { affectedOrdersNotice, canReleaseSales, IN_PROGRESS_STATUSES } from './sales-block';

describe('canReleaseSales', () => {
    it('deja poner a la venta si bodega y D.O. están a la venta', () => {
        expect(canReleaseSales({ wineryBlocked: false, denominationBlocked: false })).toEqual({
            ok: true,
        });
    });

    it('no si la bodega sigue bloqueada', () => {
        const result = canReleaseSales({ wineryBlocked: true, denominationBlocked: false });
        expect(result.ok).toBe(false);
        expect(!result.ok && result.message).toMatch(/su bodega/);
    });

    it('no si la D.O. sigue bloqueada', () => {
        const result = canReleaseSales({ wineryBlocked: false, denominationBlocked: true });
        expect(result.ok).toBe(false);
        expect(!result.ok && result.message).toMatch(/denominación de origen/);
    });

    it('nombra las dos si están bloqueadas las dos', () => {
        const result = canReleaseSales({ wineryBlocked: true, denominationBlocked: true });
        expect(!result.ok && result.message).toMatch(/bodega y su denominación/);
    });
});

describe('IN_PROGRESS_STATUSES', () => {
    it('excluye los estados finales y Bloqueado', () => {
        expect(IN_PROGRESS_STATUSES).toEqual([
            'Pendiente de pago',
            'Confirmado',
            'En proceso',
            'Preparado',
            'Enviado',
        ]);
    });
});

describe('affectedOrdersNotice', () => {
    it('no avisa sin pedidos', () => {
        expect(affectedOrdersNotice(0, 'winery')).toBeNull();
    });

    it('usa el plural y dice que siguen su curso', () => {
        expect(affectedOrdersNotice(3, 'winery')).toEqual({
            before: 'Hay ',
            strong: '3 pedidos en curso',
            after: ' con productos de esta bodega: no cambian y seguirán su curso.',
        });
    });

    it('usa el singular y la palabra de cada ámbito', () => {
        expect(affectedOrdersNotice(1, 'denomination')).toMatchObject({
            strong: '1 pedido en curso',
            after: expect.stringContaining('productos de esta denominación'),
        });
        expect(affectedOrdersNotice(2, 'product')?.after).toContain('con este producto');
    });
});
