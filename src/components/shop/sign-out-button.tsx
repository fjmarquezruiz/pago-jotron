'use client';

import { LogOut } from 'lucide-react';
import { NavbarItem } from '@/components/ui/navbar';
import { useSignOut } from '@/components/shop/use-sign-out';

/**
 * "Cerrar sesión" de la cabecera, en el sitio de "Iniciar sesión" cuando hay sesión (`header`, solo
 * escritorio), o al final de la sección "Mi cuenta" del drawer móvil (`drawer`). El cierre (carrito
 * incluido) está en `useSignOut`, que comparte con el menú de la cuenta.
 *
 * @param props.placement - Dónde va: `header` (por defecto) o `drawer`.
 *
 * @example
 * <SignOutButton />
 * <SignOutButton placement="drawer" />
 */
export function SignOutButton({ placement = 'header' }: { placement?: 'header' | 'drawer' }) {
    const { pending, handleSignOut } = useSignOut();
    const drawer = placement === 'drawer';

    return (
        <NavbarItem
            asChild
            icon={drawer ? <LogOut /> : undefined}
            className={drawer ? 'lg:hidden' : 'hidden lg:inline-flex'}
        >
            <button type="button" onClick={handleSignOut} disabled={pending}>
                Cerrar sesión
            </button>
        </NavbarItem>
    );
}
