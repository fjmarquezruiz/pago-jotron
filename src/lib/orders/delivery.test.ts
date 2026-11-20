import { describe, expect, it } from 'vitest';
import { calendarDate, estimatedDeliveryDate, formatDeliveryDate, toIsoDate } from './delivery';

const deliver = (from: string, days: number) =>
    toIsoDate(estimatedDeliveryDate(calendarDate(from), days));

// 2026-10-12 es lunes.
describe('estimatedDeliveryDate', () => {
    it('con plazo 0 devuelve el mismo día, aunque sea fin de semana', () => {
        expect(deliver('2026-10-14', 0)).toBe('2026-10-14');
        expect(deliver('2026-10-17', 0)).toBe('2026-10-17');
    });

    it('cuenta días laborables entre semana', () => {
        expect(deliver('2026-10-12', 1)).toBe('2026-10-13');
        expect(deliver('2026-10-12', 4)).toBe('2026-10-16');
    });

    it('viernes + 1 es el lunes', () => {
        expect(deliver('2026-10-16', 1)).toBe('2026-10-19');
    });

    it('desde sábado o domingo, + 1 es el lunes', () => {
        expect(deliver('2026-10-17', 1)).toBe('2026-10-19');
        expect(deliver('2026-10-18', 1)).toBe('2026-10-19');
    });

    it('plazo 5 salta un fin de semana completo', () => {
        expect(deliver('2026-10-12', 5)).toBe('2026-10-19');
        expect(deliver('2026-10-14', 5)).toBe('2026-10-21');
    });

    it('plazos largos saltan varios fines de semana', () => {
        expect(deliver('2026-10-12', 10)).toBe('2026-10-26');
    });

    it('cruza el fin de mes y de año', () => {
        expect(deliver('2026-12-31', 1)).toBe('2027-01-01');
        expect(deliver('2026-12-31', 2)).toBe('2027-01-04');
    });

    it('no depende de la hora del Date de partida', () => {
        const late = new Date('2026-10-16T23:59:59Z');
        expect(toIsoDate(estimatedDeliveryDate(late, 1))).toBe('2026-10-19');
    });

    it('no modifica la fecha de partida', () => {
        const from = calendarDate('2026-10-12');
        estimatedDeliveryDate(from, 3);
        expect(toIsoDate(from)).toBe('2026-10-12');
    });

    it.each([-1, 1.5, Number.NaN])('rechaza el plazo %s', (days) => {
        expect(() => estimatedDeliveryDate(calendarDate('2026-10-12'), days)).toThrow(RangeError);
    });

    it('rechaza una fecha no válida', () => {
        expect(() => estimatedDeliveryDate(new Date(Number.NaN), 1)).toThrow(RangeError);
    });
});

describe('calendarDate', () => {
    it('lee la fecha e ignora la hora', () => {
        expect(toIsoDate(calendarDate('2026-10-15 23:59:59'))).toBe('2026-10-15');
    });

    it.each(['', 'hoy', '2026-13-01', '2026-02-30'])('rechaza %j', (text) => {
        expect(() => calendarDate(text)).toThrow(RangeError);
    });
});

describe('formatDeliveryDate', () => {
    it('da día de la semana, día y mes abreviados, con inicial mayúscula y sin puntos', () => {
        expect(formatDeliveryDate(calendarDate('2026-10-15'))).toBe('Jue, 15 oct');
        expect(formatDeliveryDate(calendarDate('2026-10-18'))).toBe('Dom, 18 oct');
    });

    it('no deja puntos en los meses largos abreviados', () => {
        expect(formatDeliveryDate(calendarDate('2026-09-01'))).not.toContain('.');
        expect(formatDeliveryDate(calendarDate('2026-01-05'))).toBe('Lun, 5 ene');
    });
});
