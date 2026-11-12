import { describe, expect, it } from 'vitest';
import { isAdult, isRealDate } from './age';

describe('isRealDate', () => {
    it('acepta una fecha normal', () => {
        expect(isRealDate('1996-11-11')).toBe(true);
    });
    it('acepta el 29 de febrero en año bisiesto', () => {
        expect(isRealDate('2024-02-29')).toBe(true);
    });
    it('acepta el 29 de febrero en año bisiesto de siglo (2000)', () => {
        expect(isRealDate('2000-02-29')).toBe(true);
    });
    it('rechaza el 29 de febrero en año no bisiesto', () => {
        expect(isRealDate('2023-02-29')).toBe(false);
    });
    it('rechaza el 29 de febrero en año de siglo no bisiesto (1900)', () => {
        expect(isRealDate('1900-02-29')).toBe(false);
    });
    it('rechaza el 30 de febrero', () => {
        expect(isRealDate('2024-02-30')).toBe(false);
    });
    it('rechaza el 31 de un mes de 30 días', () => {
        expect(isRealDate('2024-04-31')).toBe(false);
    });
    it('acepta el último día de un mes de 31 días', () => {
        expect(isRealDate('2024-12-31')).toBe(true);
    });
    it('rechaza mes 0 y mes 13', () => {
        expect(isRealDate('2024-00-10')).toBe(false);
        expect(isRealDate('2024-13-10')).toBe(false);
    });
    it('rechaza día 0 y día 32', () => {
        expect(isRealDate('2024-05-00')).toBe(false);
        expect(isRealDate('2024-05-32')).toBe(false);
    });
    it('rechaza formatos que no son AAAA-MM-DD', () => {
        expect(isRealDate('')).toBe(false);
        expect(isRealDate('1990-05')).toBe(false);
        expect(isRealDate('1990-5-1')).toBe(false);
        expect(isRealDate('11/11/1996')).toBe(false);
        expect(isRealDate('1996-11-11T00:00:00')).toBe(false);
        expect(isRealDate('abcd-ef-gh')).toBe(false);
    });
    it('rechaza el año 0000', () => {
        expect(isRealDate('0000-01-01')).toBe(false);
    });
});

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
