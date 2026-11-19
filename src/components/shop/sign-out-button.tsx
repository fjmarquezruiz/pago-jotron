'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { NavbarItem } from '@/components/ui/navbar';
import { prepareCartSignOut } from '@/stores/cart-sync';

/**
 * "Cerrar sesión" de la cabecera, en el sitio de "Iniciar sesión" cuando hay sesión. Antes de
 * cerrarla guarda en el servidor lo último que se cambió en el carrito y vacía el carrito del
 * navegador (`prepareCartSignOut`): en un ordenador compartido, la persona siguiente no debe ver el
 * carrito de la anterior. El del cliente sigue guardado en su cuenta para la próxima vez.
 *
 * Vuelve a `/productos` (con la sesión cerrada, desde `/checkout` o una página privada no habría
 * adónde quedarse) y refresca, para que la cabecera vuelva a decir "Iniciar sesión".
 *
 * @example
 * <SignOutButton />
 */
export function SignOutButton() {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    async function handleSignOut() {
        setPending(true);
        try {
            await prepareCartSignOut();
            // Sin redirección de next-auth (que usa NEXTAUTH_URL): se navega desde aquí, como en el login.
            await signOut({ redirect: false });
            router.push('/productos');
            router.refresh();
        } finally {
            // Si falla (sin red), el botón vuelve a poder pulsarse en vez de quedar bloqueado.
            setPending(false);
        }
    }

    return (
        <NavbarItem asChild className="hidden lg:inline-flex">
            <button type="button" onClick={handleSignOut} disabled={pending}>
                Cerrar sesión
            </button>
        </NavbarItem>
    );
}
