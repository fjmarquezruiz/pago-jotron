'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { prepareCartSignOut } from '@/stores/cart-sync';

/**
 * Cierra la sesión (la cabecera y el menú de la cuenta comparten el mismo cierre). Antes de
 * cerrarla guarda en el servidor lo último que se cambió en el carrito y vacía el carrito del
 * navegador (`prepareCartSignOut`): en un ordenador compartido, la persona siguiente no debe ver el
 * carrito de la anterior. El del cliente sigue guardado en su cuenta para la próxima vez.
 *
 * Vuelve a `/productos` (con la sesión cerrada, desde una página privada no habría adónde
 * quedarse) y refresca, para que la cabecera vuelva a decir "Iniciar sesión".
 *
 * @returns `pending` mientras se cierra y `handleSignOut` para llamarlo desde el botón.
 *
 * @example
 * const { pending, handleSignOut } = useSignOut();
 * <button type="button" onClick={handleSignOut} disabled={pending}>Cerrar sesión</button>
 */
export function useSignOut() {
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

    return { pending, handleSignOut };
}
