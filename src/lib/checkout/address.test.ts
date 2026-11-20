import { describe, expect, it } from 'vitest';
import { formatCityLine, formatDeliveryAddress, formatPhone, formatStreetLine } from './address';

const base = {
    streetType: 'Calle' as const,
    streetName: 'de Alcalá',
    number: '12',
    floor: null,
    postalCode: '28014',
    city: 'Madrid',
    country: 'España',
};

describe('formatPhone', () => {
    it('agrupa los 9 dígitos con el prefijo', () => {
        expect(formatPhone('600000000')).toBe('+34 600 000 000');
    });

    it('deja tal cual lo que no son 9 dígitos', () => {
        expect(formatPhone('12345')).toBe('12345');
        expect(formatPhone('+34600000000')).toBe('+34600000000');
    });
});

describe('formatStreetLine', () => {
    it('tipo de vía, nombre y número', () => {
        expect(formatStreetLine(base)).toBe('Calle de Alcalá, 12');
    });

    it('añade el piso si lo hay', () => {
        expect(formatStreetLine({ ...base, floor: '3º B' })).toBe('Calle de Alcalá, 12, 3º B');
    });
});

describe('formatCityLine', () => {
    it('localidad y código postal', () => {
        expect(formatCityLine(base)).toBe('Madrid, 28014');
    });
});

describe('formatDeliveryAddress', () => {
    it('calle con número y código postal con localidad y país', () => {
        expect(formatDeliveryAddress({ ...base, floor: '4B' })).toEqual({
            street: 'Calle de Alcalá 12, 4B',
            locality: '28014 Madrid, España',
        });
    });

    it('sin piso no deja coma', () => {
        expect(formatDeliveryAddress(base).street).toBe('Calle de Alcalá 12');
    });
});
