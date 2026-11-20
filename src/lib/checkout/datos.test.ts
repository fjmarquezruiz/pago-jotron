import { describe, expect, it } from 'vitest';
import {
    apiFieldErrors,
    contactDefaults,
    contactUnchanged,
    resolveBillingAddressId,
    resolveShippingAddressId,
    resolveShippingTypeId,
    selectionProblems,
    type AddressRef,
    type SelectionInput,
} from '@/lib/checkout/datos';
import { DATOS_FORM_DEFAULTS } from '@/lib/validations/checkout-form';

const standard = {
    id: 1,
    name: 'Envío estándar',
    cost: '4.95',
    minDeliveryDays: 3,
    maxDeliveryDays: 5,
};
const express = {
    id: 2,
    name: 'Envío exprés 24 h',
    cost: '9.95',
    minDeliveryDays: 1,
    maxDeliveryDays: 1,
};

const ship: AddressRef = { id: 10, addressType: 'Envío' };
const ship2: AddressRef = { id: 11, addressType: 'Envío' };
const bill: AddressRef = { id: 20, addressType: 'Facturación' };

describe('resolveShippingTypeId', () => {
    it('elige la más barata si no hay nada guardado', () => {
        expect(resolveShippingTypeId([express, standard], null)).toBe(1);
    });
    it('respeta lo guardado si se sigue ofreciendo', () => {
        expect(resolveShippingTypeId([standard, express], 2)).toBe(2);
    });
    it('vuelve a la más barata si lo guardado ya no existe', () => {
        expect(resolveShippingTypeId([standard, express], 99)).toBe(1);
    });
    it('devuelve null sin modalidades', () => {
        expect(resolveShippingTypeId([], 1)).toBeNull();
    });
});

describe('resolveShippingAddressId', () => {
    it('conserva la guardada aunque sea de Facturación', () => {
        expect(resolveShippingAddressId([ship, bill], 20)).toBe(20);
    });
    it('elige la primera de Envío', () => {
        expect(resolveShippingAddressId([bill, ship, ship2], null)).toBe(10);
    });
    it('no preselecciona una de Facturación', () => {
        expect(resolveShippingAddressId([bill], null)).toBeNull();
    });
    it('ignora una guardada que ya no existe', () => {
        expect(resolveShippingAddressId([ship], 99)).toBe(10);
    });
});

describe('resolveBillingAddressId', () => {
    it('solo acepta direcciones de Facturación', () => {
        expect(resolveBillingAddressId([ship, bill], 10)).toBe(20);
        expect(resolveBillingAddressId([ship, bill], 20)).toBe(20);
    });
    it('devuelve null si no hay ninguna', () => {
        expect(resolveBillingAddressId([ship], null)).toBeNull();
    });
});

describe('selectionProblems', () => {
    const ok: SelectionInput = {
        adding: false,
        newAddressType: 'Envío',
        addresses: [ship, bill],
        shippingTypeId: 1,
        hasShippingOptions: true,
        shippingAddressId: 10,
        billingSameAsShipping: true,
        billingAddressId: null,
    };

    it('no da problemas con todo elegido', () => {
        expect(selectionProblems(ok)).toEqual({});
    });
    it('pide modalidad de envío, o avisa de que no hay ninguna', () => {
        expect(selectionProblems({ ...ok, shippingTypeId: null }).shippingType).toBe(
            'Elige un tipo de envío.',
        );
        expect(
            selectionProblems({ ...ok, shippingTypeId: null, hasShippingOptions: false })
                .shippingType,
        ).toBe('Ahora mismo no hay ningún tipo de envío disponible.');
    });
    it('pide dirección de envío si no hay ninguna elegida', () => {
        expect(selectionProblems({ ...ok, shippingAddressId: null }).shippingAddress).toBeDefined();
        expect(selectionProblems({ ...ok, shippingAddressId: 99 }).shippingAddress).toBeDefined();
    });
    it('la dirección nueva de Envío vale como dirección de envío', () => {
        expect(
            selectionProblems({ ...ok, addresses: [], shippingAddressId: null, adding: true }),
        ).toEqual({});
    });
    it('una dirección nueva de Facturación no vale como envío', () => {
        expect(
            selectionProblems({
                ...ok,
                addresses: [],
                shippingAddressId: null,
                adding: true,
                newAddressType: 'Facturación',
            }).shippingAddress,
        ).toBeDefined();
    });
    it('sin direcciones de Facturación y casilla desmarcada, explica que hay que añadir una', () => {
        expect(
            selectionProblems({ ...ok, billingSameAsShipping: false, addresses: [ship] })
                .billingAddress,
        ).toBe(
            'No tienes ninguna dirección de facturación. Añade una nueva con el tipo «Facturación».',
        );
    });
    it('con facturaciones pero ninguna elegida, pide elegir', () => {
        expect(
            selectionProblems({ ...ok, billingSameAsShipping: false, billingAddressId: null })
                .billingAddress,
        ).toBe('Elige una dirección de facturación.');
    });
    it('la facturación nueva del formulario cubre la casilla desmarcada', () => {
        expect(
            selectionProblems({
                ...ok,
                addresses: [ship],
                billingSameAsShipping: false,
                adding: true,
                newAddressType: 'Facturación',
            }),
        ).toEqual({});
    });
    it('con la casilla marcada no pide facturación', () => {
        expect(selectionProblems({ ...ok, addresses: [ship] })).toEqual({});
    });
});

describe('contactUnchanged y contactDefaults', () => {
    const profile = { name: 'Juan', lastName: 'Moreno', phone: '600000000', idCard: null };
    it('detecta que no hay cambios', () => {
        expect(contactUnchanged(profile, { ...profile, phone: '600000000', idCard: null })).toBe(
            true,
        );
    });
    it('detecta un cambio en cualquier campo', () => {
        expect(contactUnchanged(profile, { ...profile, idCard: 'B12345678' })).toBe(false);
        expect(contactUnchanged(profile, { ...profile, phone: '611222333', idCard: null })).toBe(
            false,
        );
    });
    it('precarga el contacto y deja vacío lo que no está guardado', () => {
        expect(contactDefaults({ ...profile, phone: null }, DATOS_FORM_DEFAULTS)).toMatchObject({
            name: 'Juan',
            lastName: 'Moreno',
            phone: '',
            idCard: '',
            country: 'España',
        });
    });
});

describe('apiFieldErrors', () => {
    it('toma el primer mensaje de cada campo conocido', () => {
        expect(
            apiFieldErrors(
                { phone: ['Mal', 'Peor'], idCard: ['NIF mal'], otro: ['x'] },
                { phone: 'phone', idCard: 'idCard' },
            ),
        ).toEqual({ phone: 'Mal', idCard: 'NIF mal' });
    });
    it('devuelve vacío si no es un objeto', () => {
        expect(apiFieldErrors(undefined, { phone: 'phone' })).toEqual({});
        expect(apiFieldErrors({ phone: 'no es array' }, { phone: 'phone' })).toEqual({});
    });
});
