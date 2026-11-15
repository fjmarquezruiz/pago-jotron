import { describe, expect, it } from 'vitest';
import { formatPresentation, pickDefaultVariant, soldOutMessage } from './presentation';
import { buildSpecRows, type SpecSheetInput } from './spec-sheet';
import { typologyTone } from './typology-tone';

describe('formatPresentation', () => {
    it.each([
        [{ format: 'Botella', capacity: 750, capacityUnit: 'ml' }, 'Botella 75 cl'],
        [{ format: 'Media botella', capacity: 375, capacityUnit: 'ml' }, 'Media botella 37,5 cl'],
        [{ format: 'Botella', capacity: 500, capacityUnit: 'ml' }, 'Botella 50 cl'],
        [{ format: 'Mágnum', capacity: 1500, capacityUnit: 'ml' }, 'Mágnum 150 cl'],
        [{ format: 'Caja', capacity: 500, capacityUnit: 'g' }, 'Caja 500 g'],
        [{ format: 'Caja', capacity: 1000, capacityUnit: 'g' }, 'Caja 1000 g'],
    ] as const)('%j → %j', (presentation, expected) => {
        expect(formatPresentation(presentation)).toBe(expected);
    });
});

describe('pickDefaultVariant', () => {
    const cases: [string, { stock: number }[], number][] = [
        ['la primera con stock', [{ stock: 0 }, { stock: 4 }, { stock: 9 }], 1],
        ['la primera si tiene stock', [{ stock: 2 }, { stock: 4 }], 0],
        ['la primera si todas están agotadas', [{ stock: 0 }, { stock: 0 }], 0],
    ];

    it.each(cases)('%s', (_caso, variants, index) => {
        expect(pickDefaultVariant(variants)).toBe(variants[index]);
    });

    it('devuelve undefined sin presentaciones', () => {
        expect(pickDefaultVariant([])).toBeUndefined();
    });
});

describe('soldOutMessage', () => {
    it.each([
        [
            [{ stock: 0 }, { stock: 3 }],
            'Esta presentación está agotada. Elige otro formato o vuelve más adelante.',
        ],
        [
            [{ stock: 5 }, { stock: 0 }],
            'Esta presentación está agotada. Elige otro formato o vuelve más adelante.',
        ],
        [[{ stock: 0 }, { stock: 0 }], 'Ahora mismo no nos queda. Vuelve más adelante.'],
        [[{ stock: 0 }], 'Ahora mismo no nos queda. Vuelve más adelante.'],
    ])('%j → %j', (variants, expected) => {
        expect(soldOutMessage(variants)).toBe(expected);
    });
});

describe('typologyTone', () => {
    it.each([
        ['Tinto', 'wine-red'],
        ['Blanco', 'wine-white'],
        ['Rosado', 'wine-rose'],
        ['Dulce', 'wine-sweet'],
        ['Generoso', 'wine-fortified'],
        ['Espumoso', 'neutral'],
        ['Pasa moscatel', 'neutral'],
    ] as const)('%s → %s', (name, expected) => {
        expect(typologyTone(name)).toBe(expected);
    });
});

describe('buildSpecRows', () => {
    const wine: SpecSheetInput = {
        winery: { name: 'Bodega Pago de Jotrón' },
        guaranteeOfOrigin: {
            name: 'Sierras de Málaga',
            classification: 'DO',
            region: 'Montes de Málaga',
        },
        grapes: [
            { percentage: '50.00', grape: { name: 'Tintilla de Rota' } },
            { percentage: '30.00', grape: { name: 'Syrah' } },
            { percentage: '20.00', grape: { name: 'Blasco' } },
        ],
        alcoholContent: '14.00',
        agingTime: '4 meses en barrica de roble francés',
        minTemperature: '14.00',
        maxTemperature: '16.00',
        production: '18.000 botellas',
        vineyardAltitude: 850,
        soilType: 'Pizarra y arcilla',
        yield: 4500,
        variants: [
            { capacity: 750, capacityUnit: 'ml' },
            { capacity: 375, capacityUnit: 'ml' },
        ],
    };
    const empty: SpecSheetInput = {
        winery: { name: '' },
        guaranteeOfOrigin: { name: '', classification: '', region: null },
        grapes: [],
        alcoholContent: null,
        agingTime: null,
        minTemperature: null,
        maxTemperature: null,
        production: null,
        vineyardAltitude: null,
        soilType: null,
        yield: null,
        variants: [],
    };

    it('devuelve todas las filas, en orden', () => {
        expect(buildSpecRows(wine)).toEqual([
            { label: 'Bodega', value: 'Bodega Pago de Jotrón' },
            { label: 'Denominación de origen', value: 'DO Sierras de Málaga' },
            { label: 'Región', value: 'Montes de Málaga' },
            {
                label: 'Variedades de uva',
                value: 'Tintilla de Rota (50%), Syrah (30%), Blasco (20%)',
            },
            { label: 'Graduación alcohólica', value: '14,0% vol.' },
            { label: 'Crianza', value: '4 meses en barrica de roble francés' },
            { label: 'Temperatura de servicio', value: '14–16°C' },
            { label: 'Producción', value: '18.000 botellas' },
            { label: 'Altitud del viñedo', value: '850 m' },
            { label: 'Tipo de suelo', value: 'Pizarra y arcilla' },
            { label: 'Rendimiento', value: '4.500 kg/ha' },
            { label: 'Formato de botella', value: '375ml, 750ml' },
        ]);
    });

    it('la bodega y la denominación (con su clasificación) van las primeras', () => {
        const [winery, origin] = buildSpecRows({
            ...empty,
            winery: { name: 'Lustau' },
            guaranteeOfOrigin: {
                name: 'Jerez-Xérès-Sherry',
                classification: 'DO',
                region: 'Marco de Jerez (Cádiz)',
            },
        });
        expect(winery).toEqual({ label: 'Bodega', value: 'Lustau' });
        expect(origin).toEqual({ label: 'Denominación de origen', value: 'DO Jerez-Xérès-Sherry' });
    });

    it.each([
        [850, 'Altitud del viñedo', '850 m'],
        [1100, 'Altitud del viñedo', '1.100 m'],
        [4500, 'Rendimiento', '4.500 kg/ha'],
        [12000, 'Rendimiento', '12.000 kg/ha'],
        [null, 'Altitud del viñedo', null],
        [null, 'Rendimiento', null],
    ] as const)('medida %s (%s) → %s', (value, label, expected) => {
        const rows = buildSpecRows({
            ...empty,
            vineyardAltitude: label === 'Altitud del viñedo' ? value : null,
            yield: label === 'Rendimiento' ? value : null,
        });
        expect(rows.find((row) => row.label === label)?.value ?? null).toBe(expected);
    });

    it('el tipo de suelo vacío no se pinta', () => {
        expect(buildSpecRows({ ...empty, soilType: '  ' })).toEqual([]);
        expect(buildSpecRows({ ...empty, soilType: 'Albariza' })).toEqual([
            { label: 'Tipo de suelo', value: 'Albariza' },
        ]);
    });

    it('no incluye las filas sin dato', () => {
        expect(buildSpecRows(empty)).toEqual([]);
        expect(buildSpecRows({ ...empty, production: '2.000 cajas' })).toEqual([
            { label: 'Producción', value: '2.000 cajas' },
        ]);
    });

    it.each([
        ['  ', null],
        ['', null],
    ])('trata el texto vacío %j como sin dato', (text, expected) => {
        const rows = buildSpecRows({ ...empty, agingTime: text, production: text });
        expect(rows.find((row) => row.label === 'Crianza')?.value ?? null).toBe(expected);
        expect(rows.find((row) => row.label === 'Producción')?.value ?? null).toBe(expected);
    });

    it.each([
        ['14.00', '16.00', '14–16°C'],
        ['14.00', '14.00', '14°C'],
        ['6.00', null, '6°C'],
        [null, '8.50', '8,5°C'],
        [null, null, null],
    ] as const)('temperatura %s / %s → %s', (min, max, expected) => {
        const rows = buildSpecRows({ ...empty, minTemperature: min, maxTemperature: max });
        expect(rows.find((row) => row.label === 'Temperatura de servicio')?.value ?? null).toBe(
            expected,
        );
    });

    it('una uva sin porcentaje va solo con el nombre', () => {
        const rows = buildSpecRows({
            ...empty,
            grapes: [{ percentage: null, grape: { name: 'Moscatel' } }],
        });
        expect(rows).toEqual([{ label: 'Variedades de uva', value: 'Moscatel' }]);
    });

    describe('formato de botella', () => {
        const formatOf = (variants: SpecSheetInput['variants']) =>
            buildSpecRows({ ...empty, variants }).find((row) => row.label === 'Formato de botella')
                ?.value ?? null;

        it.each([
            ['una capacidad', [{ capacity: 750, capacityUnit: 'ml' }], '750ml'],
            [
                'varias, de menor a mayor',
                [
                    { capacity: 1500, capacityUnit: 'ml' },
                    { capacity: 750, capacityUnit: 'ml' },
                    { capacity: 375, capacityUnit: 'ml' },
                ],
                '375ml, 750ml, 1500ml',
            ],
            [
                'sin repetir',
                [
                    { capacity: 750, capacityUnit: 'ml' },
                    { capacity: 750, capacityUnit: 'ml' },
                ],
                '750ml',
            ],
            [
                'solo las de ml cuando se mezclan con gramos',
                [
                    { capacity: 500, capacityUnit: 'g' },
                    { capacity: 750, capacityUnit: 'ml' },
                ],
                '750ml',
            ],
            [
                'ninguna si todas son gramos (pasas)',
                [
                    { capacity: 500, capacityUnit: 'g' },
                    { capacity: 1000, capacityUnit: 'g' },
                ],
                null,
            ],
            ['ninguna si no hay presentaciones', [], null],
        ] as const)('%s', (_caso, variants, expected) => {
            expect(formatOf(variants)).toBe(expected);
        });

        it('no altera el orden de las presentaciones recibidas', () => {
            const variants = [
                { capacity: 750, capacityUnit: 'ml' },
                { capacity: 375, capacityUnit: 'ml' },
            ] as const;
            formatOf(variants);
            expect(variants.map((variant) => variant.capacity)).toEqual([750, 375]);
        });
    });
});
