import { describe, expect, it } from 'vitest';
import { escapeLike, searchPattern } from './search';

describe('escapeLike', () => {
    it.each([
        ['tinto', 'tinto'],
        ['', ''],
        ['100%', '100\\%'],
        ['a_b', 'a\\_b'],
        ['a\\b', 'a\\\\b'],
        ['%_\\', '\\%\\_\\\\'],
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
        ['100%', '%100\\%%'],
        ['_', '%\\_%'],
    ])('%j → %j', (text, expected) => {
        expect(searchPattern(text)).toBe(expected);
    });

    it.each([[undefined], [''], ['   '], ['\n\t']])('%j → nada que buscar', (text) => {
        expect(searchPattern(text)).toBeUndefined();
    });
});
