'use client';

import * as React from 'react';
import { Select as SelectPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { controlBase } from '@/components/ui/input';

/**
 * Selector de una opción (Figma: Select). Para acciones usa `DropdownMenu`.
 * Con React Hook Form, conéctalo con `Controller` (`value` + `onValueChange`).
 *
 * @example
 * <Select value={value} onValueChange={setValue}>
 *     <SelectTrigger><SelectValue placeholder="Elige una DO" /></SelectTrigger>
 *     <SelectContent><SelectItem value="malaga">Málaga</SelectItem></SelectContent>
 * </Select>
 */
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const selectTriggerVariants = cva(
    cn(
        controlBase,
        'flex cursor-pointer items-center justify-between gap-gap-xs text-left data-placeholder:text-muted-foreground data-[state=open]:border-ring [&>span]:truncate',
    ),
    {
        variants: {
            size: {
                xs: 'h-control-xs px-inset-sm text-xs',
                sm: 'h-control-sm px-inset-md text-sm',
                md: 'h-control-md px-inset-lg text-sm',
                lg: 'h-control-lg px-inset-xl text-base',
            },
            variant: {
                default: '',
                compact: 'w-auto',
            },
        },
        defaultVariants: { size: 'md', variant: 'default' },
    },
);

export interface SelectTriggerProps
    extends
        React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
        VariantProps<typeof selectTriggerVariants> {
    /** Icono a la izquierda del valor (Figma: iconLeft). */
    startIcon?: React.ReactNode;
    /** Muestra un spinner en lugar de la flecha mientras cargan las opciones. */
    loading?: boolean;
    /** Si se pasa, añade un botón para vaciar la selección (Figma: clearable). */
    onClear?: () => void;
}

/**
 * Botón que abre el selector. `variant="compact"` para barras de filtros.
 * Con `loading` se desactiva y enseña un spinner; con `onClear`, un botón de vaciar.
 */
const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    SelectTriggerProps
>(
    (
        { className, size, variant, startIcon, loading, onClear, disabled, children, ...props },
        ref,
    ) => (
        <div className={cn('relative', variant === 'compact' ? 'inline-flex' : 'flex w-full')}>
            <SelectPrimitive.Trigger
                ref={ref}
                disabled={disabled || loading}
                aria-busy={loading || undefined}
                className={cn(selectTriggerVariants({ size, variant }), className)}
                {...props}
            >
                {startIcon && (
                    <span
                        aria-hidden="true"
                        className="flex shrink-0 text-muted-foreground [&_svg]:size-5"
                    >
                        {startIcon}
                    </span>
                )}
                <span className="flex-1 truncate">{children}</span>
                {onClear && <span aria-hidden="true" className="w-6 shrink-0" />}
                {loading ? (
                    <Spinner size="sm" variant="neutral" label="Cargando opciones" />
                ) : (
                    <SelectPrimitive.Icon asChild>
                        <ChevronDown
                            aria-hidden="true"
                            className="size-5 shrink-0 text-muted-foreground"
                        />
                    </SelectPrimitive.Icon>
                )}
            </SelectPrimitive.Trigger>
            {onClear && !loading && !disabled && (
                <button
                    type="button"
                    onClick={onClear}
                    aria-label="Vaciar selección"
                    className="absolute top-1/2 right-12 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground [&_svg]:size-4"
                >
                    <X />
                </button>
            )}
        </div>
    ),
);
SelectTrigger.displayName = 'SelectTrigger';

/** Panel desplegable con las opciones. */
const SelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            position={position}
            className={cn(
                'relative z-50 max-h-(--radix-select-content-available-height) min-w-32 overflow-hidden rounded-sm border bg-popover text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
                position === 'popper' &&
                    'w-full min-w-(--radix-select-trigger-width) data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
                className,
            )}
            {...props}
        >
            <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-muted-foreground">
                <ChevronUp className="size-4" aria-hidden="true" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="py-inset-xs">{children}</SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-muted-foreground">
                <ChevronDown className="size-4" aria-hidden="true" />
            </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

/** Título de un grupo de opciones. */
const SelectLabel = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Label
        ref={ref}
        className={cn(
            'px-inset-sm py-inset-2xs text-xs font-medium text-muted-foreground',
            className,
        )}
        {...props}
    />
));
SelectLabel.displayName = 'SelectLabel';

/** Opción del selector (Figma: _SelectOption). La seleccionada lleva fondo de marca y check. */
const SelectItem = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            'relative flex min-h-control-md w-full cursor-pointer items-center gap-gap-xs py-inset-xs pr-9 pl-inset-sm text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:text-muted-foreground data-highlighted:bg-muted data-[state=checked]:bg-brand-subtle',
            className,
        )}
        {...props}
    >
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <span className="absolute right-inset-sm flex size-4 items-center justify-center text-brand">
            <SelectPrimitive.ItemIndicator>
                <Check className="size-4" aria-hidden="true" />
            </SelectPrimitive.ItemIndicator>
        </span>
    </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

/** Separador entre grupos de opciones. */
const SelectSeparator = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator
        ref={ref}
        className={cn('my-1 h-px bg-border', className)}
        {...props}
    />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
};
