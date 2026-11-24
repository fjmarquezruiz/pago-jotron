/**
 * Reglas del panel de usuarios (CU12). Funciones puras: lo que el listado y la ficha enseñan sale
 * de aquí. El rol y el estado se leen de la BD, nunca del token.
 */
import { adminNavFor } from '@/lib/admin/nav';
import { formatShortDate } from '@/lib/orders/dates';
import type { Role } from '@/types/auth';

/** Ruta del listado de usuarios del panel. */
export const ADMIN_USERS_PATH = '/admin/usuarios';

/** Usuarios por página del listado (Figma: "Mostrando 1–10 de 142"). */
export const ADMIN_USERS_PAGE_SIZE = 10;

/** Roles en el orden en que se ofrecen. */
export const ROLES: readonly Role[] = ['Cliente', 'Editor', 'Administrador'];

/** Estados de la cuenta que se pueden filtrar. */
export const USER_STATUSES = ['Activo', 'Inactivo'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Filtros del listado tal como viajan en la URL (`rol`, `estado`, `q`). */
export interface AdminUserFilters {
    role?: Role;
    status?: UserStatus;
    /** Texto buscado en el nombre, los apellidos o el correo. */
    q?: string;
}

/** `true` si hay algún filtro puesto. */
export function hasAdminUserFilters({ role, status, q }: AdminUserFilters): boolean {
    return Boolean(role || status || q);
}

/**
 * Enlace a una página del listado conservando los filtros: `/admin/usuarios?pagina=2&rol=Editor`.
 * La página 1 va sin `pagina`.
 */
export function adminUsersHref({
    page = 1,
    role,
    status,
    q,
}: AdminUserFilters & { page?: number }): string {
    const query = new URLSearchParams();
    if (page > 1) query.set('pagina', String(page));
    if (role) query.set('rol', role);
    if (status) query.set('estado', status);
    if (q) query.set('q', q);
    const text = query.toString();
    return text ? `${ADMIN_USERS_PATH}?${text}` : ADMIN_USERS_PATH;
}

/**
 * Chips de "Filtros activos": `Rol: todos` o el elegido y `Estado: todos`/`activo`/`inactivo`, y la
 * búsqueda aparte con el texto tal cual.
 */
export function adminUserFilterLabels({ role, status, q }: AdminUserFilters): {
    role: string;
    status: string;
    search?: string;
} {
    return {
        role: `Rol: ${role ? role.toLowerCase() : 'todos'}`,
        status: `Estado: ${status ? status.toLowerCase() : 'todos'}`,
        ...(q && { search: q }),
    };
}

/**
 * Pie de la tabla. Sin filtros, `Mostrando 1-10 de 142`; con filtros, `Mostrando 3 usuarios
 * filtrados de 142`; sin resultados, `Mostrando 0 de 0`.
 */
export function adminUsersRangeText({
    page,
    pageSize,
    shown,
    total,
    overall,
    filtered,
}: {
    page: number;
    pageSize: number;
    shown: number;
    total: number;
    overall: number;
    filtered: boolean;
}): string {
    if (shown === 0) return 'Mostrando 0 de 0';
    if (filtered)
        return `Mostrando ${total} ${total === 1 ? 'usuario filtrado' : 'usuarios filtrados'} de ${overall}`;
    const first = (page - 1) * pageSize + 1;
    return `Mostrando ${first}-${first + shown - 1} de ${total}`;
}

/** Id de usuario como se enseña: `USR-001` (tres cifras como mínimo). No hay columna: se deriva del id. */
export function userNumber(id: number): string {
    return `USR-${String(id).padStart(3, '0')}`;
}

/** Nombre y apellidos de una cuenta, o su correo si no dio nombre. */
export function userFullName(user: {
    name: string | null;
    lastName: string | null;
    email: string;
}): string {
    const full = [user.name, user.lastName]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ');
    return full || user.email;
}

/** `YYYY-MM-DD` de la BD como `15 / 03 / 1992` (Figma: Fecha de nacimiento). */
export function formatBirthDate(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day} / ${month} / ${year}`;
}

const DAY_MS = 24 * 3_600_000;

/**
 * Fecha de registro con lo que hace: `12 ene 2026 (hace 14 días)` (Figma: Fecha de registro).
 *
 * @param registrationDate - `users.registration_date` (`datetime` UTC).
 * @param now - Reloj.
 */
export function registrationText(registrationDate: string, now: Date): string {
    const date = formatShortDate(registrationDate);
    const days = Math.max(
        0,
        Math.floor(
            (now.getTime() - new Date(`${registrationDate.replace(' ', 'T')}Z`).getTime()) / DAY_MS,
        ),
    );
    const ago = days === 0 ? 'hoy' : days === 1 ? 'hace 1 día' : `hace ${days} días`;
    return `${date} (${ago})`;
}

/** Roles a los que se puede pasar desde el actual (todos menos él). */
export function otherRoles(role: Role): Role[] {
    return ROLES.filter((r) => r !== role);
}

/** Une una lista en español: `A`, `A y B`, `A, B y C`. */
function joinList(items: readonly string[]): string {
    if (items.length <= 1) return items.join('');
    return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/**
 * Aviso que ve un administrador en el modal cuando se cambia a SÍ MISMO, según lo que pierde:
 * - Desactivarse o pasar a Cliente: pierde el panel entero.
 * - Pasar a Editor: solo deja de ver las secciones de administrador (las que el menú no ofrece al
 *   editor: Pedidos, Usuarios, Tipos de envío y Registro de actividad; salen de `ADMIN_NAV`).
 * - Pasar a Administrador (o seguir siéndolo): no pierde nada, sin aviso.
 *
 * @param change - `'disable'` para desactivar la cuenta, o el rol al que pasa.
 * @returns El aviso, o `null` si no pierde nada.
 */
export function selfChangeWarning(change: 'disable' | Role): string | null {
    if (change === 'disable' || change === 'Cliente')
        return 'Perderás el acceso al panel ahora mismo.';
    if (change === 'Editor') {
        const editorLabels = new Set(adminNavFor('Editor').map((item) => item.label));
        const lost = adminNavFor('Administrador')
            .map((item) => item.label)
            .filter((label) => !editorLabels.has(label));
        return `Dejarás de ver ${joinList(lost)}.`;
    }
    return null;
}
