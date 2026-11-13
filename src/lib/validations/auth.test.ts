import { describe, expect, it } from 'vitest';
import {
    ageGateFormSchema,
    ageGateSchema,
    registerFormSchema,
    registerSchema,
    toBirthDate,
    type RegisterFormInput,
    type RegisterInput,
} from './auth';

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

    it('rechaza una fecha de nacimiento que no existe', () => {
        const result = registerSchema.safeParse({ ...valid, birthDate: '1990-02-30' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('La fecha no existe');
    });

    it('rechaza fecha de nacimiento en formato incorrecto', () => {
        expect(registerSchema.safeParse({ ...valid, birthDate: '01-01-1990' }).success).toBe(false);
    });
});

describe('toBirthDate', () => {
    it('rellena con ceros el día y el mes', () => {
        expect(toBirthDate('5', '3', '1990')).toBe('1990-03-05');
    });
    it('respeta el día y el mes de dos cifras', () => {
        expect(toBirthDate('25', '12', '1990')).toBe('1990-12-25');
    });
});

describe('registerFormSchema', () => {
    const validForm: RegisterFormInput = {
        email: '  Ana@Example.com ',
        password: 'Password123',
        confirmPassword: 'Password123',
        birthDay: '15',
        birthMonth: '1',
        birthYear: '1990',
        acceptPrivacy: true,
    };

    /** Camino y mensaje de cada error que devuelve el esquema. */
    const issues = (input: RegisterFormInput) => {
        const result = registerFormSchema.safeParse(input);
        return result.success
            ? []
            : result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    };

    it('acepta un formulario válido y normaliza el email', () => {
        const result = registerFormSchema.safeParse(validForm);
        expect(result.success).toBe(true);
        expect(result.data?.email).toBe('ana@example.com');
    });

    it('rechaza contraseñas distintas en confirmPassword', () => {
        expect(issues({ ...validForm, confirmPassword: 'Password124' })).toEqual([
            { path: 'confirmPassword', message: 'Las contraseñas no coinciden' },
        ]);
    });

    it('rechaza una fecha imposible en birthDay', () => {
        expect(issues({ ...validForm, birthDay: '31', birthMonth: '4' })).toEqual([
            { path: 'birthDay', message: 'La fecha no existe' },
        ]);
    });

    it('rechaza el 29 de febrero de un año no bisiesto en birthDay', () => {
        expect(
            issues({ ...validForm, birthDay: '29', birthMonth: '2', birthYear: '2001' }),
        ).toEqual([{ path: 'birthDay', message: 'La fecha no existe' }]);
    });

    it('rechaza a un menor de edad en birthYear', () => {
        const minorYear = String(new Date().getFullYear() - 10);
        expect(issues({ ...validForm, birthYear: minorYear })).toEqual([
            {
                path: 'birthYear',
                message: 'Tienes que ser mayor de edad (18 años o más) para registrarte',
            },
        ]);
    });

    it('no valida la fecha mientras falte alguno de los tres desplegables', () => {
        expect(issues({ ...validForm, birthDay: '' })).toEqual([
            { path: 'birthDay', message: 'Elige el día' },
        ]);
    });
});

describe('ageGateFormSchema', () => {
    const issues = (input: { birthDay: string; birthMonth: string; birthYear: string }) => {
        const result = ageGateFormSchema.safeParse(input);
        return result.success
            ? []
            : result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    };

    it('acepta una fecha que existe', () => {
        expect(issues({ birthDay: '15', birthMonth: '1', birthYear: '1990' })).toEqual([]);
    });

    it('no trata la minoría de edad como error de campo', () => {
        const minorYear = String(new Date().getFullYear() - 10);
        expect(issues({ birthDay: '1', birthMonth: '1', birthYear: minorYear })).toEqual([]);
    });

    it('rechaza una fecha imposible en birthDay', () => {
        expect(issues({ birthDay: '31', birthMonth: '4', birthYear: '1990' })).toEqual([
            { path: 'birthDay', message: 'La fecha no existe' },
        ]);
    });

    it('pide los tres desplegables', () => {
        expect(issues({ birthDay: '', birthMonth: '', birthYear: '' })).toEqual([
            { path: 'birthDay', message: 'Elige el día' },
            { path: 'birthMonth', message: 'Elige el mes' },
            { path: 'birthYear', message: 'Elige el año' },
        ]);
    });
});

describe('ageGateSchema', () => {
    it('acepta una fecha AAAA-MM-DD real', () => {
        expect(ageGateSchema.safeParse({ birthDate: '1990-01-15' }).success).toBe(true);
    });

    it('rechaza una fecha que no existe', () => {
        const result = ageGateSchema.safeParse({ birthDate: '1990-02-30' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('La fecha no existe');
    });

    it('rechaza un formato que no es AAAA-MM-DD y un cuerpo sin fecha', () => {
        expect(ageGateSchema.safeParse({ birthDate: '15/01/1990' }).success).toBe(false);
        expect(ageGateSchema.safeParse({}).success).toBe(false);
    });
});
