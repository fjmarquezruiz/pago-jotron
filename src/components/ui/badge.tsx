import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Colores por tono y estilo. `subtle` = fondo suave + texto del tono,
 * `solid` = fondo del tono + texto claro, `outline` = solo borde y texto.
 */
const tones = {
    neutral: {
        subtle: 'bg-secondary text-secondary-foreground',
        solid: 'bg-primary text-primary-foreground',
        outline: 'border-border text-foreground',
    },
    brand: {
        subtle: 'bg-brand-subtle text-brand',
        solid: 'bg-brand text-brand-foreground',
        outline: 'border-brand text-brand',
    },
    success: {
        subtle: 'bg-success-subtle text-success',
        solid: 'bg-success text-success-foreground',
        outline: 'border-success text-success',
    },
    warning: {
        subtle: 'bg-warning-subtle text-warning',
        solid: 'bg-warning text-warning-foreground',
        outline: 'border-warning text-warning',
    },
    destructive: {
        subtle: 'bg-destructive-subtle text-destructive',
        solid: 'bg-destructive text-destructive-foreground',
        outline: 'border-destructive text-destructive',
    },
    info: {
        subtle: 'bg-info-subtle text-info',
        solid: 'bg-info text-info-foreground',
        outline: 'border-info text-info',
    },
    'wine-red': {
        subtle: 'bg-wine-red-subtle text-wine-red',
        solid: 'bg-wine-red text-wine-red-subtle',
        outline: 'border-wine-red text-wine-red',
    },
    'wine-rose': {
        subtle: 'bg-wine-rose-subtle text-wine-rose',
        solid: 'bg-wine-rose text-wine-rose-subtle',
        outline: 'border-wine-rose text-wine-rose',
    },
    'wine-white': {
        subtle: 'bg-wine-white-subtle text-wine-white',
        solid: 'bg-wine-white text-wine-white-subtle',
        outline: 'border-wine-white text-wine-white',
    },
    'wine-sweet': {
        subtle: 'bg-wine-sweet-subtle text-wine-sweet',
        solid: 'bg-wine-sweet text-wine-sweet-subtle',
        outline: 'border-wine-sweet text-wine-sweet',
    },
    'wine-fortified': {
        subtle: 'bg-wine-fortified-subtle text-wine-fortified',
        solid: 'bg-wine-fortified text-wine-fortified-subtle',
        outline: 'border-wine-fortified text-wine-fortified',
    },
} as const;

type Tone = keyof typeof tones;
type Style = 'subtle' | 'solid' | 'outline';

const badgeVariants = cva(
    "inline-flex w-fit max-w-40 shrink-0 items-center gap-gap-2xs truncate rounded-full border border-transparent font-medium whitespace-nowrap [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
    {
        variants: {
            size: {
                xs: 'h-control-3xs px-inset-2xs text-2xs',
                sm: 'h-control-2xs px-inset-xs text-xs',
                md: 'h-control-xxs px-inset-sm text-sm',
            },
            variant: { subtle: '', solid: '', outline: 'bg-transparent' },
        },
        defaultVariants: { size: 'sm', variant: 'subtle' },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
    /** Tono semántico o tipo de vino. */
    tone?: Tone;
    /** Muestra solo un punto de color antes del texto. */
    dot?: boolean;
    /** Contador (Figma: type=count). Sustituye al texto y se ajusta a un círculo. */
    count?: number;
    /** Tope del contador; por encima se muestra "99+". Por defecto 99. */
    max?: number;
}

/**
 * Etiqueta no interactiva de estado o categoría (Figma: Badge).
 * Incluye los tonos de tipo de vino. Para etiquetas que se quitan o seleccionan, usa `Tag`.
 *
 * @example
 * <Badge tone="wine-red">Tinto</Badge>
 * <Badge tone="success" variant="outline">Entregado</Badge>
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    (
        {
            className,
            tone = 'neutral',
            size,
            variant,
            dot = false,
            count,
            max = 99,
            children,
            ...props
        },
        ref,
    ) => {
        const style: Style = variant ?? 'subtle';
        const isCount = count !== undefined;
        return (
            <span
                ref={ref}
                data-slot="badge"
                className={cn(
                    badgeVariants({ size, variant }),
                    tones[tone][style],
                    isCount && 'justify-center tabular-nums',
                    isCount && size === 'xs' && 'min-w-control-3xs',
                    isCount && (size ?? 'sm') === 'sm' && 'min-w-control-2xs',
                    isCount && size === 'md' && 'min-w-control-xxs',
                    className,
                )}
                {...props}
            >
                {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
                {isCount ? (count > max ? `${max}+` : count) : children}
            </span>
        );
    },
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
export type { Tone as BadgeTone };
