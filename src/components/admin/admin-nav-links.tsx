'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { SidebarGroup, SidebarItem } from '@/components/ui/sidebar';
import { useSignOut } from '@/components/shop/use-sign-out';
import { adminNavFor, isAdminNavCurrent } from '@/lib/admin/nav';
import type { Role } from '@/types/auth';

/**
 * Enlaces del menú lateral del panel según el rol (Figma: admin-sidebar-roles) y, aparte, «Cerrar
 * sesión». Ocultar un enlace no protege la ruta: eso lo hacen el middleware y cada API (RNF3).
 *
 * @param props.role - Rol de la sesión.
 */
export function AdminNavLinks({ role }: { role: Role }) {
    const pathname = usePathname();
    const { pending, handleSignOut } = useSignOut();

    return (
        <>
            <SidebarGroup>
                {adminNavFor(role).map(({ label, href, icon: Icon }) => (
                    <SidebarItem
                        key={href}
                        asChild
                        icon={<Icon />}
                        current={isAdminNavCurrent(href, pathname)}
                    >
                        <Link href={href}>{label}</Link>
                    </SidebarItem>
                ))}
            </SidebarGroup>
            <SidebarItem asChild icon={<LogOut />}>
                <button type="button" onClick={handleSignOut} disabled={pending}>
                    Cerrar sesión
                </button>
            </SidebarItem>
        </>
    );
}
