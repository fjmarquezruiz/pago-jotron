import { describe, expect, it } from 'vitest';
import { decimalOrNull, nameKey, splitKnownNames, textOrNull } from './product-sheet';

describe('splitKnownNames', () => {
    const existing = [
        { id: 1, name: 'Tintos' },
        { id: 2, name: 'Reserva' },
    ];
    it('separa las que existen (sin mirar mayúsculas) de las que hay que crear', () => {
        expect(splitKnownNames(['tintos', ' Ecológico ', 'RESERVA'], existing)).toEqual({
            known: [1, 2],
            toCreate: ['Ecológico'],
        });
    });
    it('no repite nombres', () => {
        expect(splitKnownNames(['Nuevo', 'nuevo', 'Tintos', 'tintos'], existing)).toEqual({
            known: [1],
            toCreate: ['Nuevo'],
        });
    });
    it('sin nombres no hay nada', () => {
        expect(splitKnownNames([], existing)).toEqual({ known: [], toCreate: [] });
    });
});

describe('textOrNull / decimalOrNull / nameKey', () => {
    it('un texto vacío es NULL y el resto va recortado', () => {
        expect(textOrNull('  ')).toBeNull();
        expect(textOrNull(' roble ')).toBe('roble');
    });
    it('un decimal sale con dos decimales y null es NULL', () => {
        expect(decimalOrNull(14.5)).toBe('14.50');
        expect(decimalOrNull(0)).toBe('0.00');
        expect(decimalOrNull(null)).toBeNull();
    });
    it('la clave ignora mayúsculas y espacios de los extremos', () => {
        expect(nameKey(' Tinto ')).toBe('tinto');
    });
});
