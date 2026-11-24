import {
    HouseHeart,
    Grape,
    LayoutDashboard,
    Map,
    RotateCcw,
    ShoppingBag,
    Users,
    Truck,
    Wine,
    type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types/auth';

/** Un enlace del menú lateral del panel. */
export interface AdminNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    /** Roles que lo ven. Ocultarlo no protege la ruta: eso lo hacen el middleware y cada API. */
    roles: readonly Role[];
}

const EDITOR_UP = ['Editor', 'Administrador'] as const;
const ADMIN_ONLY = ['Administrador'] as const;

/**
 * Menú lateral del panel (Figma: admin-sidebar-roles), en orden. Sin Eventos, Blog ni Log de
 * errores: son del MVP2. El editor ve Panel, Catálogo y los cuatro valores asociados; el
 * administrador, además, Pedidos, Usuarios, Tipos de envío y Registro de actividad.
 *
 * Los iconos son los de Figma, también el de la copa en «Tipos de envío».
 */
export const ADMIN_NAV: readonly AdminNavItem[] = [
    { label: 'Panel de control', href: '/admin', icon: LayoutDashboard, roles: EDITOR_UP },
    { label: 'Catálogo', href: '/admin/productos', icon: Wine, roles: EDITOR_UP },
    { label: 'Bodegas', href: '/admin/bodegas', icon: HouseHeart, roles: EDITOR_UP },
    { label: 'Denominaciones', href: '/admin/denominaciones', icon: Map, roles: EDITOR_UP },
    { label: 'Variedades de uva', href: '/admin/uvas', icon: Grape, roles: EDITOR_UP },
    { label: 'Tipologías', href: '/admin/tipologias', icon: Wine, roles: EDITOR_UP },
    { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag, roles: ADMIN_ONLY },
    { label: 'Usuarios', href: '/admin/usuarios', icon: Users, roles: ADMIN_ONLY },
    { label: 'Tipos de envío', href: '/admin/envios', icon: Truck, roles: ADMIN_ONLY },
    {
        label: 'Registro de actividad',
        href: '/admin/auditoria',
        icon: RotateCcw,
        roles: ADMIN_ONLY,
    },
];

/**
 * Enlaces del menú que ve un rol.
 * @param role - Rol de la sesión.
 * @returns Los enlaces, en orden; ninguno para un cliente.
 */
export function adminNavFor(role: Role): AdminNavItem[] {
    return ADMIN_NAV.filter((item) => item.roles.includes(role));
}

/**
 * Dice si un enlace del menú es la página actual. `/admin` solo coincide con la ruta exacta (si no,
 * estaría marcado en todo el panel); los demás, también con sus subpáginas (`/admin/productos/3`).
 *
 * @param href - Ruta del enlace.
 * @param pathname - Ruta de la página.
 */
export function isAdminNavCurrent(href: string, pathname: string): boolean {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(`${href}/`);
}
