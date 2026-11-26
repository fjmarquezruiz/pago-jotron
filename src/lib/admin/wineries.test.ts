import { describe, expect, it } from 'vitest';
import {
    SPANISH_PROVINCES,
    adminWineriesHref,
    adminWineriesRangeText,
    adminWineryFilterLabels,
    hasAdminWineryFilters,
    wineryHref,
    wineryNumber,
} from './wineries';

describe('adminWineriesHref', () => {
    it('sin nada es el listado y la página 1 no va en la URL', () => {
        expect(adminWineriesHref({})).toBe('/admin/bodegas');
        expect(adminWineriesHref({ page: 1 })).toBe('/admin/bodegas');
    });
    it('conserva página, región y búsqueda', () => {
        expect(adminWineriesHref({ page: 3, region: 'Jerez de la Frontera', q: 'lustau' })).toBe(
            '/admin/bodegas?pagina=3&region=Jerez+de+la+Frontera&q=lustau',
        );
    });
});

describe('filtros', () => {
    it('hasAdminWineryFilters', () => {
        expect(hasAdminWineryFilters({})).toBe(false);
        expect(hasAdminWineryFilters({ q: 'a' })).toBe(true);
        expect(hasAdminWineryFilters({ region: 'Ronda' })).toBe(true);
    });
    it('chips: región todas por defecto y búsqueda aparte', () => {
        expect(adminWineryFilterLabels({})).toEqual({ region: 'Región: todas' });
        expect(adminWineryFilterLabels({ region: 'Ronda', q: 'Jotrón' })).toEqual({
            region: 'Región: Ronda',
            search: 'Jotrón',
        });
    });
});

describe('adminWineriesRangeText', () => {
    const base = { page: 1, pageSize: 10, shown: 10, total: 34, overall: 34, filtered: false };
    it('rango con guion largo y sustantivo', () => {
        expect(adminWineriesRangeText(base)).toBe('Mostrando 1–10 de 34 bodegas');
        expect(adminWineriesRangeText({ ...base, page: 4, shown: 4 })).toBe(
            'Mostrando 31–34 de 34 bodegas',
        );
        expect(adminWineriesRangeText({ ...base, shown: 1, total: 1, overall: 1 })).toBe(
            'Mostrando 1–1 de 1 bodega',
        );
    });
    it('filtrado y vacío', () => {
        expect(adminWineriesRangeText({ ...base, shown: 1, total: 1, filtered: true })).toBe(
            'Mostrando 1 bodega filtrada de 34',
        );
        expect(adminWineriesRangeText({ ...base, shown: 3, total: 3, filtered: true })).toBe(
            'Mostrando 3 bodegas filtradas de 34',
        );
        expect(adminWineriesRangeText({ ...base, shown: 0, total: 0 })).toBe('Mostrando 0 de 0');
    });
});

describe('ids y rutas', () => {
    it('WIN-001', () => {
        expect(wineryNumber(1)).toBe('WIN-001');
        expect(wineryNumber(1234)).toBe('WIN-1234');
        expect(wineryHref(7)).toBe('/admin/bodegas/7');
    });
});

describe('SPANISH_PROVINCES', () => {
    it('52 provincias distintas por orden alfabético', () => {
        expect(SPANISH_PROVINCES).toHaveLength(52);
        expect(new Set(SPANISH_PROVINCES).size).toBe(52);
        expect(SPANISH_PROVINCES).toContain('Málaga');
        expect(SPANISH_PROVINCES[0]).toBe('A Coruña');
    });
});
