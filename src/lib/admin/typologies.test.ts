import { describe, expect, it } from 'vitest';
import {
    adminTypologiesHref,
    adminTypologiesRangeText,
    adminTypologyFilterLabels,
    canDeleteTypology,
    formatTaxRate,
    hasAdminTypologyFilters,
    typologyNumber,
} from './typologies';
import { parseAdminTypologyParams, typologySchema } from '@/lib/validations/admin-typologies';

describe('tipologías: enlaces, etiquetas y textos', () => {
    it('typologyNumber', () => expect(typologyNumber(7)).toBe('TIP-007'));
    it('adminTypologiesHref', () => {
        expect(adminTypologiesHref({})).toBe('/admin/tipologias');
        expect(adminTypologiesHref({ productType: 'Pasas', q: 'pas' })).toBe(
            '/admin/tipologias?tipo=Pasas&q=pas',
        );
    });
    it('hasAdminTypologyFilters y chips', () => {
        expect(hasAdminTypologyFilters({})).toBe(false);
        expect(hasAdminTypologyFilters({ productType: 'Vino' })).toBe(true);
        expect(adminTypologyFilterLabels({})).toEqual({ productType: 'Tipo de producto: todos' });
        expect(adminTypologyFilterLabels({ productType: 'Pasas', q: 'x' })).toEqual({
            productType: 'Tipo de producto: pasas',
            search: 'x',
        });
    });
    it('adminTypologiesRangeText', () => {
        expect(adminTypologiesRangeText({ shown: 7, overall: 7, filtered: false })).toBe(
            'Mostrando 1–7 de 7 tipologías',
        );
        expect(adminTypologiesRangeText({ shown: 1, overall: 1, filtered: false })).toBe(
            'Mostrando 1–1 de 1 tipología',
        );
        expect(adminTypologiesRangeText({ shown: 2, overall: 7, filtered: true })).toBe(
            'Mostrando 2 tipologías filtradas de 7',
        );
        expect(adminTypologiesRangeText({ shown: 0, overall: 7, filtered: true })).toBe(
            'Mostrando 0 de 0',
        );
    });
});

describe('formatTaxRate', () => {
    it.each([
        ['21.00', '21 %'],
        ['10.00', '10 %'],
        ['7.50', '7,5 %'],
        ['4.25', '4,25 %'],
        ['0.00', '0 %'],
    ])('%s -> %s', (value, text) => expect(formatTaxRate(value)).toBe(text));
});

describe('canDeleteTypology', () => {
    it('solo se borra si ningún producto la usa', () => {
        expect(canDeleteTypology(0)).toBe(true);
        expect(canDeleteTypology(3)).toBe(false);
    });
});

describe('parseAdminTypologyParams', () => {
    it('lee tipo y búsqueda; ignora lo inválido', () => {
        expect(parseAdminTypologyParams({ tipo: 'Pasas', q: ' pas ' })).toEqual({
            productType: 'Pasas',
            q: 'pas',
        });
        expect(parseAdminTypologyParams({ tipo: 'Queso', q: ['a', 'b'] })).toEqual({});
    });
});

describe('typologySchema', () => {
    const ok = { name: ' Tinto ', productType: 'Vino', filterOrder: 1, taxRate: 21 };
    it('acepta un cuerpo válido y recorta el nombre', () => {
        expect(typologySchema.parse(ok)).toEqual({ ...ok, name: 'Tinto' });
        expect(typologySchema.safeParse({ ...ok, taxRate: 7.5 }).success).toBe(true);
        expect(typologySchema.safeParse({ ...ok, taxRate: 0, filterOrder: 0 }).success).toBe(true);
    });
    it.each([
        ['nombre vacío', { name: ' ' }],
        ['nombre de más de 50', { name: 'a'.repeat(51) }],
        ['tipo que no existe', { productType: 'Queso' }],
        ['orden decimal', { filterOrder: 1.5 }],
        ['orden negativo', { filterOrder: -1 }],
        ['orden NaN', { filterOrder: Number.NaN }],
        ['IVA negativo', { taxRate: -1 }],
        ['IVA superior a 100', { taxRate: 100.01 }],
        ['IVA con tres decimales', { taxRate: 10.123 }],
        ['IVA NaN', { taxRate: Number.NaN }],
        ['IVA como texto', { taxRate: '21' }],
        ['campo de más', { id: 3 }],
    ])('rechaza %s', (_, patch) => {
        expect(typologySchema.safeParse({ ...ok, ...patch }).success).toBe(false);
    });
    it('los mensajes están en español', () => {
        const result = typologySchema.safeParse({ ...ok, taxRate: Number.NaN, name: '' });
        if (result.success) throw new Error('debía fallar');
        const { fieldErrors } = result.error.flatten();
        expect(fieldErrors.name?.[0]).toBe('Escribe el nombre de la tipología');
        expect(fieldErrors.taxRate?.[0]).toBe('Indica el IVA');
    });
});
