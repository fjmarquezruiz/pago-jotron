import { Role } from '@/types/auth';

const PUBLIC_EXACT = ['/'];
const PUBLIC_PREFIXES = ['/productos', '/auth', '/api/auth', '/acceso-denegado', '/sistema-diseno'];
const ADMIN_ONLY = ['/admin/usuarios', '/admin/pedidos', '/admin/auditoria'];

/** Comprueba si `path` es `prefix` o cuelga de él (`/admin` sí, `/administracion` no). */
function matches(path: string, prefix: string): boolean {
    return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Indica si una ruta es pública (no necesita sesión). Todo lo que no esté aquí es privado (RF1).
 * @param path Ruta de la petición, p. ej. `/productos/fino`.
 */
export function isPublicPath(path: string): boolean {
    return PUBLIC_EXACT.includes(path) || PUBLIC_PREFIXES.some((p) => matches(path, p));
}

/**
 * Decide si un rol puede entrar en una ruta (RF1). Lo usa el middleware.
 * @param path Ruta de la petición.
 * @param role Rol de la sesión, o `null` si no hay sesión.
 * @returns `ok` si entra, `login` si necesita sesión y `denied` si su rol no basta.
 */
export function checkAccess(path: string, role: Role | null): 'ok' | 'login' | 'denied' {
    if (isPublicPath(path)) return 'ok';
    if (!role) return 'login';
    if (ADMIN_ONLY.some((p) => matches(path, p))) return role === 'Administrador' ? 'ok' : 'denied';
    if (matches(path, '/admin')) return role === 'Cliente' ? 'denied' : 'ok';
    return 'ok';
}
