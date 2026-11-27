import { describe, expect, it } from 'vitest';
import {
    formatOrderMoment,
    formatShortDate,
    formatStepDate,
    parseDbDate,
    shopDayEndUtc,
    shopDayStartUtc,
} from './dates';

describe('fechas del pedido', () => {
    it('lee el datetime de la BD como UTC', () => {
        expect(parseDbDate('2026-10-15 07:12:00').toISOString()).toBe('2026-10-15T07:12:00.000Z');
    });

    it('muestra la hora de la tienda (verano: UTC+2)', () => {
        expect(formatStepDate('2026-10-15 07:12:00')).toBe('15 oct, 09:12');
        expect(formatOrderMoment('2026-10-15 07:12:00')).toEqual({
            date: '15 de octubre de 2026',
            time: '9:12',
        });
    });

    it('muestra la hora de la tienda (invierno: UTC+1)', () => {
        expect(formatStepDate('2026-12-01 08:05:00')).toBe('1 dic, 09:05');
    });

    it('da el día de la tienda cuando en UTC aún es el anterior', () => {
        expect(formatShortDate('2026-07-09 23:30:00')).toBe('10 jul 2026');
    });

    it('abrevia el mes sin punto', () => {
        expect(formatShortDate('2025-07-10 12:00:00')).toBe('10 jul 2025');
        expect(formatShortDate('2025-09-03 12:00:00')).toBe('3 sept 2025');
    });
});

describe('días de la tienda como rango UTC', () => {
    it('invierno (UTC+1): la medianoche de Madrid es las 23:00 UTC del día anterior', () => {
        expect(shopDayStartUtc('2026-11-15')).toBe('2026-11-14 23:00:00');
        expect(shopDayEndUtc('2026-11-15')).toBe('2026-11-15 23:00:00');
    });

    it('verano (UTC+2): la medianoche de Madrid es las 22:00 UTC del día anterior', () => {
        expect(shopDayStartUtc('2026-07-15')).toBe('2026-07-14 22:00:00');
        expect(shopDayEndUtc('2026-07-15')).toBe('2026-07-15 22:00:00');
    });

    it('un asiento del 15/11 a las 00:30 en Madrid cae dentro de "desde el 15"', () => {
        const stored = '2026-11-14 23:30:00';
        expect(formatShortDate(stored)).toBe('15 nov 2026');
        expect(stored >= shopDayStartUtc('2026-11-15')).toBe(true);
        expect(stored < shopDayEndUtc('2026-11-14')).toBe(false);
    });

    it('29/03/2026, el día de 23 horas (a las 02:00 pasa a las 03:00)', () => {
        expect(shopDayStartUtc('2026-03-28')).toBe('2026-03-27 23:00:00'); // aún UTC+1
        expect(shopDayStartUtc('2026-03-29')).toBe('2026-03-28 23:00:00'); // medianoche en UTC+1
        expect(shopDayEndUtc('2026-03-29')).toBe('2026-03-29 22:00:00'); // ya UTC+2
        expect(shopDayStartUtc('2026-03-30')).toBe('2026-03-29 22:00:00');
    });

    it('25/10/2026, el día de 25 horas (a las 03:00 pasa a las 02:00)', () => {
        expect(shopDayStartUtc('2026-10-24')).toBe('2026-10-23 22:00:00'); // aún UTC+2
        expect(shopDayStartUtc('2026-10-25')).toBe('2026-10-24 22:00:00'); // medianoche en UTC+2
        expect(shopDayEndUtc('2026-10-25')).toBe('2026-10-25 23:00:00'); // ya UTC+1
        expect(shopDayStartUtc('2026-10-26')).toBe('2026-10-25 23:00:00');
    });

    it('el rango de esos días mide 23 y 25 horas', () => {
        const hours = (day: string) =>
            (parseDbDate(shopDayEndUtc(day)).getTime() -
                parseDbDate(shopDayStartUtc(day)).getTime()) /
            3_600_000;
        expect(hours('2026-03-29')).toBe(23);
        expect(hours('2026-10-25')).toBe(25);
        expect(hours('2026-06-01')).toBe(24);
    });

    it('un fin de mes o de año enlaza con el día siguiente', () => {
        expect(shopDayEndUtc('2026-12-31')).toBe('2026-12-31 23:00:00');
        expect(shopDayEndUtc('2026-02-28')).toBe('2026-02-28 23:00:00');
    });
});
