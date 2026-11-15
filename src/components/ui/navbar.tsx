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

/**
 * `inverse`: barra sobre fondo oscuro. `plain`: los `NavbarItem` van como texto suelto, sin
 * relleno ni fondo (los enlaces de la barra centrada).
 */
const NavbarContext = React.createContext<{ inverse: boolean; plain: boolean }>({
    inverse: false,
    plain: false,
});

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
    /**
     * Disposición de la barra. `default`: logo a la izquierda y enlaces a su lado, 64 px de alto
     * (cambia a menú móvil por debajo de `md`). `centered` (la de la tienda): rejilla de tres
     * columnas con los enlaces a la izquierda, el logo en el centro y las acciones a la derecha,
     * de 80 px de alto en escritorio y 68 px en móvil, con ancho máximo de 1440 px (cambia a
     * menú móvil por debajo de `lg`). En `centered` los `NavbarItem` van como texto suelto.
     */
    layout?: 'default' | 'centered';
    /** Logo o nombre de la tienda: a la izquierda (`default`) o centrado (`centered`). */
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
 * en línea; por debajo de `md` (`lg` con `layout="centered"`) los mueve a un `Drawer` que se
 * abre con el botón de menú.
 *
 * @example
 * <Navbar brand={<Logo />} actions={<CartButton />}>
 *     <NavbarItem href="/productos" current>Vinos</NavbarItem>
 * </Navbar>
 *
 * @example
 * <Navbar layout="centered" brand={<Logo />} actions={<NavbarItem href="/carrito">Carrito (0)</NavbarItem>}>
 *     <NavbarItem href="/productos">La tienda</NavbarItem>
 * </Navbar>
 */
const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
    (
        {
            className,
            variant = 'default',
            layout = 'default',
            brand,
            actions,
            sticky,
            menuTitle = 'Menú',
            children,
            ...props
        },
        ref,
    ) => {
        const centered = layout === 'centered';

        const drawer = children && (
            <Drawer>
                <DrawerTrigger asChild>
                    <IconButton
                        variant="ghost"
                        aria-label="Abrir menú"
                        className={cn(
                            centered ? 'lg:hidden' : '-ml-2 md:hidden',
                            variant === 'inverse' &&
                                'text-primary-foreground hover:bg-primary-foreground/10',
                        )}
                    >
                        <Menu className={centered ? 'size-4' : undefined} />
                    </IconButton>
                </DrawerTrigger>
                <NavbarContext.Provider value={{ inverse: false, plain: false }}>
                    <DrawerContent position="left" size="sm">
                        <DrawerHeader>
                            <DrawerTitle>{menuTitle}</DrawerTitle>
                        </DrawerHeader>
                        <DrawerBody>
                            <nav aria-label="Principal" className="flex flex-col gap-gap-2xs">
                                {children}
                            </nav>
                        </DrawerBody>
                    </DrawerContent>
                </NavbarContext.Provider>
            </Drawer>
        );

        const nav = children && (
            <nav
                aria-label="Principal"
                className={cn(
                    'hidden items-center',
                    centered ? 'gap-9 lg:flex' : 'gap-gap-2xs md:flex',
                )}
            >
                {children}
            </nav>
        );

        return (
            <NavbarContext.Provider value={{ inverse: variant === 'inverse', plain: centered }}>
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
                    {centered ? (
                        <div className="px-6">
                            <div className="mx-auto grid h-17 w-full max-w-9xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 py-2.5 lg:h-20 lg:gap-x-8 lg:py-3">
                                <div className="col-start-1 flex items-center justify-self-start">
                                    {drawer}
                                    {nav}
                                </div>
                                {brand && (
                                    <div className="col-start-2 flex items-center justify-self-center">
                                        {brand}
                                    </div>
                                )}
                                {actions && (
                                    <div className="col-start-3 flex items-center gap-9 justify-self-end">
                                        {actions}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="container-main flex h-16 items-center gap-gap-md">
                            {drawer}
                            {brand && <div className="flex shrink-0 items-center">{brand}</div>}
                            {nav}
                            {actions && (
                                <div className="ml-auto flex items-center gap-gap-xs">
                                    {actions}
                                </div>
                            )}
                        </div>
                    )}
                </header>
            </NavbarContext.Provider>
        );
    },
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
 * `variant="inverse"` cambia solo a los colores invertidos, y con `layout="centered"` se pinta
 * como texto suelto de 14 px (48 px de alto, sin relleno ni fondo; subrayado al pasar el ratón).
 * El `Drawer` móvil lo vuelve a pintar como enlace normal.
 *
 * @example
 * <NavbarItem asChild current><Link href="/productos">Vinos</Link></NavbarItem>
 */
const NavbarItem = React.forwardRef<HTMLAnchorElement, NavbarItemProps>(
    ({ className, current, asChild, icon, children, ...props }, ref) => {
        const Comp = asChild ? Slot.Root : 'a';
        const { inverse, plain } = React.useContext(NavbarContext);
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
                    plain
                        ? [
                              'inline-flex h-control-lg items-center gap-gap-xs text-sm font-medium underline-offset-4 hover:underline hover:decoration-2',
                              inverse ? 'text-primary-foreground' : 'text-foreground',
                          ]
                        : [
                              'inline-flex min-h-control-sm items-center gap-gap-xs rounded-md px-inset-sm py-inset-xs text-sm font-medium transition-colors',
                              inverse
                                  ? current
                                      ? 'bg-primary-foreground/15 text-primary-foreground'
                                      : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                                  : current
                                    ? 'bg-brand-subtle text-brand'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          ],
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
