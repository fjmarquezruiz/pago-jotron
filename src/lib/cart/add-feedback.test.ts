import { describe, expect, it } from 'vitest';
import { describeAdd } from './add-feedback';

describe('describeAdd', () => {
    it('con el carrito lleno y una presentación nueva, dice que está lleno (no que falte stock)', () => {
        expect(describeAdd({ requested: 1, before: 0, after: 0, cartIsFull: true })).toEqual({
            type: 'warning',
            message: 'Tu carrito está lleno: puedes tener como máximo 50 productos distintos.',
        });
    });

    it('con el carrito lleno pero una presentación que ya estaba, habla del stock', () => {
        expect(describeAdd({ requested: 1, before: 5, after: 5, cartIsFull: true })).toEqual({
            type: 'warning',
            message: 'Ya tienes en el carrito todas las unidades que quedan.',
        });
    });

    it.each([
        // pedidas, antes, después → tipo, texto
        [1, 0, 1, 'success', 'Añadido al carrito'],
        [3, 2, 5, 'success', 'Añadido al carrito'],
        [3, 0, 3, 'success', 'Añadido al carrito'],
        [3, 2, 4, 'warning', 'Hemos añadido 2 unidades: es todo lo que queda.'],
        [3, 4, 5, 'warning', 'Hemos añadido 1 unidad: es todo lo que queda.'],
        [1, 5, 5, 'warning', 'Ya tienes en el carrito todas las unidades que quedan.'],
        [2, 6, 5, 'warning', 'Ya tienes en el carrito todas las unidades que quedan.'], // el stock bajó
    ] as const)(
        'pide %s con %s en el carrito y quedan %s → %s',
        (requested, before, after, type, message) => {
            expect(describeAdd({ requested, before, after })).toEqual({ type, message });
        },
    );
});
