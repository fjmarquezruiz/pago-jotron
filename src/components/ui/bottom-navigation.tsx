import * as React from 'react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * Barra de navegación inferior para móvil (Figma: BottomNavigation). Lleva de 3 a 5
 * `BottomNavigationItem`. Por defecto se oculta desde `md`.
 *
 * @example
 * <BottomNavigation><BottomNavigationItem href="/" icon={<Home />} label="Inicio" current /></BottomNavigation>
 */
const BottomNavigation = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    ({ className, ...props }, ref) => (
        <nav
            ref={ref}
            aria-label="Navegación inferior"
            className={cn(
                'flex w-full items-stretch justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden',
                className,
            )}
            {...props}
        />
    ),
);
BottomNavigation.displayName = 'BottomNavigation';

export interface BottomNavigationItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Icono de Lucide. */
    icon: React.ReactNode;
    /** Texto bajo el icono. */
    label: string;
    /** Página actual: añade `aria-current="page"` y el indicador. */
    current?: boolean;
    /** Contador opcional (por ejemplo, artículos del carrito). */
    badge?: number;
    /** Renderiza el hijo (por ejemplo `next/link`) en lugar de un `<a>`. */
    asChild?: boolean;
    /** Oculta la etiqueta visible; queda para lectores de pantalla (Figma: showLabel). */
    hideLabel?: boolean;
}

/**
 * Elemento de la barra inferior: icono con indicador redondeado y etiqueta.
 * El área táctil mide al menos 56 × 64 px.
 */
const BottomNavigationItem = React.forwardRef<HTMLAnchorElement, BottomNavigationItemProps>(
    ({ className, icon, label, current, badge, asChild, hideLabel, children, ...props }, ref) => {
        const Comp = asChild ? Slot.Root : 'a';
        const content = (
            <>
                <span
                    className={cn(
                        'relative flex h-8 w-14 items-center justify-center rounded-full transition-colors [&_svg]:size-5',
                        current && 'bg-brand-subtle text-brand',
                    )}
                    aria-hidden="true"
                >
                    {icon}
                    {badge !== undefined && badge > 0 && (
                        <span className="absolute top-0 right-2 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-2xs font-medium text-brand-foreground">
                            {badge > 99 ? '99+' : badge}
                        </span>
                    )}
                </span>
                <span
                    className={cn(
                        'text-xs',
                        current && 'font-medium text-brand',
                        hideLabel && 'sr-only',
                    )}
                >
                    {label}
                    {badge !== undefined && badge > 0 && (
                        <span className="sr-only"> ({badge})</span>
                    )}
                </span>
            </>
        );
        return (
            <Comp
                ref={ref}
                aria-current={current ? 'page' : undefined}
                className={cn(
                    'group flex min-h-16 min-w-14 flex-1 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    className,
                )}
                {...props}
            >
                {asChild && React.isValidElement(children)
                    ? React.cloneElement(
                          children as React.ReactElement<{ children?: React.ReactNode }>,
                          {},
                          content,
                      )
                    : content}
            </Comp>
        );
    },
);
BottomNavigationItem.displayName = 'BottomNavigationItem';

export { BottomNavigation, BottomNavigationItem };
