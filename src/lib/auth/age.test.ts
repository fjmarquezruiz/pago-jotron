import { describe, expect, it } from 'vitest';
import { isAdult } from './age';

// 11 de noviembre de 2026 (en Date el mes empieza en 0: 10 = noviembre)
const today = new Date(2026, 10, 11);

describe('isAdult', () => {
    it('cumple 18 años hoy', () => {
        expect(isAdult('2008-11-11', today)).toBe(true);
    });
    it('le falta un día para cumplir 18 años', () => {
        expect(isAdult('2008-11-12', today)).toBe(false);
    });
    it('tiene 30 años', () => {
        expect(isAdult('1996-11-11', today)).toBe(true);
    });
    it('fecha no válida', () => {
        expect(isAdult('1990-05', today)).toBe(false);
    });
});
