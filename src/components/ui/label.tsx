'use client';

import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
    'inline-flex items-center gap-gap-xs font-medium text-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]/field:opacity-50',
    {
        variants: {
            size: {
                xs: 'text-xs',
                sm: 'text-sm',
                md: 'text-sm',
                lg: 'text-base',
            },
        },
        defaultVariants: { size: 'md' },
    },
);

export interface LabelProps
    extends
        React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
        VariantProps<typeof labelVariants> {
    /** Indicador junto a la etiqueta: "Obligatorio" u "Opcional". */
    indicator?: 'none' | 'required' | 'optional';
}

/**
 * Etiqueta de campo (Figma: FormLabel). El indicador es visual; el campo
 * sigue necesitando `required` o `aria-required` para los lectores de pantalla.
 *
 * @example
 * <Label htmlFor="email" indicator="required">Correo electrónico</Label>
 */
const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
    ({ className, size, indicator = 'none', children, ...props }, ref) => (
        <LabelPrimitive.Root
            ref={ref}
            className={cn(labelVariants({ size }), className)}
            {...props}
        >
            {children}
            {indicator !== 'none' && (
                <span className="text-xs font-normal text-muted-foreground">
                    {indicator === 'required' ? 'Obligatorio' : 'Opcional'}
                </span>
            )}
        </LabelPrimitive.Root>
    ),
);
Label.displayName = 'Label';

export { Label, labelVariants };
