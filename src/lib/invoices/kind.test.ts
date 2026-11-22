import { describe, expect, it } from 'vitest';
import { invoiceKind, SIMPLIFIED_LIMIT_CENTS } from './kind';

describe('invoiceKind', () => {
    it('con NIF es completa, sea cual sea el importe', () => {
        expect(invoiceKind({ taxId: '12345678Z', totalCents: 500 })).toBe('Completa');
        expect(invoiceKind({ taxId: '12345678Z', totalCents: 100_000 })).toBe('Completa');
    });

    it('sin NIF y hasta 400 € es simplificada, con los 400 exactos incluidos', () => {
        expect(invoiceKind({ taxId: null, totalCents: 500 })).toBe('Simplificada');
        expect(invoiceKind({ taxId: null, totalCents: SIMPLIFIED_LIMIT_CENTS })).toBe(
            'Simplificada',
        );
    });

    it('sin NIF y por encima de 400 € es completa', () => {
        expect(invoiceKind({ taxId: null, totalCents: SIMPLIFIED_LIMIT_CENTS + 1 })).toBe(
            'Completa',
        );
    });

    it('un NIF vacío o de espacios cuenta como que no lo dio', () => {
        expect(invoiceKind({ taxId: '', totalCents: 1_000 })).toBe('Simplificada');
        expect(invoiceKind({ taxId: '   ', totalCents: 1_000 })).toBe('Simplificada');
    });
});
