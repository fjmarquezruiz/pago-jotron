import { describe, expect, it } from 'vitest';
import {
    addressesResponseSchema,
    persistedCheckoutSchema,
    profileResponseSchema,
} from './checkout-state';

describe('persistedCheckoutSchema', () => {
    it('acepta un estado completo', () => {
        const state = {
            shippingTypeId: 2,
            shippingAddressId: 7,
            billingSameAsShipping: false,
            billingAddressId: 9,
        };
        expect(persistedCheckoutSchema.parse(state)).toEqual(state);
    });

    it('completa lo que falta con los valores de partida', () => {
        expect(persistedCheckoutSchema.parse({})).toEqual({
            shippingTypeId: null,
            shippingAddressId: null,
            billingSameAsShipping: true,
            billingAddressId: null,
        });
    });

    it('un id no válido pasa a null y un booleano no válido a true', () => {
        expect(
            persistedCheckoutSchema.parse({
                shippingTypeId: 0,
                shippingAddressId: 2_147_483_648,
                billingSameAsShipping: 'sí',
                billingAddressId: 1.5,
            }),
        ).toEqual({
            shippingTypeId: null,
            shippingAddressId: null,
            billingSameAsShipping: true,
            billingAddressId: null,
        });
    });

    it('rechaza lo que no es un objeto', () => {
        expect(persistedCheckoutSchema.safeParse('hola').success).toBe(false);
        expect(persistedCheckoutSchema.safeParse(null).success).toBe(false);
    });
});

describe('profileResponseSchema', () => {
    const profile = {
        name: 'Ana',
        lastName: 'García',
        email: 'ana@ejemplo.com',
        phone: null,
        idCard: null,
    };

    it('acepta el perfil con teléfono y CIF/NIF nulos', () => {
        expect(profileResponseSchema.parse({ profile })).toEqual({ profile });
    });

    it('rechaza un perfil sin correo', () => {
        expect(
            profileResponseSchema.safeParse({ profile: { ...profile, email: undefined } }).success,
        ).toBe(false);
    });
});

describe('addressesResponseSchema', () => {
    const address = {
        id: 3,
        recipientName: 'Ana García',
        phone: '600000000',
        streetType: 'Calle',
        streetName: 'de Alcalá',
        number: '12',
        floor: null,
        postalCode: '28014',
        city: 'Madrid',
        province: 'Madrid',
        country: 'España',
        addressType: 'Envío',
    };

    it('acepta una lista de direcciones, también vacía', () => {
        expect(addressesResponseSchema.parse({ addresses: [address] }).addresses).toHaveLength(1);
        expect(addressesResponseSchema.parse({ addresses: [] }).addresses).toEqual([]);
    });

    it('rechaza un tipo de dirección desconocido', () => {
        expect(
            addressesResponseSchema.safeParse({ addresses: [{ ...address, addressType: 'Otro' }] })
                .success,
        ).toBe(false);
    });
});
