import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Icono de Lucide. Por defecto, una lupa. */
    icon?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    /** Acción para salir del vacío, por ejemplo `<Button>Ver catálogo</Button>`. */
    action?: React.ReactNode;
}

/**
 * Estado vacío (Figma: EmptyState): explica por qué no hay datos y ofrece una salida.
 *
 * @example
 * <EmptyState title="Aún no tienes pedidos" action={<Button asChild><Link href="/productos">Ver catálogo</Link></Button>} />
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ className, icon, title, description, action, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'flex flex-col items-center gap-gap-md px-inset-2xl py-inset-3xl text-center',
                className,
            )}
            {...props}
        >
            <div
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-8"
            >
                {icon ?? <Search />}
            </div>
            <div className="flex max-w-sm flex-col gap-gap-xs">
                <p className="text-base font-medium">{title}</p>
                {description && <p className="text-base text-muted-foreground">{description}</p>}
            </div>
            {action}
        </div>
    ),
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
