import { describe, expect, it } from 'vitest';
import { createAddressRequestSchema } from '@/lib/validations/address';
import {
    DATOS_FORM_DEFAULTS,
    toAddressRequest,
    validateDatosForm,
    type DatosFormValues,
} from '@/lib/validations/checkout-form';

const contact = { name: 'Juan', lastName: 'Moreno', phone: '600 000 000', idCard: '' };
const address = {
    streetType: 'Calle',
    streetName: 'de Alcalá',
    number: '12',
    floor: '',
    postalCode: '28014',
    city: 'Madrid',
    addressPhone: '+34 611 222 333',
};
const valid: DatosFormValues = { ...DATOS_FORM_DEFAULTS, ...contact, ...address };

describe('validateDatosForm', () => {
    it('acepta solo el contacto con el formulario de dirección cerrado, aunque esté vacío', () => {
        const result = validateDatosForm({ ...DATOS_FORM_DEFAULTS, ...contact }, { adding: false });
        expect(result).toEqual({
            success: true,
            contact: { name: 'Juan', lastName: 'Moreno', phone: '600000000', idCard: null },
            address: null,
        });
    });

    it('normaliza el NIF y devuelve la dirección validada con el formulario abierto', () => {
        const result = validateDatosForm({ ...valid, idCard: ' b12345678 ' }, { adding: true });
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.contact.idCard).toBe('B12345678');
        expect(result.address).toMatchObject({ addressPhone: '611222333', addressType: 'Envío' });
    });

    it('da un mensaje en español por cada campo de contacto que falla', () => {
        const result = validateDatosForm(DATOS_FORM_DEFAULTS, { adding: false });
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(Object.keys(result.errors).sort()).toEqual(['lastName', 'name', 'phone']);
        expect(result.errors.phone).toBe('Introduce un teléfono español de 9 dígitos');
    });

    it('no valida la dirección con el formulario cerrado', () => {
        const result = validateDatosForm(
            { ...valid, postalCode: 'xx', city: '' },
            { adding: false },
        );
        expect(result.success).toBe(true);
    });

    it('valida la dirección con el formulario abierto, campo a campo', () => {
        const result = validateDatosForm(
            { ...DATOS_FORM_DEFAULTS, ...contact, postalCode: '99999' },
            { adding: true },
        );
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors).toMatchObject({
            streetType: 'Elige un tipo de vía',
            streetName: 'Escribe el nombre de la vía',
            number: 'Escribe el número',
            city: 'Escribe la ciudad',
            postalCode:
                'El código postal no corresponde a ninguna provincia (empieza entre 01 y 52)',
        });
        expect(result.errors.addressPhone).toBeDefined();
        expect(result.errors).not.toHaveProperty('name');
    });

    it('rechaza un código postal que no tiene 5 dígitos', () => {
        const result = validateDatosForm({ ...valid, postalCode: '2801' }, { adding: true });
        expect(result.success).toBe(false);
        if (!result.success)
            expect(result.errors.postalCode).toBe('El código postal tiene 5 dígitos');
    });

    it('rechaza un país distinto de España y un tipo de dirección inventado', () => {
        const result = validateDatosForm(
            { ...valid, country: 'Francia', addressType: 'Otro' },
            { adding: true },
        );
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors.country).toBe('Solo enviamos a España');
            expect(result.errors.addressType).toBe('Elige un tipo de dirección');
        }
    });
});

describe('toAddressRequest', () => {
    it('genera un cuerpo que la API acepta, con el destinatario sacado del contacto', () => {
        const result = validateDatosForm({ ...valid, floor: '3º B' }, { adding: true });
        if (!result.success || !result.address) throw new Error('debería ser válido');
        const body = toAddressRequest(result.address, result.contact);
        expect(body).toMatchObject({
            recipientName: 'Juan Moreno',
            phone: '611222333',
            floor: '3º B',
        });
        const parsed = createAddressRequestSchema.safeParse(body);
        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.province).toBe('Madrid');
    });

    it('manda el piso vacío como null', () => {
        const result = validateDatosForm(valid, { adding: true });
        if (!result.success || !result.address) throw new Error('debería ser válido');
        expect(toAddressRequest(result.address, result.contact).floor).toBeNull();
    });
});
