import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTransferDetails } from './transfer';

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('getTransferDetails', () => {
    it('devuelve el titular y el IBAN del entorno, sin espacios en los extremos', () => {
        vi.stubEnv('BANK_TRANSFER_HOLDER', ' Titular de prueba ');
        vi.stubEnv('BANK_TRANSFER_IBAN', 'ES00 0000 0000 0000 0000 0000');
        expect(getTransferDetails()).toEqual({
            holder: 'Titular de prueba',
            iban: 'ES00 0000 0000 0000 0000 0000',
        });
    });

    it.each([
        ['falta el titular', undefined, 'ES00'],
        ['falta el IBAN', 'Titular', undefined],
        ['el titular está vacío', '  ', 'ES00'],
        ['faltan los dos', undefined, undefined],
    ])('devuelve null si %s', (_, holder, iban) => {
        vi.stubEnv('BANK_TRANSFER_HOLDER', holder);
        vi.stubEnv('BANK_TRANSFER_IBAN', iban);
        expect(getTransferDetails()).toBeNull();
    });
});
