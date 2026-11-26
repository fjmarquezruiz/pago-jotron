import { describe, expect, it } from 'vitest';
import {
    adminGrapeFilterLabels,
    adminGrapesHref,
    adminGrapesRangeText,
    canDeleteGrape,
    grapeColorTone,
    grapeNumber,
    hasAdminGrapeFilters,
} from './grapes';
import { grapeSchema, parseAdminGrapeParams } from '@/lib/validations/admin-grapes';

describe('uvas: enlaces, etiquetas y textos', () => {
    it('grapeNumber', () => {
        expect(grapeNumber(1)).toBe('GRP-001');
        expect(grapeNumber(1234)).toBe('GRP-1234');
    });
    it('grapeColorTone', () => {
        expect(grapeColorTone('Tinta')).toBe('wine-red');
        expect(grapeColorTone('Blanca')).toBe('wine-white');
        expect(grapeColorTone('Rosada')).toBe('wine-rose');
    });
    it('adminGrapesHref conserva filtros y omite la página 1', () => {
        expect(adminGrapesHref({})).toBe('/admin/uvas');
        expect(adminGrapesHref({ page: 1 })).toBe('/admin/uvas');
        expect(adminGrapesHref({ page: 3, color: 'Tinta', q: 'tem' })).toBe(
            '/admin/uvas?pagina=3&color=Tinta&q=tem',
        );
    });
    it('hasAdminGrapeFilters y chips', () => {
        expect(hasAdminGrapeFilters({})).toBe(false);
        expect(hasAdminGrapeFilters({ q: 'a' })).toBe(true);
        expect(adminGrapeFilterLabels({})).toEqual({ color: 'Color: todas' });
        expect(adminGrapeFilterLabels({ color: 'Blanca', q: 'pal' })).toEqual({
            color: 'Color: blanca',
            search: 'pal',
        });
    });
    it('adminGrapesRangeText', () => {
        const base = { page: 1, pageSize: 10, shown: 10, total: 30, overall: 30, filtered: false };
        expect(adminGrapesRangeText(base)).toBe('Mostrando 1–10 de 30 variedades de uva');
        expect(adminGrapesRangeText({ ...base, page: 3, shown: 10 })).toBe(
            'Mostrando 21–30 de 30 variedades de uva',
        );
        expect(adminGrapesRangeText({ ...base, shown: 1, total: 1, overall: 1 })).toBe(
            'Mostrando 1–1 de 1 variedad de uva',
        );
        expect(adminGrapesRangeText({ ...base, shown: 3, total: 3, filtered: true })).toBe(
            'Mostrando 3 variedades filtradas de 30',
        );
        expect(adminGrapesRangeText({ ...base, shown: 1, total: 1, filtered: true })).toBe(
            'Mostrando 1 variedad filtrada de 30',
        );
        expect(adminGrapesRangeText({ ...base, shown: 0, total: 0 })).toBe('Mostrando 0 de 0');
    });
});

describe('canDeleteGrape', () => {
    it('solo se borra si ningún vino la usa', () => {
        expect(canDeleteGrape(0)).toBe(true);
        expect(canDeleteGrape(1)).toBe(false);
        expect(canDeleteGrape(48)).toBe(false);
    });
});

describe('parseAdminGrapeParams', () => {
    it('lee página, color y búsqueda', () => {
        expect(parseAdminGrapeParams({ pagina: '2', color: 'Tinta', q: ' tem ' })).toEqual({
            page: 2,
            color: 'Tinta',
            q: 'tem',
        });
    });
    it('ignora lo que no es válido', () => {
        expect(parseAdminGrapeParams({ pagina: '0', color: 'Verde', q: ['a', 'b'] })).toEqual({
            page: 1,
        });
        expect(parseAdminGrapeParams({ pagina: '1e3', q: '   ' })).toEqual({ page: 1 });
    });
});

describe('grapeSchema', () => {
    it('acepta nombre y color y recorta el nombre', () => {
        expect(grapeSchema.parse({ name: '  Romé ', color: 'Tinta' })).toEqual({
            name: 'Romé',
            color: 'Tinta',
        });
    });
    it.each([
        ['nombre vacío', { name: '   ', color: 'Tinta' }],
        ['nombre de más de 100', { name: 'a'.repeat(101), color: 'Tinta' }],
        ['color que no existe', { name: 'Romé', color: 'Verde' }],
        ['sin color', { name: 'Romé' }],
        ['campo de más', { name: 'Romé', color: 'Tinta', id: 1 }],
    ])('rechaza %s', (_, body) => {
        expect(grapeSchema.safeParse(body).success).toBe(false);
    });
    it('los mensajes están en español', () => {
        const result = grapeSchema.safeParse({ name: '', color: undefined });
        expect(result.success).toBe(false);
        if (!result.success) {
            const { fieldErrors } = result.error.flatten();
            expect(fieldErrors.name?.[0]).toBe('Escribe el nombre de la variedad');
            expect(fieldErrors.color?.[0]).toBe('Elige el color');
        }
    });
});
