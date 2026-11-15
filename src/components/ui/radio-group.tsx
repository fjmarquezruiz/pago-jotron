'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Grupo de opciones de selección única (Figma: RadioGroup). Las opciones pueden ser radios
 * circulares (por defecto) o chips (`variant="chip"` en `RadioGroupItem`); en el segundo caso
 * conviene pasar `orientation="horizontal"` al grupo.
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

/** Estilos de la variante `chip`: botón de 40 px, negro cuando está elegido y con borde si no. */
const chipClassName =
    'inline-flex h-control-md shrink-0 cursor-pointer items-center justify-center rounded-sm border border-input bg-transparent px-inset-lg text-sm font-medium whitespace-nowrap text-foreground transition-colors select-none hover:bg-accent disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:hover:bg-primary/90';

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
        VariantProps<typeof radioVariants> {
    /**
     * `radio` (por defecto) pinta el círculo y deja la etiqueta fuera, junto al item. `chip` pinta
     * un botón con `children` como texto: el elegido en negro y los demás con borde (selector de
     * presentación de la ficha de producto).
     */
    variant?: 'radio' | 'chip';
}

/**
 * Opción del grupo (Figma: RadioButton). Con `variant="chip"` es un botón con su texto dentro;
 * sigue siendo un `role="radio"` de Radix, así que mantiene las flechas y el foco del grupo.
 *
 * @example
 * <RadioGroup orientation="horizontal" aria-label="Presentación" value={id} onValueChange={setId}>
 *     <RadioGroupItem variant="chip" value="1">Botella 75 cl</RadioGroupItem>
 *     <RadioGroupItem variant="chip" value="2">Media botella 37,5 cl</RadioGroupItem>
 * </RadioGroup>
 */
const RadioGroupItem = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Item>,
    RadioGroupItemProps
>(({ className, size, variant = 'radio', children, ...props }, ref) => {
    if (variant === 'chip') {
        return (
            <RadioGroupPrimitive.Item ref={ref} className={cn(chipClassName, className)} {...props}>
                {children}
            </RadioGroupPrimitive.Item>
        );
    }
    return (
        <RadioGroupPrimitive.Item
            ref={ref}
            className={cn(radioVariants({ size }), className)}
            {...props}
        >
            <RadioGroupPrimitive.Indicator asChild>
                <span className="rounded-full bg-brand in-disabled:bg-muted-foreground" />
            </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
    );
});
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
