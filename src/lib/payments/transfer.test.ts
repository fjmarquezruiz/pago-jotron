import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTransferDetails, isTransferEnabled } from './transfer';

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('isTransferEnabled', () => {
    it('solo está activa con BANK_TRANSFER_ENABLED=true', () => {
        vi.stubEnv('BANK_TRANSFER_ENABLED', 'true');
        expect(isTransferEnabled()).toBe(true);
        vi.stubEnv('BANK_TRANSFER_ENABLED', ' true ');
        expect(isTransferEnabled()).toBe(true);
    });

    it.each([undefined, '', 'false', '1', 'TRUE', 'yes'])('con %j está apagada', (value) => {
        vi.stubEnv('BANK_TRANSFER_ENABLED', value);
        expect(isTransferEnabled()).toBe(false);
    });
});

describe('getTransferDetails', () => {
    it('con la transferencia apagada devuelve null aunque estén los datos', () => {
        vi.stubEnv('BANK_TRANSFER_ENABLED', undefined);
        vi.stubEnv('BANK_TRANSFER_HOLDER', 'Titular de prueba');
        vi.stubEnv('BANK_TRANSFER_IBAN', 'ES00 0000 0000 0000 0000 0000');
        expect(getTransferDetails()).toBeNull();
    });

    it('devuelve el titular y el IBAN del entorno, sin espacios en los extremos', () => {
        vi.stubEnv('BANK_TRANSFER_ENABLED', 'true');
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
        vi.stubEnv('BANK_TRANSFER_ENABLED', 'true');
        vi.stubEnv('BANK_TRANSFER_HOLDER', holder);
        vi.stubEnv('BANK_TRANSFER_IBAN', iban);
        expect(getTransferDetails()).toBeNull();
    });
});
