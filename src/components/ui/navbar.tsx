'use client';

import * as React from 'react';
import { Slot } from 'radix-ui';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/button';
import {
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';

const NavbarContext = React.createContext<{ inverse: boolean }>({ inverse: false });

const navbarVariants = {
    default: 'border-b border-border bg-background',
    transparent: 'border-b border-border bg-transparent',
    elevated: 'border-b border-border bg-background shadow-sm',
    inverse: 'border-b border-primary bg-primary text-primary-foreground',
} as const;

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * Estilo de la barra (Figma: variant). `transparent` para ir sobre una imagen de portada,
     * `elevated` con sombra al hacer scroll e `inverse` sobre fondo oscuro.
     */
    variant?: keyof typeof navbarVariants;
    /** Logo o nombre de la tienda, a la izquierda. */
    brand?: React.ReactNode;
    /** Acciones a la derecha (buscar, carrito, usuario). */
    actions?: React.ReactNode;
    /** Fija la barra arriba al hacer scroll. */
    sticky?: boolean;
    /** Título del panel móvil. */
    menuTitle?: string;
}

/**
 * Barra de navegación principal (Figma: Navbar). En escritorio enseña los `NavbarItem`
 * en línea; por debajo de `md` los mueve a un `Drawer` que se abre con el botón de menú.
 *
 * @example
 * <Navbar brand={<Logo />} actions={<CartButton />}>
 *     <NavbarItem href="/productos" current>Vinos</NavbarItem>
 * </Navbar>
 */
const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
    (
        {
            className,
            variant = 'default',
            brand,
            actions,
            sticky,
            menuTitle = 'Menú',
            children,
            ...props
        },
        ref,
    ) => (
        <NavbarContext.Provider value={{ inverse: variant === 'inverse' }}>
            <header
                ref={ref}
                className={cn(
                    'z-40 w-full',
                    navbarVariants[variant],
                    sticky && 'sticky top-0',
                    className,
                )}
                {...props}
            >
                <div className="container-main flex h-16 items-center gap-gap-md">
                    {children && (
                        <Drawer>
                            <DrawerTrigger asChild>
                                <IconButton
                                    variant="ghost"
                                    aria-label="Abrir menú"
                                    className={cn(
                                        '-ml-2 md:hidden',
                                        variant === 'inverse' &&
                                            'text-primary-foreground hover:bg-primary-foreground/10',
                                    )}
                                >
                                    <Menu />
                                </IconButton>
                            </DrawerTrigger>
                            <NavbarContext.Provider value={{ inverse: false }}>
                                <DrawerContent position="left" size="sm">
                                    <DrawerHeader>
                                        <DrawerTitle>{menuTitle}</DrawerTitle>
                                    </DrawerHeader>
                                    <DrawerBody>
                                        <nav
                                            aria-label="Principal"
                                            className="flex flex-col gap-gap-2xs"
                                        >
                                            {children}
                                        </nav>
                                    </DrawerBody>
                                </DrawerContent>
                            </NavbarContext.Provider>
                        </Drawer>
                    )}
                    {brand && <div className="flex shrink-0 items-center">{brand}</div>}
                    {children && (
                        <nav
                            aria-label="Principal"
                            className="hidden items-center gap-gap-2xs md:flex"
                        >
                            {children}
                        </nav>
                    )}
                    {actions && (
                        <div className="ml-auto flex items-center gap-gap-xs">{actions}</div>
                    )}
                </div>
            </header>
        </NavbarContext.Provider>
    ),
);
Navbar.displayName = 'Navbar';

export interface NavbarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Página actual: añade `aria-current="page"` y el estilo de marca. */
    current?: boolean;
    /** Renderiza el hijo (por ejemplo `next/link`) en lugar de un `<a>`. */
    asChild?: boolean;
    /** Icono antes del texto (Figma: iconLeft). */
    icon?: React.ReactNode;
}

/**
 * Enlace de la barra de navegación (Figma: NavbarItem). Dentro de un `Navbar` con
 * `variant="inverse"` cambia solo a los colores invertidos.
 *
 * @example
 * <NavbarItem asChild current><Link href="/productos">Vinos</Link></NavbarItem>
 */
const NavbarItem = React.forwardRef<HTMLAnchorElement, NavbarItemProps>(
    ({ className, current, asChild, icon, children, ...props }, ref) => {
        const Comp = asChild ? Slot.Root : 'a';
        const { inverse } = React.useContext(NavbarContext);
        const child = asChild && React.isValidElement(children) ? children : null;
        const label = child ? (child.props as { children?: React.ReactNode }).children : children;
        const content = (
            <>
                {icon && (
                    <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-4">
                        {icon}
                    </span>
                )}
                {label}
            </>
        );
        return (
            <Comp
                ref={ref}
                aria-current={current ? 'page' : undefined}
                className={cn(
                    'inline-flex min-h-control-sm items-center gap-gap-xs rounded-md px-inset-sm py-inset-xs text-sm font-medium transition-colors',
                    inverse
                        ? current
                            ? 'bg-primary-foreground/15 text-primary-foreground'
                            : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                        : current
                          ? 'bg-brand-subtle text-brand'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    className,
                )}
                {...props}
            >
                {child
                    ? React.cloneElement(
                          child as React.ReactElement<{ children?: React.ReactNode }>,
                          {},
                          content,
                      )
                    : content}
            </Comp>
        );
    },
);
NavbarItem.displayName = 'NavbarItem';

export { Navbar, NavbarItem };
