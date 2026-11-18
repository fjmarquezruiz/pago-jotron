import { describe, expect, it } from 'vitest';
import { describeChanges, type NoticeLine } from './notices';
import type { CartChange } from './reconcile';

const roble: NoticeLine = {
    variantId: 4,
    name: 'Jotrón Tinto Roble',
    format: 'Botella',
    capacity: 750,
    capacityUnit: 'ml',
};
const media: NoticeLine = {
    variantId: 7,
    name: 'Jotrón Blanco Joven',
    format: 'Media botella',
    capacity: 375,
    capacityUnit: 'ml',
};
const caja: NoticeLine = {
    variantId: 9,
    name: 'Queso curado de oveja',
    format: 'Cuña',
    capacity: 500,
    capacityUnit: 'g',
};
const lines = [roble, media, caja];

const soldOut = (variantId: number): CartChange => ({
    type: 'removed',
    variantId,
    reason: 'sold-out',
});
const unavailable = (variantId: number): CartChange => ({
    type: 'removed',
    variantId,
    reason: 'unavailable',
});
const clamped = (variantId: number, from: number, to: number): CartChange => ({
    type: 'clamped',
    variantId,
    from,
    to,
});

const GONE_ONE = 'Hemos quitado de tu carrito un producto que ya no está disponible.';
const gone = (n: number) =>
    `Hemos quitado de tu carrito ${n} productos que ya no están disponibles.`;

describe('describeChanges', () => {
    it.each([
        [
            'agotada',
            [soldOut(4)],
            [
                '«Jotrón Tinto Roble» (Botella 75 cl) se ha agotado y lo hemos quitado de tu carrito.',
            ],
        ],
        [
            'agotada, con la presentación en centilitros decimales',
            [soldOut(7)],
            [
                '«Jotrón Blanco Joven» (Media botella 37,5 cl) se ha agotado y lo hemos quitado de tu carrito.',
            ],
        ],
        [
            'agotada, con la presentación en gramos',
            [soldOut(9)],
            [
                '«Queso curado de oveja» (Cuña 500 g) se ha agotado y lo hemos quitado de tu carrito.',
            ],
        ],
        [
            'cantidad ajustada a 1 (singular)',
            [clamped(4, 3, 1)],
            [
                'Solo queda 1 unidad de «Jotrón Tinto Roble» (Botella 75 cl): hemos ajustado la cantidad.',
            ],
        ],
        [
            'cantidad ajustada a más de 1 (plural)',
            [clamped(4, 6, 2)],
            [
                'Solo quedan 2 unidades de «Jotrón Tinto Roble» (Botella 75 cl): hemos ajustado la cantidad.',
            ],
        ],
        ['no disponible', [unavailable(4)], [GONE_ONE]], // no se nombra aunque la línea se conozca
    ])('%s', (_, changes, expected) => {
        expect(describeChanges(changes, lines)).toEqual(expected);
    });

    it('sin cambios devuelve una lista vacía', () => {
        expect(describeChanges([], lines)).toEqual([]);
        expect(describeChanges([], [])).toEqual([]);
    });

    it('los avisos con nombre van en el orden de los cambios', () => {
        expect(describeChanges([clamped(9, 4, 3), soldOut(4), clamped(7, 2, 1)], lines)).toEqual([
            'Solo quedan 3 unidades de «Queso curado de oveja» (Cuña 500 g): hemos ajustado la cantidad.',
            '«Jotrón Tinto Roble» (Botella 75 cl) se ha agotado y lo hemos quitado de tu carrito.',
            'Solo queda 1 unidad de «Jotrón Blanco Joven» (Media botella 37,5 cl): hemos ajustado la cantidad.',
        ]);
    });

    describe('productos no disponibles', () => {
        it.each([
            ['uno', [unavailable(100)], [GONE_ONE]],
            ['dos', [unavailable(100), unavailable(101)], [gone(2)]],
            ['cinco', [100, 101, 102, 103, 104].map(unavailable), [gone(5)]],
        ])('%s: un solo aviso, en singular o plural', (_, changes, expected) => {
            expect(describeChanges(changes, lines)).toEqual(expected);
        });

        it('un sold-out cuya línea no se conoce cuenta como no disponible', () => {
            expect(describeChanges([soldOut(100)], lines)).toEqual([GONE_ONE]);
        });

        it('un clamped cuya línea no se conoce cuenta como no disponible', () => {
            expect(describeChanges([clamped(100, 5, 2)], lines)).toEqual([GONE_ONE]);
        });

        it('sin líneas, todo cuenta como no disponible', () => {
            expect(describeChanges([soldOut(4), clamped(7, 3, 1), unavailable(9)], [])).toEqual([
                gone(3),
            ]);
        });

        it('el aviso agrupado va al final, detrás de los que tienen nombre', () => {
            expect(
                describeChanges(
                    [unavailable(100), soldOut(4), clamped(101, 3, 1), clamped(7, 5, 2)],
                    lines,
                ),
            ).toEqual([
                '«Jotrón Tinto Roble» (Botella 75 cl) se ha agotado y lo hemos quitado de tu carrito.',
                'Solo quedan 2 unidades de «Jotrón Blanco Joven» (Media botella 37,5 cl): hemos ajustado la cantidad.',
                gone(2),
            ]);
        });

        it('mezcla de no disponibles y de líneas desconocidas en un único aviso', () => {
            expect(describeChanges([unavailable(4), soldOut(100)], lines)).toEqual([gone(2)]);
        });
    });

    it('no modifica los cambios ni las líneas que recibe', () => {
        const changes = [soldOut(4), clamped(7, 3, 1), unavailable(100)];
        const snapshot = structuredClone([changes, lines]);
        describeChanges(changes, lines);
        expect([changes, lines]).toEqual(snapshot);
    });
});
