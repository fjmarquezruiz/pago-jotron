import { describe, expect, it } from 'vitest';
import {
    EMPTY_WINERY_FORM,
    parseAdminWineryParams,
    wineryBlockSchema,
    wineryFormSchema,
} from './admin-wineries';

describe('parseAdminWineryParams', () => {
    it('lee página, región y búsqueda', () => {
        expect(parseAdminWineryParams({ pagina: '2', region: ' Ronda ', q: 'lus' })).toEqual({
            page: 2,
            region: 'Ronda',
            q: 'lus',
        });
    });
    it('ignora lo que no vale', () => {
        expect(parseAdminWineryParams({ pagina: '0', region: '', q: ['a', 'b'] })).toEqual({
            page: 1,
        });
        expect(parseAdminWineryParams({ pagina: '99999' })).toEqual({ page: 1 });
        expect(parseAdminWineryParams({ q: 'x'.repeat(101) })).toEqual({ page: 1 });
    });
});

describe('wineryFormSchema', () => {
    it('solo el nombre es obligatorio; vacío es null y el país es España', () => {
        const parsed = wineryFormSchema.parse({
            ...EMPTY_WINERY_FORM,
            name: '  Lustau  ',
            country: '',
        });
        expect(parsed).toEqual({
            name: 'Lustau',
            description: null,
            address: null,
            city: null,
            province: null,
            country: 'España',
            phone: null,
            email: null,
            website: null,
        });
    });
    it('rechaza el nombre vacío o de más de 100', () => {
        expect(wineryFormSchema.safeParse(EMPTY_WINERY_FORM).success).toBe(false);
        expect(
            wineryFormSchema.safeParse({ ...EMPTY_WINERY_FORM, name: 'x'.repeat(101) }).success,
        ).toBe(false);
    });
    it('normaliza el teléfono a +34 y 9 dígitos y rechaza los que no lo son', () => {
        const ok = (phone: string) =>
            wineryFormSchema.parse({ ...EMPTY_WINERY_FORM, name: 'A', phone }).phone;
        expect(ok('+34 952 000 000')).toBe('+34952000000');
        expect(ok('952000000')).toBe('+34952000000');
        expect(ok('')).toBeNull();
        expect(
            wineryFormSchema.safeParse({ ...EMPTY_WINERY_FORM, name: 'A', phone: '123' }).success,
        ).toBe(false);
    });
    it('valida correo y sitio web si vienen', () => {
        const base = { ...EMPTY_WINERY_FORM, name: 'A' };
        expect(
            wineryFormSchema.safeParse({ ...base, email: 'info@x.es', website: 'https://x.es' })
                .success,
        ).toBe(true);
        expect(wineryFormSchema.safeParse({ ...base, email: 'no' }).success).toBe(false);
        expect(wineryFormSchema.safeParse({ ...base, website: 'x.es' }).success).toBe(false);
        expect(
            wineryFormSchema.safeParse({ ...base, website: 'javascript:alert(1)' }).success,
        ).toBe(false);
    });
    it('no admite campos que no existen (ni is_blocked)', () => {
        expect(
            wineryFormSchema.safeParse({ ...EMPTY_WINERY_FORM, name: 'A', isBlocked: true })
                .success,
        ).toBe(false);
    });
});

describe('wineryFormSchema es idempotente', () => {
    it('lo que sale (nulls) vuelve a entrar: el cliente envía la salida y el servidor la revalida', () => {
        const once = wineryFormSchema.parse({
            ...EMPTY_WINERY_FORM,
            name: 'A',
            phone: '+34 952000000',
        });
        expect(wineryFormSchema.parse(once)).toEqual(once);
        expect(wineryFormSchema.parse({ name: 'A' })).toEqual(once && { ...once, phone: null });
    });
});

describe('wineryBlockSchema', () => {
    it('pide un booleano y nada más', () => {
        expect(wineryBlockSchema.safeParse({ isBlocked: true }).success).toBe(true);
        expect(wineryBlockSchema.safeParse({ isBlocked: 'si' }).success).toBe(false);
        expect(wineryBlockSchema.safeParse({}).success).toBe(false);
        expect(wineryBlockSchema.safeParse({ isBlocked: true, name: 'x' }).success).toBe(false);
    });
});
