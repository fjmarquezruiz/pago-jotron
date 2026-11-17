import { describe, expect, it } from 'vitest';
import { CATALOG_SORTS, PRICE_RANGES, SELECT_FILTER_KEYS } from './filter-constants';
import {
    CATALOG_SORT_LABELS,
    PRICE_RANGE_LABELS,
    SELECT_FILTER_LABELS,
    emptyResultsCopy,
    resultsSummary,
    viewResultsLabel,
} from './filter-labels';

describe('etiquetas', () => {
    it('hay texto para cada select, tramo de precio y criterio de orden, y para nada más', () => {
        expect(Object.keys(SELECT_FILTER_LABELS)).toEqual([...SELECT_FILTER_KEYS]);
        expect(Object.keys(PRICE_RANGE_LABELS)).toEqual([...PRICE_RANGES]);
        expect(Object.keys(CATALOG_SORT_LABELS)).toEqual([...CATALOG_SORTS]);
    });

    it('los selects se pintan en el orden del diseño', () => {
        expect(SELECT_FILTER_KEYS.map((key) => SELECT_FILTER_LABELS[key])).toEqual([
            'Tipología',
            'Denominación',
            'Bodega',
            'Uva',
            'Añada',
            'Precio',
        ]);
    });

    it('los textos no se repiten dentro de cada lista', () => {
        for (const labels of [PRICE_RANGE_LABELS, CATALOG_SORT_LABELS]) {
            const values = Object.values(labels);
            expect(new Set(values).size).toBe(values.length);
        }
    });

    it('los importes llevan espacio duro antes del € para no partirse en dos líneas', () => {
        for (const label of Object.values(PRICE_RANGE_LABELS)) {
            expect(label).not.toMatch(/\d €/); // ningún espacio normal entre el número y el €
        }
    });
});

describe('resultsSummary', () => {
    it.each([
        [0, 'Mostrando 0 productos'],
        [1, 'Mostrando 1 producto'],
        [2, 'Mostrando 2 productos'],
        [12, 'Mostrando 12 productos'],
        [120, 'Mostrando 120 productos'],
    ])('%s → %s', (total, expected) => {
        expect(resultsSummary(total)).toBe(expected);
    });
});

describe('viewResultsLabel', () => {
    it.each([
        [0, 'Ver 0 productos'],
        [1, 'Ver 1 producto'],
        [2, 'Ver 2 productos'],
        [12, 'Ver 12 productos'],
    ])('%s → %s', (total, expected) => {
        expect(viewResultsLabel(total)).toBe(expected);
    });
});

describe('emptyResultsCopy', () => {
    it('con búsqueda de texto, el título y el apoyo del diseño', () => {
        expect(emptyResultsCopy('Pago de Martinez')).toEqual({
            title: 'Sin resultados con: “Pago de Martinez”',
            description: 'Prueba con otros términos o explora nuestras colecciones',
        });
    });

    it('recorta el texto buscado', () => {
        expect(emptyResultsCopy('  roble  ').title).toBe('Sin resultados con: “roble”');
    });

    it.each([[undefined], [''], ['   ']])(
        'sin texto (%j), el título de los filtros y sin apoyo',
        (q) => {
            expect(emptyResultsCopy(q)).toEqual({ title: 'Ningún producto cumple estos filtros' });
        },
    );
});
