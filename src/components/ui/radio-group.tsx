'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Grupo de opciones de selección única (Figma: RadioGroup).
 *
 * @example
 * <RadioGroup value={envio} onValueChange={setEnvio}>
 *     <div className="flex items-center gap-gap-xs">
 *         <RadioGroupItem value="estandar" id="estandar" />
 *         <Label htmlFor="estandar">Envío estándar</Label>
 *     </div>
 * </RadioGroup>
 */
const RadioGroup = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, orientation = 'vertical', ...props }, ref) => (
    <RadioGroupPrimitive.Root
        ref={ref}
        orientation={orientation}
        className={cn(
            'flex gap-gap-sm data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:flex-wrap data-[orientation=vertical]:flex-col',
            className,
        )}
        {...props}
    />
));
RadioGroup.displayName = 'RadioGroup';

const radioVariants = cva(
    'peer inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-input bg-card transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted aria-invalid:border-destructive data-[state=checked]:border-brand',
    {
        variants: {
            size: {
                xs: 'size-3.5 [&_span]:size-1.5',
                sm: 'size-4 [&_span]:size-2',
                md: 'size-5 [&_span]:size-2.5',
                lg: 'size-6 [&_span]:size-3',
            },
        },
        defaultVariants: { size: 'sm' },
    },
);

export interface RadioGroupItemProps
    extends
        React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
        VariantProps<typeof radioVariants> {}

/** Opción del grupo (Figma: RadioButton). */
const RadioGroupItem = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Item>,
    RadioGroupItemProps
>(({ className, size, ...props }, ref) => (
    <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(radioVariants({ size }), className)}
        {...props}
    >
        <RadioGroupPrimitive.Indicator asChild>
            <span className="rounded-full bg-brand in-disabled:bg-muted-foreground" />
        </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
