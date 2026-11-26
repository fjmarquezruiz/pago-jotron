import { describe, expect, it } from 'vitest';
import {
    canDeactivateShipping,
    shippingDeliveryText,
    shippingPriceText,
    shippingStatusLabel,
    shippingTypeNumber,
} from './shipping-types';

describe('tipos de envío: textos', () => {
    it('shippingTypeNumber', () => expect(shippingTypeNumber(1)).toBe('ENV-001'));
    it('shippingStatusLabel', () => {
        expect(shippingStatusLabel(false)).toBe('Activo');
        expect(shippingStatusLabel(true)).toBe('Bloqueado');
    });
    it('shippingDeliveryText', () => {
        expect(shippingDeliveryText(3, 5)).toBe('3-5 días laborables');
        expect(shippingDeliveryText(1, 1)).toBe('1 día laborable');
        expect(shippingDeliveryText(null, null)).toBe('—');
    });
    it('shippingPriceText', () => expect(shippingPriceText('4.95')).toMatch(/^4,95\s€$/));
});

describe('canDeactivateShipping', () => {
    it('no deja desactivar el último activo', () => expect(canDeactivateShipping(0)).toBe(false));
    it('deja si queda otro activo', () => {
        expect(canDeactivateShipping(1)).toBe(true);
        expect(canDeactivateShipping(3)).toBe(true);
    });
});
