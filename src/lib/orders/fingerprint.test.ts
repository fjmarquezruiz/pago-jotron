import { describe, expect, it } from 'vitest';
import { cartFingerprint, type FingerprintInput } from './fingerprint';

const base: FingerprintInput = {
    lines: [
        { variantId: 4, quantity: 2 },
        { variantId: 9, quantity: 1 },
    ],
    shippingTypeId: 1,
    totalCents: 3345,
};

describe('cartFingerprint', () => {
    it('son 64 caracteres hexadecimales', () => {
        expect(cartFingerprint(base)).toMatch(/^[0-9a-f]{64}$/);
    });

    it('es estable: el mismo carrito da la misma huella', () => {
        expect(cartFingerprint(base)).toBe(cartFingerprint(structuredClone(base)));
    });

    it('no depende del orden de las líneas', () => {
        expect(cartFingerprint({ ...base, lines: [...base.lines].reverse() })).toBe(
            cartFingerprint(base),
        );
    });

    it('no modifica las líneas que recibe', () => {
        const lines = [...base.lines].reverse();
        const copy = structuredClone(lines);
        cartFingerprint({ ...base, lines });
        expect(lines).toEqual(copy);
    });

    it.each([
        [
            'una cantidad',
            {
                lines: [
                    { variantId: 4, quantity: 3 },
                    { variantId: 9, quantity: 1 },
                ],
            },
        ],
        [
            'una presentación',
            {
                lines: [
                    { variantId: 5, quantity: 2 },
                    { variantId: 9, quantity: 1 },
                ],
            },
        ],
        ['una línea menos', { lines: [{ variantId: 4, quantity: 2 }] }],
        ['el tipo de envío', { shippingTypeId: 2 }],
        ['el total', { totalCents: 3346 }],
    ])('cambia si cambia %s', (_label, change) => {
        expect(cartFingerprint({ ...base, ...change })).not.toBe(cartFingerprint(base));
    });

    it('no confunde cantidades y presentaciones que juntas parecen lo mismo', () => {
        const a = cartFingerprint({ ...base, lines: [{ variantId: 1, quantity: 12 }] });
        const b = cartFingerprint({ ...base, lines: [{ variantId: 11, quantity: 2 }] });
        expect(a).not.toBe(b);
    });
});
