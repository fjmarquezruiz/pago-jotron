'use client';

import * as React from 'react';
import { Collapsible, Slot } from 'radix-ui';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type SidebarVariant = 'default' | 'admin';

const SidebarContext = React.createContext<{ collapsed: boolean; variant: SidebarVariant }>({
    collapsed: false,
    variant: 'default',
});

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * `default`: el componente Sidebar de Figma (enlace actual en `brand-subtle`). `admin`: el
     * menú de las páginas del panel (Figma: admin-sidebar): fondo `muted`, logo centrado sin línea
     * debajo, enlaces de 40 px con el actual en `brand` sólido.
     */
    variant?: SidebarVariant;
    /** Solo iconos (64 px). Las etiquetas pasan a tooltip. */
    collapsed?: boolean;
    /** Cabecera (logo o nombre del panel). */
    header?: React.ReactNode;
    /** Pie (usuario, cerrar sesión). */
    footer?: React.ReactNode;
    /** Si se pasa, muestra el botón de plegar o desplegar en la cabecera (Figma: showCollapse). */
    onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * Navegación lateral del panel de administración (Figma: Sidebar). Mide 256 px,
 * o 64 px plegada.
 *
 * @example
 * <Sidebar header={<Logo />}><SidebarItem href="/admin/pedidos" icon={<Package />} current>Pedidos</SidebarItem></Sidebar>
 */
const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
    (
        {
            className,
            variant = 'default',
            collapsed = false,
            header,
            footer,
            onCollapsedChange,
            children,
            ...props
        },
        ref,
    ) => (
        <SidebarContext.Provider value={{ collapsed, variant }}>
            <aside
                ref={ref}
                data-collapsed={collapsed || undefined}
                className={cn(
                    'flex h-full flex-col border-r border-sidebar-border text-sidebar-foreground transition-[width]',
                    variant === 'admin'
                        ? 'gap-gap-xl bg-muted px-inset-xl py-inset-2xl'
                        : 'bg-sidebar',
                    collapsed ? 'w-16' : 'w-64',
                    className,
                )}
                {...props}
            >
                {variant === 'admin' && header && (
                    <div className="flex shrink-0 justify-center">{header}</div>
                )}
                {variant !== 'admin' && (header || onCollapsedChange) && (
                    <div
                        className={cn(
                            'flex h-16 shrink-0 items-center gap-gap-xs border-b border-sidebar-border',
                            collapsed ? 'justify-center' : 'justify-between px-inset-md',
                        )}
                    >
                        {!(collapsed && onCollapsedChange) && header}
                        {onCollapsedChange && (
                            <button
                                type="button"
                                onClick={() => onCollapsedChange(!collapsed)}
                                aria-label={collapsed ? 'Desplegar menú' : 'Plegar menú'}
                                aria-expanded={!collapsed}
                                className="inline-flex size-control-xs cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:size-4"
                            >
                                {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                            </button>
                        )}
                    </div>
                )}
                <nav
                    aria-label="Panel"
                    className={cn(
                        'flex flex-1 flex-col overflow-y-auto',
                        variant === 'admin' ? 'gap-gap-xs' : 'gap-gap-2xs p-inset-xs',
                    )}
                >
                    {children}
                </nav>
                {footer && variant !== 'admin' && (
                    <div className="shrink-0 border-t border-sidebar-border p-inset-xs">
                        {footer}
                    </div>
                )}
            </aside>
        </SidebarContext.Provider>
    ),
);
Sidebar.displayName = 'Sidebar';

/** Grupo de enlaces de la variante `admin`: 2 px entre ellos (Figma: NavigationGroup > Frame). */
const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex flex-col gap-gap-3xs', className)} {...props} />
    ),
);
SidebarGroup.displayName = 'SidebarGroup';

/** Título de un grupo de enlaces. Se oculta (solo lector de pantalla) con la barra plegada. */
const SidebarGroupLabel = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
    const { collapsed } = React.useContext(SidebarContext);
    return (
        <p
            ref={ref}
            className={cn(
                'px-inset-sm pt-inset-sm pb-1 text-xs font-medium text-muted-foreground',
                collapsed && 'sr-only',
                className,
            )}
            {...props}
        />
    );
});
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Icono de Lucide. */
    icon?: React.ReactNode;
    /** Página actual: añade `aria-current="page"` y el estilo de marca. */
    current?: boolean;
    /** Nivel de anidación (1 o 2). El 2 se sangra y no lleva icono. */
    level?: 1 | 2;
    /** Contenido a la derecha (contador, badge). Se oculta plegada. */
    trailing?: React.ReactNode;
    /** Renderiza el hijo (por ejemplo `next/link`) en lugar de un `<a>`. */
    asChild?: boolean;
}

