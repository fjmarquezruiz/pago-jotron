import { describe, expect, it } from 'vitest';
import { formatOrderMoment, formatShortDate, formatStepDate, parseDbDate } from './dates';

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
