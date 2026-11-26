import { describe, expect, it } from 'vitest';
import {
    EMPTY_DENOMINATION_FORM,
    denominationBlockSchema,
    denominationFormSchema,
    parseAdminDenominationParams,
    parseRelatedPage,
} from './admin-denominations';

describe('parseAdminDenominationParams y parseRelatedPage', () => {
    it('lee página, región y búsqueda e ignora lo inválido', () => {
        expect(parseAdminDenominationParams({ pagina: '3', region: 'Cádiz', q: 'je' })).toEqual({
            page: 3,
            region: 'Cádiz',
            q: 'je',
        });
        expect(parseAdminDenominationParams({ pagina: 'x', q: ' ' })).toEqual({ page: 1 });
        expect(parseRelatedPage({ pagina: '2' })).toBe(2);
        expect(parseRelatedPage({ pagina: '-1' })).toBe(1);
    });
});

describe('denominationFormSchema', () => {
    const base = { ...EMPTY_DENOMINATION_FORM, name: 'Málaga', classification: 'DO' };
    it('nombre y clasificación obligatorios; el resto vacío es null', () => {
        expect(denominationFormSchema.parse(base)).toEqual({
            name: 'Málaga',
            foundedYear: null,
            classification: 'DO',
            regulatoryCouncil: null,
            region: null,
            website: null,
            description: null,
        });
        expect(denominationFormSchema.safeParse(EMPTY_DENOMINATION_FORM).success).toBe(false);
        expect(
            denominationFormSchema.safeParse({ ...base, classification: '' }).error?.issues[0]
                ?.message,
        ).toBe('Elige una clasificación');
        expect(denominationFormSchema.safeParse({ ...base, classification: 'XX' }).success).toBe(
            false,
        );
    });
    it('el año son cuatro cifras y no es futuro', () => {
        expect(denominationFormSchema.parse({ ...base, foundedYear: '1933' }).foundedYear).toBe(
            1933,
        );
        expect(denominationFormSchema.safeParse({ ...base, foundedYear: '33' }).success).toBe(
            false,
        );
        expect(denominationFormSchema.safeParse({ ...base, foundedYear: '9999' }).success).toBe(
            false,
        );
    });
    it('sitio web con http(s) y sin campos extra', () => {
        expect(denominationFormSchema.safeParse({ ...base, website: 'https://x.es' }).success).toBe(
            true,
        );
        expect(denominationFormSchema.safeParse({ ...base, website: 'x.es' }).success).toBe(false);
        expect(denominationFormSchema.safeParse({ ...base, isBlocked: true }).success).toBe(false);
    });
});

describe('denominationFormSchema es idempotente', () => {
    it('lo que sale (null y número) vuelve a entrar', () => {
        const once = denominationFormSchema.parse({
            ...EMPTY_DENOMINATION_FORM,
            name: 'A',
            classification: 'VT',
            foundedYear: '1933',
        });
        expect(denominationFormSchema.parse(once)).toEqual(once);
    });
});

describe('denominationBlockSchema', () => {
    it('pide un booleano y nada más', () => {
        expect(denominationBlockSchema.safeParse({ isBlocked: false }).success).toBe(true);
        expect(denominationBlockSchema.safeParse({ isBlocked: 0 }).success).toBe(false);
    });
});
