import { describe, expect, it } from 'vitest';
import { profileSchema } from './profile';

const valid = { name: 'Ana', lastName: 'García López', phone: '600 12 34 56' };

describe('profileSchema', () => {
    it('acepta los datos mínimos y normaliza el teléfono', () => {
        expect(profileSchema.parse(valid)).toEqual({
            name: 'Ana',
            lastName: 'García López',
            phone: '600123456',
            idCard: null,
        });
    });

    it('recorta espacios del nombre y los apellidos', () => {
        const data = profileSchema.parse({ ...valid, name: '  Ana ', lastName: ' López  ' });
        expect(data.name).toBe('Ana');
        expect(data.lastName).toBe('López');
    });

    it.each([
        ['', 'El nombre es obligatorio'],
        ['   ', 'El nombre es obligatorio'],
        ['a'.repeat(101), 'El nombre admite como mucho 100 caracteres'],
    ])('rechaza el nombre %j', (name, message) => {
        const result = profileSchema.safeParse({ ...valid, name });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(message);
    });

    it('acepta un nombre de 100 caracteres', () => {
        expect(profileSchema.safeParse({ ...valid, name: 'a'.repeat(100) }).success).toBe(true);
    });

    it('exige los apellidos', () => {
        expect(profileSchema.safeParse({ ...valid, lastName: '' }).success).toBe(false);
        expect(profileSchema.safeParse({ name: 'Ana', phone: '600123456' }).success).toBe(false);
    });

    it.each(['+34 600123456', '0034600123456', '600-123-456', '911.234.567'])(
        'acepta el teléfono %s',
        (phone) => {
            const data = profileSchema.parse({ ...valid, phone });
            expect(data.phone).toMatch(/^[6-9]\d{8}$/);
        },
    );

    it.each(['', '12345', '500123456', 'abcdefghi', '+44 600123456'])(
        'rechaza el teléfono %j en español',
        (phone) => {
            const result = profileSchema.safeParse({ ...valid, phone });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe(
                'Introduce un teléfono español de 9 dígitos',
            );
        },
    );

    it('el NIF ausente, vacío, nulo o solo espacios queda en null', () => {
        for (const idCard of [undefined, '', '   ', null]) {
            expect(profileSchema.parse({ ...valid, idCard }).idCard).toBeNull();
        }
    });

    it('el NIF se recorta y pasa a mayúsculas', () => {
        expect(profileSchema.parse({ ...valid, idCard: ' 12345678z ' }).idCard).toBe('12345678Z');
    });

    it.each(['1234', 'a'.repeat(21), '1234-5678', 'ñ1234567', '1234 5678'])(
        'rechaza el NIF %j con un mensaje en español',
        (idCard) => {
            const result = profileSchema.safeParse({ ...valid, idCard });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toContain('NIF');
        },
    );

    it('acepta NIF de 5 y de 20 caracteres', () => {
        expect(profileSchema.safeParse({ ...valid, idCard: 'A1234' }).success).toBe(true);
        expect(profileSchema.safeParse({ ...valid, idCard: 'A'.repeat(20) }).success).toBe(true);
    });

    it('ignora el correo y cualquier otro campo', () => {
        const data = profileSchema.parse({ ...valid, email: 'otro@x.com', role: 'Administrador' });
        expect(data).not.toHaveProperty('email');
        expect(data).not.toHaveProperty('role');
    });
});
