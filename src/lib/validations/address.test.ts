import { describe, expect, it } from 'vitest';
import { addresses } from '@/db/schema';
import { ADDRESS_TYPES, addressSchema, createAddressRequestSchema, STREET_TYPES } from './address';

const valid = {
    recipientName: 'Ana García López',
    phone: '600123456',
    streetType: 'Calle',
    streetName: 'Larios',
    number: '5',
    floor: '3º B',
    postalCode: '29005',
    city: 'Málaga',
    province: 'Málaga',
    country: 'España',
    addressType: 'Envío',
};

const parse = (overrides: Record<string, unknown>) =>
    addressSchema.safeParse({ ...valid, ...overrides });
const errorPaths = (overrides: Record<string, unknown>) => {
    const result = parse(overrides);
    return result.success ? [] : result.error.issues.map((issue) => issue.path[0]);
};

describe('addressSchema', () => {
    it('acepta una dirección completa', () => {
        const result = addressSchema.safeParse(valid);
        expect(result.success && result.data).toEqual(valid);
    });

    it('los tipos de vía y de dirección son los del esquema de la BD', () => {
        expect([...STREET_TYPES]).toEqual(addresses.streetType.enumValues);
        expect([...ADDRESS_TYPES]).toEqual(addresses.addressType.enumValues);
    });

    it('rellena el tipo de vía, el país y el tipo de dirección si no vienen', () => {
        const rest: Record<string, unknown> = { ...valid };
        for (const field of ['streetType', 'country', 'addressType']) delete rest[field];
        const result = addressSchema.safeParse(rest);
        expect(result.success && result.data).toEqual(valid);
    });

    it('recorta los espacios de los textos', () => {
        const result = parse({ recipientName: '  Ana  ', city: ' Málaga ' });
        expect(result.success && [result.data.recipientName, result.data.city]).toEqual([
            'Ana',
            'Málaga',
        ]);
    });

    it.each(['recipientName', 'streetName', 'number', 'city', 'phone', 'postalCode'])(
        'exige %s',
        (field) => {
            expect(errorPaths({ [field]: '   ' })).toContain(field);
            expect(errorPaths({ [field]: undefined })).toContain(field);
        },
    );

    it('respeta el largo de las columnas', () => {
        expect(errorPaths({ recipientName: 'a'.repeat(201) })).toContain('recipientName');
        expect(errorPaths({ streetName: 'a'.repeat(101) })).toContain('streetName');
        expect(errorPaths({ number: '12345678901' })).toContain('number');
        expect(errorPaths({ floor: 'a'.repeat(21) })).toContain('floor');
        expect(errorPaths({ city: 'a'.repeat(101) })).toContain('city');
        expect(parse({ recipientName: 'a'.repeat(200) }).success).toBe(true);
    });

    describe('provincia', () => {
        it('sale del código postal', () => {
            const result = parse({ postalCode: '08001', province: undefined });
            expect(result.success && result.data.province).toBe('Barcelona');
        });

        it('ignora la que mande el cliente: no puede contradecir al código postal', () => {
            const result = parse({ postalCode: '29005', province: 'Madrid' });
            expect(result.success && result.data.province).toBe('Málaga');
        });

        it('la petición de crear también la deriva y conserva replaces', () => {
            const result = createAddressRequestSchema.safeParse({
                ...valid,
                postalCode: '41001',
                province: 'Madrid',
                replaces: 4,
            });
            expect(result.success && [result.data.province, result.data.replaces]).toEqual([
                'Sevilla',
                4,
            ]);
        });
    });

    describe('código postal', () => {
        it.each(['01001', '08001', '28013', '29005', '52001'])('acepta %s', (postalCode) => {
            expect(parse({ postalCode }).success).toBe(true);
        });

        it.each(['00500', '53001', '99999'])('rechaza %s: la provincia no existe', (postalCode) => {
            expect(errorPaths({ postalCode })).toEqual(['postalCode']);
        });

        it.each(['2900', '290055', '2900a', '29 005', ''])(
            'rechaza %j: no son 5 dígitos',
            (postalCode) => {
                expect(errorPaths({ postalCode })).toContain('postalCode');
            },
        );

        it('no admite un número en lugar del texto', () => {
            expect(errorPaths({ postalCode: 29005 })).toContain('postalCode');
        });
    });

    describe('teléfono', () => {
        it.each([
            ['600123456', '600123456'],
            ['600 12 34 56', '600123456'],
            ['600-123-456', '600123456'],
            ['+34 600 123 456', '600123456'],
            ['0034600123456', '600123456'],
            ['952 000 000', '952000000'],
        ])('%j se guarda como %s', (input, stored) => {
            const result = parse({ phone: input });
            expect(result.success && result.data.phone).toBe(stored);
        });

        it.each([
            '123456789',
            '60012345',
            '6001234567',
            'abcdefghi',
            '+44 600123456',
            '+34 +34 600123456',
        ])('rechaza %j', (phone) => {
            expect(errorPaths({ phone })).toEqual(['phone']);
        });
    });

    describe('piso', () => {
        it.each([undefined, null, '', '   '])('%j se guarda como null', (floor) => {
            const result = parse({ floor });
            expect(result.success && result.data.floor).toBeNull();
        });
    });

    it('solo admite España', () => {
        expect(errorPaths({ country: 'Portugal' })).toEqual(['country']);
    });

    it('rechaza un tipo de vía o de dirección que no existe', () => {
        expect(errorPaths({ streetType: 'Autopista' })).toEqual(['streetType']);
        expect(errorPaths({ addressType: 'Regalo' })).toEqual(['addressType']);
    });

    it('ignora lo que sobra, como un userId o un id', () => {
        const result = parse({ userId: 99, id: 7, isActive: false });
        expect(result.success && result.data).toEqual(valid);
    });
});

describe('createAddressRequestSchema', () => {
    it('admite el id de la dirección que sustituye', () => {
        const result = createAddressRequestSchema.safeParse({ ...valid, replaces: 7 });
        expect(result.success && result.data.replaces).toBe(7);
    });

    it('replaces es opcional', () => {
        const result = createAddressRequestSchema.safeParse(valid);
        expect(result.success && result.data.replaces).toBeUndefined();
    });

    it.each([0, -1, 1.5, '7', null, 2_147_483_648])('rechaza replaces = %j', (replaces) => {
        expect(createAddressRequestSchema.safeParse({ ...valid, replaces }).success).toBe(false);
    });
});
