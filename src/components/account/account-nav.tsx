'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useSignOut } from '@/components/shop/use-sign-out';
import { cn } from '@/lib/utils';
import { ACCOUNT_ITEMS, type AccountSection } from './account-items';

export type { AccountSection };

/** Un elemento del menú (Figma: SidebarItem de la cuenta): 40 px, icono de 16 px y texto `sm`. */
const itemClass =
    'flex min-h-control-md w-70 shrink-0 cursor-pointer items-center gap-gap-xs rounded-sm px-inset-lg py-inset-xs text-sm font-medium transition-colors';

/**
 * Menú de la cuenta, solo en escritorio (`lg`): en pantallas pequeñas esos enlaces van en el drawer de
 * la cabecera (`SiteHeader`). Datos personales, Historial de pedidos, Direcciones y Cerrar sesión (Figma:
 * Sidebar de account-*). El elemento de `current` va en `brand`; el resto, en `muted-foreground`.
 *
 * No usa `ui/sidebar`: ese es el de administración (256 px, borde, `brand-subtle`) y este es otro
 * componente en Figma (280 px, sin borde, `brand` sólido).
 *
 * @param props.current - Sección actual.
 */
export function AccountNav({ current }: { current: AccountSection }) {
    const { pending, handleSignOut } = useSignOut();
    return (
        <nav aria-label="Mi cuenta" className="hidden gap-gap-xs lg:flex lg:flex-col">
            {ACCOUNT_ITEMS.map(({ section, label, href, icon: Icon }) => (
                <Link
                    key={section}
                    href={href}
                    aria-current={section === current ? 'page' : undefined}
                    className={cn(
                        itemClass,
                        section === current
                            ? 'bg-brand text-primary-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    <span className="flex-1 whitespace-nowrap">{label}</span>
                </Link>
            ))}
            <button
                type="button"
                onClick={handleSignOut}
                disabled={pending}
                className={cn(
                    itemClass,
                    'text-muted-foreground hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
                )}
            >
                <LogOut aria-hidden="true" className="size-4 shrink-0" />
                <span className="flex-1 text-left whitespace-nowrap">Cerrar sesión</span>
            </button>
        </nav>
    );
}
