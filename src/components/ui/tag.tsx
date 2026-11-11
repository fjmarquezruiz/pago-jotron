'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const tagVariants = cva(
    'inline-flex max-w-50 items-center gap-1 rounded-full border font-medium transition-colors aria-disabled:pointer-events-none aria-disabled:opacity-50',
    {
        variants: {
            tone: {
                neutral: 'border-input bg-muted text-muted-foreground',
                brand: 'border-brand/40 bg-brand-subtle text-brand',
                success: 'border-success/40 bg-success-subtle text-success',
                warning: 'border-warning/40 bg-warning-subtle text-warning',
                destructive: 'border-destructive/40 bg-destructive-subtle text-destructive',
            },
            size: {
                sm: 'h-control-2xs px-inset-xs text-xs [&_svg]:size-3',
                md: 'h-control-xxs px-inset-sm text-xs [&_svg]:size-3.5',
            },
            selected: { true: 'ring-1 ring-current ring-inset', false: '' },
            interactive: { true: 'cursor-pointer hover:brightness-95', false: '' },
        },
        defaultVariants: { tone: 'neutral', size: 'md', selected: false, interactive: false },
    },
);

export interface TagProps
    extends
        Omit<React.HTMLAttributes<HTMLSpanElement>, 'onClick'>,
        Omit<VariantProps<typeof tagVariants>, 'interactive'> {
    /** Al pulsar la etiqueta (por ejemplo, para alternar un filtro). */
    onClick?: () => void;
    /** Si se pasa, muestra el botón de quitar. */
    onRemove?: () => void;
    disabled?: boolean;
    /** Icono o avatar antes del texto (Figma: showLeading). */
    leading?: React.ReactNode;
}

/**
 * Etiqueta interactiva y opcionalmente cerrable (Figma: Tag). Pensada para filtros activos.
 *
 * @example
 * <Tag tone="brand" onRemove={() => quitarFiltro('tinto')}>Tinto</Tag>
 */
const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
    (
        {
            className,
            tone,
            size,
            selected,
            onClick,
            onRemove,
            disabled,
            leading,
            children,
            ...props
        },
        ref,
    ) => {
        const label = typeof children === 'string' ? children : 'etiqueta';
        return (
            <span
                ref={ref}
                aria-disabled={disabled || undefined}
                className={cn(
                    tagVariants({ tone, size, selected, interactive: !!onClick }),
                    className,
                )}
                {...props}
            >
                {leading && (
                    <span aria-hidden="true" className="-ml-0.5 flex shrink-0">
                        {leading}
                    </span>
                )}
                {onClick ? (
                    <button
                        type="button"
                        onClick={onClick}
                        aria-pressed={selected ?? undefined}
                        disabled={disabled}
                        className="cursor-pointer truncate rounded-full"
                    >
                        {children}
                    </button>
                ) : (
                    <span className="truncate">{children}</span>
                )}
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={disabled}
                        aria-label={`Quitar ${label}`}
                        className="-mr-1 inline-flex cursor-pointer items-center justify-center rounded-full p-0.5 hover:bg-foreground/10"
                    >
                        <X aria-hidden="true" />
                    </button>
                )}
            </span>
        );
    },
);
Tag.displayName = 'Tag';

export { Tag };
