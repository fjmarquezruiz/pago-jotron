import { describe, expect, it } from 'vitest';
import { checkAccess, isPublicPath, needsAgeGate } from './access';

describe('isPublicPath', () => {
    it('reconoce las rutas públicas', () => {
        expect(isPublicPath('/')).toBe(true);
        expect(isPublicPath('/productos/fino')).toBe(true);
        expect(isPublicPath('/api/auth/session')).toBe(true);
    });

    it('no confunde prefijos parecidos', () => {
        expect(isPublicPath('/productosx')).toBe(false);
        expect(isPublicPath('/admin')).toBe(false);
    });
});

describe('checkAccess', () => {
    it.each([
        ['/', null, 'ok'],
        ['/cuenta', null, 'login'],
        ['/cuenta', 'Cliente', 'ok'],
        ['/admin', 'Cliente', 'denied'],
        ['/admin/productos', 'Editor', 'ok'],
        ['/admin/usuarios', 'Editor', 'denied'],
        ['/admin/usuarios', 'Administrador', 'ok'],
        ['/productosx', null, 'login'],
        ['/sistema-diseno', null, 'login'],
        ['/sistema-diseno', 'Cliente', 'denied'],
        ['/sistema-diseno', 'Editor', 'denied'],
        ['/sistema-diseno', 'Administrador', 'ok'],
        ['/verificar-edad', null, 'ok'],
        ['/api/verificar-edad', null, 'ok'],
        ['/condiciones', null, 'ok'],
        ['/privacidad', null, 'ok'],
        ['/cookies', null, 'ok'],
    ] as const)('%s con %s → %s', (path, role, expected) => {
        expect(checkAccess(path, role)).toBe(expected);
    });
});

describe('needsAgeGate', () => {
    it.each([
        ['/', false, false, true],
        ['/productos/fino', false, false, true],
        ['/cuenta', false, false, true],
        ['/admin', false, false, true],
        ['/', true, false, false],
        ['/productos/fino', true, false, false],
        ['/', false, true, false],
        ['/admin', false, true, false],
        ['/verificar-edad', false, false, false],
        ['/auth/login', false, false, false],
        ['/auth/registro', false, false, false],
        ['/api/auth/session', false, false, false],
        ['/api/verificar-edad', false, false, false],
        ['/api/productos', false, false, false],
        ['/condiciones', false, false, false],
        ['/privacidad', false, false, false],
        ['/cookies', false, false, false],
        ['/privacidadx', false, false, true],
        ['/apix', false, false, true],
    ] as const)('%s (cookie: %s, sesión: %s) → %s', (path, hasCookie, hasSession, expected) => {
        expect(needsAgeGate(path, hasCookie, hasSession)).toBe(expected);
    });
});
