'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inputVariants } from '@/components/ui/input';

export interface NumberInputProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'size' | 'value' | 'onChange' | 'type'
> {
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /**
     * Ocupa todo el ancho del contenedor, con botones de 24 px e iconos de 12 px y el valor
     * centrado entre ellos (cantidad de la ficha de producto). Deshabilitado conserva el borde.
     */
    fluid?: boolean;
}

/**
 * Campo numérico con botones de restar y sumar (Figma: NumberInput).
 * Pensado para la cantidad del carrito: el valor siempre queda entre `min` y `max`.
 * Con `fluid` se estira al ancho del contenedor.
 *
 * @example
 * <NumberInput aria-label="Cantidad" value={qty} onValueChange={setQty} min={1} max={stock} />
 * <NumberInput fluid aria-label="Cantidad" value={qty} onValueChange={setQty} max={stock} />
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
    (
        {
            value,
            onValueChange,
            min = 0,
            max = Infinity,
            step = 1,
            size = 'md',
            fluid = false,
            className,
            disabled,
            ...props
        },
        ref,
    ) => {
        const clamp = (n: number) => Math.min(max, Math.max(min, n));
        const btn = cn(
            'flex shrink-0 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent',
            fluid
                ? 'size-control-xxs rounded-sm [&_svg]:size-3'
                : 'aspect-square h-full [&_svg]:size-4',
        );
        return (
            <div
                className={cn(
                    inputVariants({ size }),
                    'overflow-hidden has-focus-visible:border-ring has-focus-visible:ring-1 has-focus-visible:ring-ring has-aria-invalid:border-destructive',
                    fluid
                        ? 'flex w-full items-center gap-gap-xs'
                        : 'inline-flex w-auto items-stretch p-0',
                    disabled &&
                        (fluid ? 'bg-muted hover:border-input' : 'border-transparent bg-muted'),
                    className,
                )}
            >
                <button
                    type="button"
                    className={btn}
                    onClick={() => onValueChange(clamp(value - step))}
                    disabled={disabled || value <= min}
                    aria-label="Restar"
                >
                    <Minus aria-hidden="true" />
                </button>
                <input
                    ref={ref}
                    type="number"
                    inputMode="numeric"
                    role="spinbutton"
                    aria-valuemin={min}
                    aria-valuemax={Number.isFinite(max) ? max : undefined}
                    aria-valuenow={value}
                    value={value}
                    min={min}
                    max={Number.isFinite(max) ? max : undefined}
                    step={step}
                    disabled={disabled}
                    onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isNaN(n)) onValueChange(clamp(n));
                    }}
                    className={cn(
                        fluid ? 'flex-1' : 'w-12',
                        'min-w-0 [appearance:textfield] bg-transparent text-center tabular-nums outline-none disabled:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                    )}
                    {...props}
                />
                <button
                    type="button"
                    className={btn}
                    onClick={() => onValueChange(clamp(value + step))}
                    disabled={disabled || value >= max}
                    aria-label="Sumar"
                >
                    <Plus aria-hidden="true" />
                </button>
            </div>
        );
    },
);
NumberInput.displayName = 'NumberInput';

export { NumberInput };
