import { describe, expect, it } from 'vitest';
import {
    CLASSIFICATIONS,
    CLASSIFICATION_VALUES,
    adminDenominationFilterLabels,
    adminDenominationsHref,
    adminDenominationsRangeText,
    denominationHref,
    denominationNumber,
    hasAdminDenominationFilters,
} from './denominations';

describe('adminDenominationsHref', () => {
    it('sin nada es el listado', () => {
        expect(adminDenominationsHref({})).toBe('/admin/denominaciones');
    });
    it('conserva página, región y búsqueda', () => {
        expect(adminDenominationsHref({ page: 2, region: 'Málaga', q: 'sierras' })).toBe(
            '/admin/denominaciones?pagina=2&region=M%C3%A1laga&q=sierras',
        );
    });
});

describe('filtros', () => {
    it('hasAdminDenominationFilters y chips', () => {
        expect(hasAdminDenominationFilters({})).toBe(false);
        expect(hasAdminDenominationFilters({ region: 'Cádiz' })).toBe(true);
        expect(adminDenominationFilterLabels({})).toEqual({ region: 'Región: todas' });
        expect(adminDenominationFilterLabels({ region: 'Cádiz', q: 'x' })).toEqual({
            region: 'Región: Cádiz',
            search: 'x',
        });
    });
});

describe('adminDenominationsRangeText', () => {
    const base = { page: 1, pageSize: 10, shown: 10, total: 34, overall: 34, filtered: false };
    it('rango, filtrado y vacío', () => {
        expect(adminDenominationsRangeText(base)).toBe('Mostrando 1–10 de 34 denominaciones');
        expect(adminDenominationsRangeText({ ...base, shown: 1, total: 1, filtered: true })).toBe(
            'Mostrando 1 denominación filtrada de 34',
        );
        expect(adminDenominationsRangeText({ ...base, shown: 0, total: 0 })).toBe(
            'Mostrando 0 de 0',
        );
    });
});

describe('ids, rutas y clasificaciones', () => {
    it('DO-001', () => {
        expect(denominationNumber(5)).toBe('DO-005');
        expect(denominationHref(5)).toBe('/admin/denominaciones/5');
    });
    it('las clasificaciones del desplegable son las del enum', () => {
        expect(CLASSIFICATIONS.map((item) => item.value)).toEqual([...CLASSIFICATION_VALUES]);
    });
});
