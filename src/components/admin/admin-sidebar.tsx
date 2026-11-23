'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sidebar } from '@/components/ui/sidebar';
import { AdminNavLinks } from '@/components/admin/admin-nav-links';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/auth';

/**
 * Menú lateral del panel (Figma: admin-sidebar): 256 px, el logo arriba y los enlaces del rol.
 *
 * @param props.role - Rol de la sesión: el editor ve el catálogo; el administrador, todo.
 * @param props.className - Clases extra (el drawer móvil lo estira a todo el ancho).
 */
export function AdminSidebar({ role, className }: { role: Role; className?: string }) {
    return (
        <Sidebar
            variant="admin"
            className={cn(className)}
            header={
                <Link href="/admin" aria-label="Pago de Jotrón, ir al panel de control">
                    <Image src="/images/brand/logo.svg" alt="" width={165} height={23} priority />
                </Link>
            }
        >
            <AdminNavLinks role={role} />
        </Sidebar>
    );
}
