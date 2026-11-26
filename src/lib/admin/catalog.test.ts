import { describe, expect, it } from 'vitest';
import {
    catalogAuditEntry,
    changedFields,
    entityNumber,
    salesChangeText,
    salesStatusLabel,
} from './catalog';

describe('salesStatusLabel', () => {
    it('el interruptor se lee al revés que is_blocked', () => {
        expect(salesStatusLabel(false)).toBe('A la venta');
        expect(salesStatusLabel(true)).toBe('Ventas bloqueadas');
        expect(salesChangeText(true)).toBe('ventas bloqueadas');
        expect(salesChangeText(false)).toBe('puesta a la venta');
    });
});

describe('entityNumber', () => {
    it('rellena a tres cifras y no recorta las largas', () => {
        expect(entityNumber('WIN', 1)).toBe('WIN-001');
        expect(entityNumber('WIN', 1234)).toBe('WIN-1234');
    });
});

describe('changedFields', () => {
    const labels = { name: 'nombre', price: 'precio', variants: 'presentaciones' };
    it('devuelve solo los campos distintos, en el orden de las etiquetas', () => {
        const before = { name: 'A', price: 1, variants: [{ id: 1 }] };
        const after = { name: 'B', price: 1, variants: [{ id: 1 }, { id: 2 }] };
        expect(changedFields(before, after, labels)).toEqual(['nombre', 'presentaciones']);
    });
    it('vacío si no cambió nada', () => {
        const row = { name: 'A', price: 1, variants: [] };
        expect(changedFields(row, { ...row }, labels)).toEqual([]);
    });
});

describe('catalogAuditEntry', () => {
    it('anota la fila, qué cambió y quién', () => {
        expect(
            catalogAuditEntry({
                entity: 'winery',
                id: 3,
                name: 'Lustau',
                actor: { id: 1, role: 'Editor' },
                changes: ['nombre', 'ventas bloqueadas'],
            }),
        ).toEqual({
            userId: 1,
            action: 'Bodega 3: nombre, ventas bloqueadas',
            details: '«Lustau»; lo cambia Editor (cuenta 1)',
        });
    });
});
