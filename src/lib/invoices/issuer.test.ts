import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInvoiceIssuer } from './issuer';

const NAMES = ['INVOICE_ISSUER_NAME', 'INVOICE_ISSUER_TAX_ID', 'INVOICE_ISSUER_ADDRESS'] as const;

beforeEach(() => {
    vi.stubEnv('INVOICE_ISSUER_NAME', 'Bodegas Jotrón S.L.');
    vi.stubEnv('INVOICE_ISSUER_TAX_ID', 'B12345678');
    vi.stubEnv('INVOICE_ISSUER_ADDRESS', 'Calle Larios 1, 29005 Málaga');
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('getInvoiceIssuer', () => {
    it('lee nombre, NIF y domicilio del entorno', () => {
        expect(getInvoiceIssuer()).toEqual({
            name: 'Bodegas Jotrón S.L.',
            taxId: 'B12345678',
            address: 'Calle Larios 1, 29005 Málaga',
        });
    });

    it('recorta los espacios de los valores', () => {
        vi.stubEnv('INVOICE_ISSUER_NAME', '  Bodegas Jotrón S.L.  ');
        expect(getInvoiceIssuer().name).toBe('Bodegas Jotrón S.L.');
    });

    it.each(NAMES)('falla si falta %s, nombrándola', (name) => {
        vi.stubEnv(name, '');
        expect(() => getInvoiceIssuer()).toThrow(name);
    });

    it('un valor solo de espacios cuenta como que falta', () => {
        vi.stubEnv('INVOICE_ISSUER_TAX_ID', '   ');
        expect(() => getInvoiceIssuer()).toThrow('INVOICE_ISSUER_TAX_ID');
    });

    it('nombra todas las que faltan y nunca un valor', () => {
        vi.stubEnv('INVOICE_ISSUER_NAME', '');
        vi.stubEnv('INVOICE_ISSUER_ADDRESS', '');
        let message = '';
        try {
            getInvoiceIssuer();
        } catch (error) {
            message = (error as Error).message;
        }
        expect(message).toContain('INVOICE_ISSUER_NAME');
        expect(message).toContain('INVOICE_ISSUER_ADDRESS');
        expect(message).not.toContain('INVOICE_ISSUER_TAX_ID');
        expect(message).not.toContain('B12345678');
    });
});
