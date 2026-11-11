import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

/**
 * Paginación (Figma: Pagination). Contenedor `nav` con `aria-label`.
 * Variantes de Figma: `full` (números y elipsis), `compact` (pocas páginas, sin elipsis)
 * y `mobile` (anterior, `PaginationSummary` y siguiente).
 *
 * @example
 * <Pagination>
 *     <PaginationContent>
 *         <PaginationItem><PaginationPrevious href="?page=1" /></PaginationItem>
 *         <PaginationItem><PaginationLink href="?page=2" isActive>2</PaginationLink></PaginationItem>
 *         <PaginationItem><PaginationNext href="?page=3" /></PaginationItem>
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
};

const linkSizes = { sm: 'xxs', md: 'xs', lg: 'lg' } as const;

/** Enlace a una página (Figma: PaginationItem). */
function PaginationLink({ className, isActive, size = 'md', ...props }: PaginationLinkProps) {
    return (
        <a
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                buttonVariants({ variant: isActive ? 'brand' : 'outline', size: linkSizes[size] }),
                'min-w-control-xs px-inset-2xs',
                size === 'sm' && 'min-w-control-xxs',
                size === 'lg' && 'min-w-control-lg',
                className,
            )}
            {...props}
        />
    );
}

/** Enlace a la página anterior. */
function PaginationPrevious({ className, ...props }: PaginationLinkProps) {
    return (
        <PaginationLink
            aria-label="Página anterior"
            className={cn('gap-1 px-inset-sm', className)}
            {...props}
        >
            <ChevronLeft aria-hidden="true" />
            <span className="hidden sm:inline">Anterior</span>
        </PaginationLink>
    );
}

/** Enlace a la página siguiente. */
function PaginationNext({ className, ...props }: PaginationLinkProps) {
    return (
        <PaginationLink
            aria-label="Página siguiente"
            className={cn('gap-1 px-inset-sm', className)}
            {...props}
        >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight aria-hidden="true" />
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

/** Puntos suspensivos, no interactivos. */
function PaginationEllipsis({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex size-control-xs items-center justify-center text-muted-foreground',
                className,
            )}
            {...props}
        >
            <MoreHorizontal className="size-4" />
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
