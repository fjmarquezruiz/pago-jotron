import * as React from 'react';
import { Slot } from 'radix-ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

/**
 * Paginación (Figma: Pagination). Contenedor `nav` con `aria-label`.
 * Variantes de Figma: `full` (números y elipsis), `compact` (pocas páginas, sin elipsis)
 * y `mobile` (anterior, `PaginationSummary` y siguiente).
 *
 * Para que cada página sea un enlace de verdad (se abre en otra pestaña, es indexable y funciona con el botón Atrás),
 * usa `asChild` con el `Link` de Next. La página de la primera o la última, sin destino, va con
 * `disabled`.
 *
 * @example
 * <Pagination>
 *     <PaginationContent>
 *         <PaginationItem><PaginationPrevious href="?page=1" /></PaginationItem>
 *         <PaginationItem><PaginationLink href="?page=2" isActive>2</PaginationLink></PaginationItem>
 *         <PaginationItem>
 *             <PaginationNext asChild><Link href="/productos?page=3" /></PaginationNext>
 *         </PaginationItem>
 *     </PaginationContent>
 * </Pagination>
 */
function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
    return (
        <nav
            aria-label="Paginación"
            className={cn('mx-auto flex w-full justify-center', className)}
            {...props}
        />
    );
}

/** Lista de páginas. */
const PaginationContent = React.forwardRef<
    HTMLUListElement,
    React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex items-center gap-gap-2xs', className)} {...props} />
));
PaginationContent.displayName = 'PaginationContent';

/** Elemento de la lista. */
const PaginationItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
    (props, ref) => <li ref={ref} {...props} />,
);
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    /** Página actual: fondo de marca y `aria-current="page"`. */
    isActive?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /**
     * Estilo cuando no es la página actual: `outline` (por defecto, los números) o `ghost` (el
     * "Anterior" y el "Siguiente" de la talla lg del diseño, sin borde).
     */
    variant?: 'outline' | 'ghost';
    /** Aplica los estilos a su hijo, por ejemplo un `Link` de `next/link`. */
    asChild?: boolean;
    /**
     * Sin destino (no hay página anterior o siguiente): pinta un enlace sin `href`, con
     * `aria-disabled="true"` y el texto atenuado. No se puede pulsar ni enfocar.
     */
    disabled?: boolean;
};

const linkSizes = { sm: 'xxs', md: 'xs', lg: 'lg' } as const;

/** Enlace a una página (Figma: PaginationItem). */
function PaginationLink({
    className,
    isActive,
    size = 'md',
    variant = 'outline',
    asChild = false,
    disabled = false,
    ...props
}: PaginationLinkProps) {
    const classes = cn(
        buttonVariants({ variant: isActive ? 'brand' : variant, size: linkSizes[size] }),
        'min-w-control-xs px-inset-2xs',
        size === 'sm' && 'min-w-control-xxs',
        size === 'lg' && 'min-w-control-lg',
        disabled && 'text-muted-foreground',
        className,
    );

    if (disabled) {
        return (
            <a role="link" aria-disabled="true" className={classes} {...props} href={undefined} />
        );
    }

    const Comp = asChild ? Slot.Root : 'a';
    return <Comp aria-current={isActive ? 'page' : undefined} className={classes} {...props} />;
}

/**
 * Pone `content` como contenido del hijo (un `Link`) cuando se usa `asChild`, igual que hace
 * `NavbarItem`; sin `asChild`, devuelve el contenido tal cual.
 */
function withContent(asChild: boolean, children: React.ReactNode, content: React.ReactNode) {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(
            children as React.ReactElement<{ children?: React.ReactNode }>,
            {},
            content,
        );
    }
    return content;
}

/**
 * Enlace a la página anterior. Con `asChild`, el hijo (un `Link` de Next) recibe la flecha y el
 * texto. En la talla lg del diseño pasa `variant="ghost"`: botón sin borde con 24 px de relleno.
 */
function PaginationPrevious({
    className,
    asChild = false,
    disabled,
    size,
    children,
    ...props
}: PaginationLinkProps) {
    const content = (
        <>
            <ArrowLeft aria-hidden="true" />
            <span className="hidden sm:inline">Anterior</span>
        </>
    );
    return (
        <PaginationLink
            aria-label="Página anterior"
            size={size}
            disabled={disabled}
            asChild={asChild && !disabled}
            className={cn(size === 'lg' ? 'px-inset-xl' : 'gap-1 px-inset-sm', className)}
            {...props}
        >
            {withContent(asChild && !disabled, children, content)}
        </PaginationLink>
    );
}

/**
 * Enlace a la página siguiente. Con `asChild`, el hijo (un `Link` de Next) recibe el texto y la
 * flecha. En la talla lg del diseño pasa `variant="ghost"`: botón sin borde con 24 px de relleno.
 */
function PaginationNext({
    className,
    asChild = false,
    disabled,
    size,
    children,
    ...props
}: PaginationLinkProps) {
    const content = (
        <>
            <span className="hidden sm:inline">Siguiente</span>
            <ArrowRight aria-hidden="true" />
        </>
    );
    return (
        <PaginationLink
            aria-label="Página siguiente"
            size={size}
            disabled={disabled}
            asChild={asChild && !disabled}
            className={cn(size === 'lg' ? 'px-inset-xl' : 'gap-1 px-inset-sm', className)}
            {...props}
        >
            {withContent(asChild && !disabled, children, content)}
        </PaginationLink>
    );
}

/**
 * Texto "Página X de Y" para la paginación móvil (Figma: Pagination variant=mobile).
 * Úsalo entre `PaginationPrevious` y `PaginationNext` en lugar de los números.
 *
 * @example
 * <PaginationSummary page={3} total={10} />
 */
function PaginationSummary({
    page,
    total,
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement> & { page: number; total: number }) {
    return (
        <span
            aria-live="polite"
            className={cn('px-inset-sm text-sm whitespace-nowrap', className)}
            {...props}
        >
            Página {page} de {total}
        </span>
    );
}

const ellipsisSizes = {
    sm: 'size-control-xxs text-xs',
    md: 'size-control-xs text-xs',
    lg: 'h-control-lg min-w-control-lg text-base',
} as const;

/** Puntos suspensivos (Figma: PaginationItem type=ellipsis): texto atenuado, no interactivo. */
function PaginationEllipsis({
    className,
    size = 'md',
    ...props
}: React.HTMLAttributes<HTMLSpanElement> & { size?: 'sm' | 'md' | 'lg' }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex items-center justify-center font-medium text-muted-foreground',
                ellipsisSizes[size],
                className,
            )}
            {...props}
        >
            …
        </span>
    );
}

export {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
    PaginationSummary,
};
