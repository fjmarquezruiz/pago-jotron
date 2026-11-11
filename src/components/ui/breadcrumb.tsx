import * as React from 'react';
import { Slot } from 'radix-ui';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Ruta de navegación (Figma: Breadcrumb). El separador por defecto es una barra "/".
 *
 * @example
 * <Breadcrumb>
 *     <BreadcrumbList>
 *         <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">Inicio</Link></BreadcrumbLink></BreadcrumbItem>
 *         <BreadcrumbSeparator />
 *         <BreadcrumbItem><BreadcrumbPage>Tintos</BreadcrumbPage></BreadcrumbItem>
 *     </BreadcrumbList>
 * </Breadcrumb>
 */
function Breadcrumb(props: React.ComponentProps<'nav'>) {
    return <nav aria-label="Ruta de navegación" {...props} />;
}

/** Lista ordenada de niveles. */
const BreadcrumbList = React.forwardRef<
    HTMLOListElement,
    React.OlHTMLAttributes<HTMLOListElement> & {
        /** Tamaño del texto: sm 12, md 14 (por defecto), lg 16 px. */
        size?: 'sm' | 'md' | 'lg';
    }
>(({ className, size = 'md', ...props }, ref) => (
    <ol
        ref={ref}
        className={cn(
            'flex flex-wrap items-center gap-gap-xs text-muted-foreground',
            { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size],
            className,
        )}
        {...props}
    />
));
BreadcrumbList.displayName = 'BreadcrumbList';

/** Nivel de la ruta. */
const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
    ({ className, ...props }, ref) => (
        <li
            ref={ref}
            className={cn('inline-flex items-center gap-gap-2xs', className)}
            {...props}
        />
    ),
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

/** Enlace a un nivel superior. Con `asChild` envuelve un `Link` de Next. */
const BreadcrumbLink = React.forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }
>(({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'a';
    return (
        <Comp
            ref={ref}
            className={cn(
                'rounded-xs underline-offset-4 transition-colors hover:text-foreground hover:underline hover:decoration-2',
                className,
            )}
            {...props}
        />
    );
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

/** Nivel actual (no es enlace). */
const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
    ({ className, ...props }, ref) => (
        <span
            ref={ref}
            aria-current="page"
            className={cn('font-medium text-foreground', className)}
            {...props}
        />
    ),
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

/** Separador decorativo entre niveles. */
function BreadcrumbSeparator({
    children,
    className,
    ...props
}: React.LiHTMLAttributes<HTMLLIElement>) {
    return (
        <li
            role="presentation"
            aria-hidden="true"
            className={cn('select-none', className)}
            {...props}
        >
            {children ?? '/'}
        </li>
    );
}

/** Niveles ocultos cuando la ruta está colapsada. */
function BreadcrumbEllipsis({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            role="presentation"
            aria-hidden="true"
            className={cn('flex size-5 items-center justify-center', className)}
            {...props}
        >
            <MoreHorizontal className="size-4" />
        </span>
    );
}

export {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
};
