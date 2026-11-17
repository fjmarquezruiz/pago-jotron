import { describe, expect, it } from 'vitest';
import { LIKE_ESCAPE, escapeLike, searchPattern } from './search';

describe('escapeLike', () => {
    it('escapa con el carácter declarado en la consulta', () => {
        expect(LIKE_ESCAPE).toBe('!');
    });

    it.each([
        ['tinto', 'tinto'],
        ['', ''],
        ['100%', '100!%'],
        ['a_b', 'a!_b'],
        ['hola!', 'hola!!'], // el propio carácter de escape también se escapa
        ['%_!', '!%!_!!'],
        ['a\\b', 'a\\b'], // la barra ya no es especial: no se toca
        ['tío pepe', 'tío pepe'], // acentos y espacios no se tocan
        ["o'brien", "o'brien"], // las comillas las trata el parámetro, no el escape
    ])('%j → %j', (text, expected) => {
        expect(escapeLike(text)).toBe(expected);
    });
});

describe('searchPattern', () => {
    it.each([
        ['tinto', '%tinto%'],
        ['  tinto  ', '%tinto%'],
        ['tinto roble', '%tinto roble%'],
        ['100%', '%100!%%'],
        ['_', '%!_%'],
    ])('%j → %j', (text, expected) => {
        expect(searchPattern(text)).toBe(expected);
    });

    it.each([[undefined], [''], ['   '], ['\n\t']])('%j → nada que buscar', (text) => {
        expect(searchPattern(text)).toBeUndefined();
    });
});
