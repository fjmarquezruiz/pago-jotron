'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const checkboxVariants = cva(
    'peer inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm border border-input bg-card text-brand-foreground transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted aria-invalid:border-destructive data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand disabled:data-[state=checked]:bg-muted disabled:data-[state=checked]:text-muted-foreground',
    {
        variants: {
            size: {
                xs: 'size-3.5 [&_svg]:size-2.5',
                sm: 'size-4 [&_svg]:size-3',
                md: 'size-5 [&_svg]:size-3.5',
                lg: 'size-6 [&_svg]:size-4',
            },
        },
        defaultVariants: { size: 'sm' },
    },
);

export interface CheckboxProps
    extends
        React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
        VariantProps<typeof checkboxVariants> {}

/**
 * Casilla de verificación (Figma: Checkbox). Admite `checked="indeterminate"`.
 * Con React Hook Form, úsala con `Controller` (`checked` + `onCheckedChange`).
 *
 * @example
 * <Checkbox id="terminos" checked={value} onCheckedChange={onChange} />
 */
const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
    ({ className, size, ...props }, ref) => (
        <CheckboxPrimitive.Root
            ref={ref}
            data-slot="checkbox"
            className={cn(checkboxVariants({ size }), className)}
            {...props}
        >
            <CheckboxPrimitive.Indicator className="group flex items-center justify-center">
                <Check
                    aria-hidden="true"
                    strokeWidth={3}
                    className="group-data-[state=indeterminate]:hidden"
                />
                <Minus
                    aria-hidden="true"
                    strokeWidth={3}
                    className="hidden group-data-[state=indeterminate]:block"
                />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    ),
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
