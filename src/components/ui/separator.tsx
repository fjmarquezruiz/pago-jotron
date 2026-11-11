'use client';

import * as React from 'react';
import { Separator as SeparatorPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * Separador con texto en el centro (Figma: Divider con hasLabel), por ejemplo "o" entre
 * el login con correo y el de Google.
 *
 * @example
 * <SeparatorWithLabel>o</SeparatorWithLabel>
 */
function SeparatorWithLabel({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            role="separator"
            aria-orientation="horizontal"
            className={cn(
                'flex w-full items-center gap-gap-sm text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * Línea separadora de 1 px (Figma: Divider). Decorativa por defecto.
 * `inset="start"` deja 48 px de sangría al inicio; `both`, 16 px a cada lado.
 *
 * @example
 * <Separator className="my-gap-md" />
 */
const Separator = React.forwardRef<
    React.ElementRef<typeof SeparatorPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
        inset?: 'none' | 'start' | 'both';
    }
>(({ className, orientation = 'horizontal', decorative = true, inset = 'none', ...props }, ref) => (
    <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
            'shrink-0 bg-border',
            orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
            orientation === 'horizontal' && inset === 'start' && 'ml-inset-3xl w-auto',
            orientation === 'horizontal' && inset === 'both' && 'mx-inset-md w-auto',
            orientation === 'vertical' && inset !== 'none' && 'my-inset-md h-auto',
            className,
        )}
        {...props}
    />
));
Separator.displayName = 'Separator';

export { Separator, SeparatorWithLabel };
