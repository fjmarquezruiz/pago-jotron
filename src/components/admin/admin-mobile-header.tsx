'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import type { Role } from '@/types/auth';

/**
 * Barra superior del panel en pantallas pequeñas (por debajo de `lg`), con el botón que abre el
 * menú lateral en un drawer. Figma solo trae el panel a 1920 px: esta barra es la adaptación, con
 * los mismos componentes. El drawer se cierra al cambiar de página.
 *
 * @param props.role - Rol de la sesión.
 */
export function AdminMobileHeader({ role }: { role: Role }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // Al navegar, el menú se cierra.
    useEffect(() => setOpen(false), [pathname]);

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 lg:hidden">
            <Link
                href="/admin"
                aria-label="Pago de Jotrón, ir al panel de control"
                className="flex"
            >
                <Image src="/images/brand/logo-mobile.svg" alt="" width={87} height={48} priority />
            </Link>
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <IconButton aria-label="Abrir el menú del panel" variant="ghost">
                        <Menu />
                    </IconButton>
                </DrawerTrigger>
                <DrawerContent position="left" size="sm" className="p-0">
                    <DrawerTitle className="sr-only">Menú del panel</DrawerTitle>
                    <DrawerDescription className="sr-only">
                        Secciones del panel de administración.
                    </DrawerDescription>
                    <AdminSidebar role={role} className="w-full border-r-0" />
                </DrawerContent>
            </Drawer>
        </header>
    );
}
