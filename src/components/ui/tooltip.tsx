'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Texto breve al pasar el ratón o enfocar (Figma: Tooltip). No pongas en él
 * información imprescindible: en móvil no hay hover.
 *
 * @example
 * <Tooltip>
 *     <TooltipTrigger asChild><IconButton aria-label="Favorito"><Heart /></IconButton></TooltipTrigger>
 *     <TooltipContent>Añadir a favoritos</TooltipContent>
 * </Tooltip>
 */
function Tooltip({
    delayDuration = 200,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & { delayDuration?: number }) {
    return (
        <TooltipPrimitive.Provider delayDuration={delayDuration}>
            <TooltipPrimitive.Root {...props} />
        </TooltipPrimitive.Provider>
    );
}

const TooltipTrigger = TooltipPrimitive.Trigger;

const tooltipVariants = cva(
    'z-50 max-w-xs border shadow-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0',
    {
        variants: {
            type: {
                default: 'border-primary bg-primary text-primary-foreground [--tip:var(--primary)]',
                info: 'border-info bg-info-subtle text-info [--tip:var(--info)]',
                success: 'border-success bg-success-subtle text-success [--tip:var(--success)]',
                warning: 'border-warning bg-warning-subtle text-warning [--tip:var(--warning)]',
                error: 'border-destructive bg-destructive-subtle text-destructive [--tip:var(--destructive)]',
            },
            size: {
                sm: 'rounded-xs px-inset-xs py-inset-xs text-xs',
                md: 'rounded-sm px-inset-sm py-inset-xs text-sm',
                lg: 'rounded-md px-inset-md py-inset-xs text-base',
            },
        },
        defaultVariants: { type: 'default', size: 'md' },
    },
);

export interface TooltipContentProps
    extends
        React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
        VariantProps<typeof tooltipVariants> {
    /** Muestra la flecha (por defecto, sí). */
    hasArrow?: boolean;
}

/**
 * Burbuja del tooltip (Figma: Tooltip). `type` cambia el color (error, info...) y
 * `size` el tamaño del texto: sm 12, md 14, lg 16 px.
 */
const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    TooltipContentProps
>(({ className, sideOffset = 6, type, size, hasArrow = true, children, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(tooltipVariants({ type, size }), className)}
            {...props}
        >
            {children}
            {hasArrow && <TooltipPrimitive.Arrow className="fill-(--tip)" width={10} height={5} />}
        </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent };
