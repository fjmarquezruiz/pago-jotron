import { AdminMobileHeader } from '@/components/admin/admin-mobile-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import type { Role } from '@/types/auth';

/**
 * Marco del panel de administración (Figma: admin-*): el menú lateral de 256 px a la izquierda,
 * fijo al desplazarse, y el contenido a su derecha, con relleno de 56 px a los lados, 40 arriba y
 * 80 abajo, y un ancho máximo de 1344 px. Por debajo de `lg` el menú pasa a un drawer (barra
 * superior). Lo monta `src/app/admin/(panel)/layout.tsx`.
 *
 * @param props.role - Rol de la sesión: decide los enlaces del menú.
 */
export function AdminShell({ role, children }: { role: Role; children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-background lg:flex-row">
            <AdminMobileHeader role={role} />
            <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
                <AdminSidebar role={role} />
            </div>
            <main className="min-w-0 flex-1 px-4 pt-6 pb-20 sm:px-8 lg:px-14 lg:pt-10">
                <div className="mx-auto flex w-full max-w-8xl flex-col gap-gap-xl">{children}</div>
            </main>
        </div>
    );
}
