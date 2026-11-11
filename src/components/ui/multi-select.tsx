'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { controlBase } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface MultiSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface MultiSelectProps {
    options: MultiSelectOption[];
    value: string[];
    onValueChange: (value: string[]) => void;
    placeholder?: string;
    /** Máximo de pills visibles; el resto se resume en "+N" (Figma: overflowCount). */
    maxVisible?: number;
    /** Muestra un botón para vaciar la selección (Figma: clearable). */
    clearable?: boolean;
    /** Icono a la izquierda (Figma: iconLeft). */
    startIcon?: React.ReactNode;
    /** Cargando opciones: spinner en lugar de la flecha y control desactivado. */
    loading?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    disabled?: boolean;
    id?: string;
    className?: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
}

const heights = {
    xs: 'min-h-control-xs px-inset-sm text-xs',
    sm: 'min-h-control-sm px-inset-md text-sm',
    md: 'min-h-control-md px-inset-lg text-sm',
    lg: 'min-h-control-lg px-inset-xl text-base',
};

/**
 * Selector de varias opciones que las muestra como pills (Figma: MultiSelect).
 * Misma anatomía que `Select`; el panel es un `listbox` con selección múltiple.
 *
 * @example
 * <MultiSelect options={uvas} value={sel} onValueChange={setSel} placeholder="Elige uvas" />
 */
const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
    (
        {
            options,
            value,
            onValueChange,
            placeholder = 'Selecciona',
            maxVisible,
            clearable = false,
            startIcon,
            loading = false,
            size = 'md',
            disabled,
            className,
            ...aria
        },
        ref,
    ) => {
        const toggle = (v: string) =>
            onValueChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
        const selected = options.filter((o) => value.includes(o.value));
        const [open, setOpen] = React.useState(false);
        const listId = React.useId();
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild disabled={disabled || loading}>
                    <button
                        ref={ref}
                        type="button"
                        role="combobox"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        aria-controls={listId}
                        className={cn(
                            controlBase,
                            heights[size],
                            'relative flex cursor-pointer flex-wrap items-center gap-gap-2xs py-1 pr-10 text-left data-[state=open]:border-ring',
                            clearable && 'pr-16',
                            className,
                        )}
                        {...aria}
                    >
                        {startIcon && (
                            <span
                                aria-hidden="true"
                                className="flex shrink-0 text-muted-foreground [&_svg]:size-5"
                            >
                                {startIcon}
                            </span>
                        )}
                        {selected.length === 0 && (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        {(maxVisible ? selected.slice(0, maxVisible) : selected).map((o) => (
                            <span
                                key={o.value}
                                className="inline-flex h-control-xxs items-center gap-1 rounded-full border border-input bg-muted px-inset-xs text-xs font-medium text-muted-foreground"
                            >
                                {o.label}
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    aria-label={`Quitar ${o.label}`}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggle(o.value);
                                    }}
                                    className="rounded-full p-0.5 hover:bg-foreground/10"
                                >
                                    <X className="size-3" aria-hidden="true" />
                                </span>
                            </span>
                        ))}
                        {maxVisible && selected.length > maxVisible && (
                            <span className="text-xs font-medium">
                                +{selected.length - maxVisible}
                            </span>
                        )}
                        {clearable && selected.length > 0 && !disabled && !loading && (
                            <span
                                role="button"
                                tabIndex={-1}
                                aria-label="Vaciar selección"
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onValueChange([]);
                                }}
                                className="absolute top-1/2 right-10 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </span>
                        )}
                        {loading ? (
                            <span className="absolute top-1/2 right-inset-sm -translate-y-1/2">
                                <Spinner size="sm" variant="neutral" label="Cargando opciones" />
                            </span>
                        ) : (
                            <ChevronDown
                                aria-hidden="true"
                                className="absolute top-1/2 right-inset-sm size-5 -translate-y-1/2 text-muted-foreground"
                            />
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="w-(--radix-popover-trigger-width) max-w-none p-0 py-inset-xs"
                >
                    <ul
                        id={listId}
                        role="listbox"
                        aria-multiselectable="true"
                        className="max-h-64 overflow-y-auto"
                    >
                        {options.map((o) => {
                            const isSel = value.includes(o.value);
                            return (
                                <li
                                    key={o.value}
                                    role="option"
                                    aria-selected={isSel}
                                    aria-disabled={o.disabled}
                                >
                                    <button
                                        type="button"
                                        disabled={o.disabled}
                                        onClick={() => toggle(o.value)}
                                        className={cn(
                                            'flex min-h-control-md w-full cursor-pointer items-center justify-between gap-gap-xs px-inset-sm py-inset-xs text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted disabled:pointer-events-none disabled:text-muted-foreground',
                                            isSel && 'bg-brand-subtle hover:bg-brand-subtle',
                                        )}
                                    >
                                        {o.label}
                                        {isSel && (
                                            <Check
                                                className="size-4 text-brand"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </PopoverContent>
            </Popover>
        );
    },
);
MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };
