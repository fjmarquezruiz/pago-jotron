'use client';

import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressVariants = cva('relative w-full overflow-hidden rounded-full bg-muted', {
    variants: {
        size: { sm: 'h-1', md: 'h-2', lg: 'h-3' },
        variant: {
            default: '[&>div]:bg-brand',
            success: '[&>div]:bg-success',
            warning: '[&>div]:bg-warning',
            error: '[&>div]:bg-destructive',
        },
    },
    defaultVariants: { size: 'md', variant: 'default' },
});

export interface ProgressProps
    extends
        React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
        VariantProps<typeof progressVariants> {}

/**
 * Barra de progreso (Figma: ProgressBar). Sin `value` se muestra indeterminada.
 * Necesita `aria-label` o una etiqueta visible asociada.
 *
 * @example
 * <Progress value={65} aria-label="Subiendo imágenes" />
 */
const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
    ({ className, value, size, variant, ...props }, ref) => {
        const indeterminate = value === null || value === undefined;
        return (
            <ProgressPrimitive.Root
                ref={ref}
                value={value}
                className={cn(progressVariants({ size, variant }), className)}
                {...props}
            >
                <ProgressPrimitive.Indicator
                    className={cn(
                        'h-full rounded-full transition-transform',
                        indeterminate ? 'w-1/3 animate-pulse' : 'w-full',
                    )}
                    style={
                        indeterminate ? undefined : { transform: `translateX(-${100 - value}%)` }
                    }
                />
            </ProgressPrimitive.Root>
        );
    },
);
Progress.displayName = 'Progress';

export { Progress };