/**
 * Enlace de la barra lateral (Figma: SidebarItem). Plegada, enseña solo el icono y
 * el texto sale en un tooltip.
 */
const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
    ({ className, icon, current, level = 1, trailing, asChild, children, ...props }, ref) => {
        const { collapsed, variant } = React.useContext(SidebarContext);
        const admin = variant === 'admin';
        const Comp = asChild ? Slot.Root : 'a';
        const child = asChild && React.isValidElement(children) ? children : null;
        const label = child ? (child.props as { children?: React.ReactNode }).children : children;
        const content = (
            <>
                {icon && (level === 1 || collapsed) && (
                    <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-4">
                        {icon}
                    </span>
                )}
                <span
                    className={cn(
                        'flex-1',
                        // En `admin`, como en Figma, el texto no se recorta: «Registro de actividad»
                        // roza el borde del enlace y se queda dentro de su relleno.
                        admin ? 'whitespace-nowrap' : 'truncate',
                        collapsed && 'sr-only',
                    )}
                >
                    {label}
                </span>
                {trailing && !collapsed && <span className="shrink-0">{trailing}</span>}
            </>
        );
        const item = (
            <Comp
                ref={ref}
                aria-current={current ? 'page' : undefined}
                className={cn(
                    admin
                        ? 'flex min-h-control-md w-full cursor-pointer items-center gap-gap-xs rounded-sm px-inset-lg py-inset-xs text-left text-sm font-medium transition-colors'
                        : 'flex min-h-control-sm items-center gap-gap-xs rounded-lg px-inset-sm text-sm transition-colors',
                    level === 2 && !collapsed && 'pl-9',
                    collapsed && 'justify-center px-0',
                    admin
                        ? current
                            ? 'bg-brand text-primary-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-50'
                        : current
                          ? 'bg-brand-subtle font-medium text-brand'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
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
        if (!collapsed) return item;
        return (
            <Tooltip>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
        );
    },
);
SidebarItem.displayName = 'SidebarItem';

export interface SidebarSubmenuProps {
    /** Texto del grupo. */
    label: React.ReactNode;
    /** Icono de Lucide. */
    icon?: React.ReactNode;
    /** Abierto al cargar. */
    defaultOpen?: boolean;
    /** Marca el grupo cuando contiene la página actual. */
    current?: boolean;
    /** `SidebarItem` con `level={2}`. */
    children: React.ReactNode;
}

/**
 * Grupo desplegable de la barra lateral (Figma: SidebarItem con hasChildren y expanded).
 * Plegada la barra, enseña solo los hijos con su icono.
 *
 * @example
 * <SidebarSubmenu label="Catálogo" icon={<Wine />} defaultOpen>
 *     <SidebarItem href="/admin/productos" level={2}>Vinos</SidebarItem>
 * </SidebarSubmenu>
 */
function SidebarSubmenu({ label, icon, defaultOpen, current, children }: SidebarSubmenuProps) {
    const { collapsed } = React.useContext(SidebarContext);
    if (collapsed) return <>{children}</>;
    return (
        <Collapsible.Root defaultOpen={defaultOpen} className="flex flex-col gap-gap-2xs">
            <Collapsible.Trigger
                className={cn(
                    'group flex min-h-control-sm w-full cursor-pointer items-center gap-gap-xs rounded-lg px-inset-sm text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    current ? 'font-medium text-brand' : 'text-sidebar-foreground',
                )}
            >
                {icon && (
                    <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-4">
                        {icon}
                    </span>
                )}
                <span className="flex-1 truncate">{label}</span>
                <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                />
            </Collapsible.Trigger>
            <Collapsible.Content className="flex flex-col gap-gap-2xs">
                {children}
            </Collapsible.Content>
        </Collapsible.Root>
    );
}

export { Sidebar, SidebarGroup, SidebarGroupLabel, SidebarItem, SidebarSubmenu };
