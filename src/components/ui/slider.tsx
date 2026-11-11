'use client';

import * as React from 'react';
import { Slider as SliderPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * Control deslizante (Figma: Slider). Con dos valores sirve como rango,
 * por ejemplo el filtro de precio del catálogo. Cada pulgar necesita su `aria-label`.
 *
 * @example
 * <Slider value={[10, 40]} onValueChange={setRange} min={0} max={100} thumbLabels={['Precio mínimo', 'Precio máximo']} />
 */
const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
        thumbLabels?: string[];
        /** Grosor de la pista y tamaño del pulgar: xs, sm, md (por defecto) o lg. */
        size?: 'xs' | 'sm' | 'md' | 'lg';
        /** Estado de error: pista y pulgar en rojo. */
        invalid?: boolean;
    }
>(({ className, thumbLabels = [], value, defaultValue, size = 'md', invalid, ...props }, ref) => {
    const track = { xs: 'h-0.5', sm: 'h-1', md: 'h-1', lg: 'h-1.5' }[size];
    const thumb = { xs: 'size-3', sm: 'size-4', md: 'size-4.5', lg: 'size-5' }[size];
    const count = (value ?? defaultValue ?? [0]).length;
    return (
        <SliderPrimitive.Root
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            className={cn(
                'relative flex h-6 w-full touch-none items-center select-none data-disabled:opacity-50',
                className,
            )}
            {...props}
        >
            <SliderPrimitive.Track
                className={cn('relative w-full grow overflow-hidden rounded-full bg-muted', track)}
            >
                <SliderPrimitive.Range
                    className={cn(
                        'absolute h-full rounded-full',
                        invalid ? 'bg-destructive' : 'bg-brand',
                    )}
                />
            </SliderPrimitive.Track>
            {Array.from({ length: count }, (_, i) => (
                <SliderPrimitive.Thumb
                    key={i}
                    aria-label={thumbLabels[i]}
                    aria-invalid={invalid || undefined}
                    className={cn(
                        'block cursor-grab rounded-full border bg-card shadow-xs transition-colors hover:border-foreground/50 active:cursor-grabbing',
                        invalid ? 'border-destructive' : 'border-input',
                        thumb,
                    )}
                />
            ))}
        </SliderPrimitive.Root>
    );
});
Slider.displayName = 'Slider';

export { Slider };
