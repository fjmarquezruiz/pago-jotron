import { describe, expect, it } from 'vitest';
import { getPagination, toPositiveInt } from './pagination';

describe('toPositiveInt', () => {
    it.each([
        [1, 1],
        [7, 7],
        [2.9, 2],
        [0, 1],
        [-4, 1],
        [Number.NaN, 1],
        [Number.POSITIVE_INFINITY, 1],
    ])('%s → %s', (value, expected) => {
        expect(toPositiveInt(value)).toBe(expected);
    });
});

describe('getPagination', () => {
    it.each([
        // page, pageSize, total → page, totalPages, outOfRange, hasPrevious, hasNext
        [1, 12, 30, 1, 3, false, false, true],
        [2, 12, 30, 2, 3, false, true, true],
        [3, 12, 30, 3, 3, false, true, false],
        [1, 12, 12, 1, 1, false, false, false], // justo una página llena
        [1, 12, 13, 1, 2, false, false, true], // una más: segunda página
        [1, 12, 1, 1, 1, false, false, false],
        [1, 12, 0, 1, 1, false, false, false], // sin resultados: página 1 de 1
        [9, 12, 30, 3, 3, true, true, false], // se pasa: última página
        [2, 12, 0, 1, 1, true, false, false], // sin resultados y pide la 2
        [0, 12, 30, 1, 3, false, false, true], // inválidas → página 1
        [-3, 12, 30, 1, 3, false, false, true],
        [Number.NaN, 12, 30, 1, 3, false, false, true],
        [2.7, 12, 30, 2, 3, false, true, true],
    ] as const)(
        'página %s, %s por página, %s en total → página %s de %s (fuera de rango: %s)',
        (page, pageSize, total, expectedPage, totalPages, outOfRange, hasPrevious, hasNext) => {
            expect(getPagination({ page, pageSize, total })).toEqual({
                page: expectedPage,
                pageSize,
                totalPages,
                outOfRange,
                hasPrevious,
                hasNext,
            });
        },
    );

    it.each([
        [0, 1],
        [-5, 1],
        [Number.NaN, 1],
        [10.9, 10],
    ])('tamaño de página %s se corrige a %s', (pageSize, expected) => {
        expect(getPagination({ page: 1, pageSize, total: 25 }).pageSize).toBe(expected);
    });

    it.each([[Number.NaN], [-8]])('un total inválido (%s) cuenta como 0', (total) => {
        expect(getPagination({ page: 1, pageSize: 12, total })).toMatchObject({
            totalPages: 1,
            hasNext: false,
        });
    });
});
