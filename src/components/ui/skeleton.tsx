import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva('animate-pulse bg-muted', {
    variants: {
        variant: {
            text: 'h-4 w-full rounded-sm',
            circle: 'size-10 rounded-full',
            rectangle: 'rounded-md',
        },
    },
    defaultVariants: { variant: 'rectangle' },
});

export interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

/**
 * Bloque de carga (Figma: Skeleton). `variant="text"` da una línea de texto,
 * `circle` un avatar de 40 px y `rectangle` (por defecto) se dimensiona con clases.
 * La animación se desactiva con `prefers-reduced-motion`.
 *
 * @example
 * <Skeleton className="h-48 w-full rounded-xl" />
 * <Skeleton variant="text" className="w-2/3" />
 */
function Skeleton({ className, variant, ...props }: SkeletonProps) {
    return (
        <div
            aria-hidden="true"
            data-slot="skeleton"
            className={cn(skeletonVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Skeleton, skeletonVariants };
