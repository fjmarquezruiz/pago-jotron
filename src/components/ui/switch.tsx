'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const switchVariants = cva(
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-1 aria-invalid:ring-destructive',
    {
        variants: {
            size: {
                xs: 'h-3 w-5.5 [&>span]:size-2 [&>span]:data-[state=checked]:translate-x-2.5',
                sm: 'h-4 w-7 [&>span]:size-3 [&>span]:data-[state=checked]:translate-x-3',
                md: 'h-5 w-9 [&>span]:size-4 [&>span]:data-[state=checked]:translate-x-4',
                lg: 'h-6 w-11 [&>span]:size-5 [&>span]:data-[state=checked]:translate-x-5',
            },
            variant: {
                filled: 'bg-muted-foreground data-[state=checked]:bg-brand',
                outline:
                    'border border-input bg-card data-[state=checked]:border-brand data-[state=checked]:bg-brand-subtle',
            },
        },
        defaultVariants: { size: 'md', variant: 'filled' },
    },
);

export interface SwitchProps
    extends
        React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
        VariantProps<typeof switchVariants> {}

/**
 * Interruptor de efecto inmediato (Figma: Switch). Lleva `role="switch"`.
 *
 * @example
 * <Switch id="newsletter" checked={on} onCheckedChange={setOn} />
 */
const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
    ({ className, size, variant, ...props }, ref) => (
        <SwitchPrimitive.Root
            ref={ref}
            className={cn(switchVariants({ size, variant }), className)}
            {...props}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    'pointer-events-none block rounded-full shadow-xs transition-transform data-[state=unchecked]:translate-x-0',
                    variant === 'outline'
                        ? 'bg-muted-foreground data-[state=checked]:bg-brand'
                        : 'bg-card data-[state=checked]:bg-muted',
                )}
            />
        </SwitchPrimitive.Root>
    ),
);
Switch.displayName = 'Switch';

export { Switch };
