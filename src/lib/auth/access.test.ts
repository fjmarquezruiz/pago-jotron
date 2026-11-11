import { describe, expect, it } from 'vitest';
import { checkAccess, isPublicPath } from './access';

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
    ] as const)('%s con %s → %s', (path, role, expected) => {
        expect(checkAccess(path, role)).toBe(expected);
    });
});