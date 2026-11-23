import { describe, expect, it } from 'vitest';
import {
    activityAge,
    activityText,
    customerLabel,
    daysAgo,
    monthStart,
    toDbDatetime,
} from './dashboard';

const NOW = new Date('2026-10-15T12:00:00Z');

describe('fechas de las consultas', () => {
    it('da formato de datetime de la BD', () => {
        expect(toDbDatetime(NOW)).toBe('2026-10-15 12:00:00');
    });
    it('el mes empieza el día 1 a las 00:00 UTC', () => {
        expect(monthStart(NOW)).toBe('2026-10-01 00:00:00');
        expect(monthStart(new Date('2026-12-31T23:59:59Z'))).toBe('2026-12-01 00:00:00');
    });
    it('resta días', () => {
        expect(daysAgo(NOW, 30)).toBe('2026-09-15 12:00:00');
    });
});

describe('customerLabel', () => {
    it('une nombre y apellidos', () => {
        expect(customerLabel('Lucía', 'Fernández', 'l@x.es')).toBe('Lucía Fernández');
    });
    it('vale con solo el nombre', () => {
        expect(customerLabel('Lucía', null, 'l@x.es')).toBe('Lucía');
    });
    it('cae al correo si no hay nombre', () => {
        expect(customerLabel(null, null, 'l@x.es')).toBe('l@x.es');
        expect(customerLabel('  ', '', 'l@x.es')).toBe('l@x.es');
    });
});

describe('activityAge', () => {
    it.each([
        ['2026-10-15 11:59:30', 'Hace un momento'],
        ['2026-10-15 11:59:00', 'Hace 1 minuto'],
        ['2026-10-15 11:50:00', 'Hace 10 minutos'],
        ['2026-10-15 11:00:00', 'Hace 1 hora'],
        ['2026-10-15 10:00:00', 'Hace 2 horas'],
        ['2026-10-14 12:00:00', 'Ayer'],
        ['2026-10-14 01:00:00', 'Ayer'],
        ['2026-10-10 12:00:00', '10 oct 2026'],
    ])('%s → %s', (value, expected) => {
        expect(activityAge(value, NOW)).toBe(expected);
    });
});

describe('activityText', () => {
    it('une acción y detalle', () => {
        expect(activityText('Reembolso pendiente', 'pedido 4')).toBe(
            'Reembolso pendiente: pedido 4',
        );
    });
    it('sin detalle, solo la acción', () => {
        expect(activityText('Reembolso pendiente', null)).toBe('Reembolso pendiente');
        expect(activityText('Reembolso pendiente', '  ')).toBe('Reembolso pendiente');
    });
});
