import { describe, expect, it } from 'vitest';
import { provinceFromPostalCode } from './provinces';

describe('provinceFromPostalCode', () => {
    it.each([
        ['01001', 'Álava'],
        ['07001', 'Baleares'],
        ['28013', 'Madrid'],
        ['29005', 'Málaga'],
        ['35001', 'Las Palmas'],
        ['38001', 'Santa Cruz de Tenerife'],
        ['51001', 'Ceuta'],
        ['52001', 'Melilla'],
    ])('%s es %s', (postalCode, province) => {
        expect(provinceFromPostalCode(postalCode)).toBe(province);
    });

    it('hay exactamente 52 provincias distintas, de la 01 a la 52', () => {
        const names = new Set<string>();
        for (let code = 1; code <= 52; code += 1) {
            const name = provinceFromPostalCode(`${String(code).padStart(2, '0')}001`);
            expect(name).not.toBeNull();
            names.add(name as string);
        }
        expect(names.size).toBe(52);
    });

    it.each(['00500', '53001', '99999', '2900', '290055', '2900a', '', ' 29005'])(
        '%j no tiene provincia',
        (postalCode) => {
            expect(provinceFromPostalCode(postalCode)).toBeNull();
        },
    );
});
