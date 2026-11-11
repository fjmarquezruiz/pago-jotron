import { describe, expect, it } from 'vitest';
import { registerSchema, type RegisterInput } from './auth';

const valid: RegisterInput = {
    email: '  Ana@Example.com ',
    password: 'Password123',
    birthDate: '1990-01-01',
    acceptPrivacy: true,
};

describe('registerSchema', () => {
    it('acepta datos válidos y normaliza el email', () => {
        const result = registerSchema.safeParse(valid);
        expect(result.success).toBe(true);
        expect(result.data?.email).toBe('ana@example.com');
    });

    it('rechaza a un menor de edad', () => {
        expect(registerSchema.safeParse({ ...valid, birthDate: '2015-01-01' }).success).toBe(false);
    });

    it('rechaza contraseña sin número', () => {
        expect(registerSchema.safeParse({ ...valid, password: 'ABcdefgh' }).success).toBe(false);
    });

    it('rechaza politica de privacidad no aceptada', () => {
        expect(registerSchema.safeParse({ ...valid, acceptPrivacy: false }).success).toBe(false);
    });

    it('rechaza email inválido', () => {
        expect(registerSchema.safeParse({ ...valid, email: 'invalid-email' }).success).toBe(false);
    });

    it('rechaza contraseña demasiado corta', () => {
        expect(registerSchema.safeParse({ ...valid, password: 'Ab1' }).success).toBe(false);
    });

    it('rechaza contraseña sin mayúscula', () => {
        expect(registerSchema.safeParse({ ...valid, password: 'password123' }).success).toBe(false);
    });

    it('rechaza contraseña sin minúscula', () => {
        expect(registerSchema.safeParse({ ...valid, password: 'PASSWORD123' }).success).toBe(false);
    });

    it('rechaza fecha de nacimiento en formato incorrecto', () => {
        expect(registerSchema.safeParse({ ...valid, birthDate: '01-01-1990' }).success).toBe(false);
    });
});
