import { describe, expect, it } from 'vitest';
import {
    adminProductFilterChips,
    adminProductsHref,
    adminProductsRangeText,
    defaultCapacityUnit,
    hasAdminProductFilters,
    lowestPrice,
    presentationSummary,
    productNumber,
    productStockState,
    productWriteStatus,
    taxText,
    totalStock,
} from './products';

describe('adminProductsHref', () => {
    it('sin filtros ni página es la ruta del listado', () => {
        expect(adminProductsHref({})).toBe('/admin/productos');
        expect(adminProductsHref({ page: 1 })).toBe('/admin/productos');
    });
    it('conserva los filtros y omite la página 1', () => {
        expect(
            adminProductsHref({
                page: 3,
                typologyId: 2,
                guaranteeOfOriginId: 5,
                wineryId: 7,
                status: 'Bloqueado',
                q: 'reserva',
            }),
        ).toBe(
            '/admin/productos?pagina=3&tipologia=2&denominacion=5&bodega=7&estado=Bloqueado&q=reserva',
        );
    });
});

describe('hasAdminProductFilters', () => {
    it('es true con cualquier filtro', () => {
        expect(hasAdminProductFilters({})).toBe(false);
        expect(hasAdminProductFilters({ q: 'a' })).toBe(true);
        expect(hasAdminProductFilters({ wineryId: 1 })).toBe(true);
    });
});

describe('adminProductFilterChips', () => {
    const names = {
        typologies: [{ id: 1, name: 'Tinto' }],
        guarantees: [{ id: 2, name: 'Sierras de Málaga' }],
        wineries: [{ id: 3, name: 'Bodegas Pago de Jotrón' }],
    };
    it('siempre enseña «Tipo: todos»', () => {
        expect(adminProductFilterChips({}, names)).toEqual([{ label: 'Tipo: todos' }]);
    });
    it('rotula cada filtro con su nombre y la búsqueda aparte', () => {
        expect(
            adminProductFilterChips(
                { typologyId: 1, guaranteeOfOriginId: 2, wineryId: 3, status: 'Activo', q: 'x' },
                names,
            ),
        ).toEqual([
            { label: 'Tipo: tinto' },
            { label: 'D.O.: Sierras de Málaga' },
            { label: 'Bodega: Bodegas Pago de Jotrón' },
            { label: 'Estado: activo' },
            { label: 'x', variant: 'outline' },
        ]);
    });
});

describe('adminProductsRangeText', () => {
    const base = { page: 1, pageSize: 10, shown: 10, total: 142, overall: 142, filtered: false };
    it('rango sin filtros', () => {
        expect(adminProductsRangeText(base)).toBe('Mostrando 1-10 de 142 productos');
        expect(adminProductsRangeText({ ...base, page: 3, shown: 2, total: 22 })).toBe(
            'Mostrando 21-22 de 22 productos',
        );
    });
    it('con filtros y sin resultados', () => {
        expect(adminProductsRangeText({ ...base, filtered: true, shown: 1, total: 1 })).toBe(
            'Mostrando 1 producto filtrado de 142',
        );
        expect(adminProductsRangeText({ ...base, filtered: true, shown: 3, total: 3 })).toBe(
            'Mostrando 3 productos filtrados de 142',
        );
        expect(adminProductsRangeText({ ...base, shown: 0, total: 0 })).toBe('Mostrando 0 de 0');
    });
});

describe('productStockState', () => {
    const v = (stock: number, isBlocked = false) => ({ stock, isBlocked });
    it('bloqueado manda sobre las existencias', () => {
        expect(productStockState(true, [v(100)])).toEqual({
            label: 'Ventas bloqueadas',
            tone: 'destructive',
        });
    });
    it('agotado si ninguna presentación a la venta tiene stock', () => {
        expect(productStockState(false, [v(0), v(50, true)]).label).toBe('Agotado');
    });
    it('limitado si alguna a la venta queda por debajo del umbral', () => {
        expect(productStockState(false, [v(11), v(500)]).label).toBe('Limitado');
        expect(productStockState(false, [v(12), v(500)]).label).toBe('A la venta');
    });
    it('una presentación bloqueada con poco stock no cuenta', () => {
        expect(productStockState(false, [v(3, true), v(100)]).label).toBe('A la venta');
    });
});

describe('resumen de presentaciones', () => {
    const variants = [
        { format: 'Mágnum', capacity: 1500, capacityUnit: 'ml' as const, price: '52.00', stock: 0 },
        {
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml' as const,
            price: '24.50',
            stock: 412,
        },
        { format: 'Caja', capacity: 500, capacityUnit: 'g' as const, price: '9.9', stock: 3 },
    ];
    it('nombra la de menor capacidad y cuenta las demás', () => {
        expect(presentationSummary(variants)).toEqual({ label: 'Caja 500 g', more: 2 });
        expect(presentationSummary(variants.slice(0, 2))).toEqual({
            label: 'Botella 75 cl',
            more: 1,
        });
        expect(presentationSummary([])).toBeNull();
    });
    it('precio más bajo y existencias totales', () => {
        expect(lowestPrice(variants)).toBe('9.9');
        expect(lowestPrice([])).toBeNull();
        expect(totalStock(variants)).toBe(415);
    });
});

describe('textos del formulario', () => {
    it('IVA de la tipología', () => {
        expect(taxText('21.00')).toBe('IVA 21 % (tipología)');
        expect(taxText('10.00')).toBe('IVA 10 % (tipología)');
        expect(taxText('7.5')).toBe('IVA 7,5 % (tipología)');
        expect(taxText(undefined)).toBe('El IVA sale de la tipología');
    });
    it('unidad por defecto según el tipo de producto', () => {
        expect(defaultCapacityUnit('Vino')).toBe('ml');
        expect(defaultCapacityUnit('Pasas')).toBe('g');
        expect(defaultCapacityUnit(undefined)).toBe('ml');
    });
    it('número de producto', () => {
        expect(productNumber(8)).toBe('PRD-008');
    });
});

describe('productWriteStatus', () => {
    it('asigna el código HTTP de cada fallo', () => {
        expect(productWriteStatus('not_found')).toBe(404);
        expect(productWriteStatus('invalid_reference')).toBe(400);
        expect(productWriteStatus('invalid_variant')).toBe(400);
        expect(productWriteStatus('stock_conflict')).toBe(409);
        expect(productWriteStatus('slug_taken')).toBe(409);
        expect(productWriteStatus('duplicate_variant')).toBe(409);
    });
});
