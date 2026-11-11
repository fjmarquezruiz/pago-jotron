import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Qué se mide ("Ventas del mes"). */
    label: string;
    /** Valor ya formateado ("1.240,50 €"). Sin valor se muestra "—" (Figma: state=empty). */
    value?: React.ReactNode;
    /** Muestra esqueletos mientras cargan los datos (Figma: state=loading). */
    loading?: boolean;
    /** Variación respecto al periodo anterior, ya formateada ("+12 %"). */
    trend?: string;
    /** Sentido de la variación: marca el color y la flecha. */
    trendDirection?: 'up' | 'down' | 'neutral';
    /** Texto de apoyo bajo la variación ("frente al mes pasado"). */
    caption?: string;
    /** Icono opcional junto a la etiqueta. */
    icon?: React.ReactNode;
}

/**
 * Tarjeta de métrica para el panel de administración (Figma: MetricCard).
 *
 * @example
 * <MetricCard label="Pedidos" value="128" trend="+8 %" trendDirection="up" caption="frente a la semana pasada" />
 */
const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
    (
        {
            className,
            label,
            value,
            loading = false,
            trend,
            trendDirection = 'up',
            caption,
            icon,
            ...props
        },
        ref,
    ) => {
        const TrendIcon = { up: ArrowUpRight, down: ArrowDownRight, neutral: Minus }[
            trendDirection
        ];
        const empty = value === undefined || value === null || value === '';
        return (
            <div
                ref={ref}
                className={cn(
                    'flex flex-col gap-gap-xs rounded-xl border border-border bg-card p-inset-lg text-card-foreground shadow-xs',
                    className,
                )}
                {...props}
            >
                <div className="flex items-center justify-between gap-gap-xs text-sm text-muted-foreground">
                    <span>{label}</span>
                    {icon && (
                        <span aria-hidden="true" className="[&_svg]:size-4">
                            {icon}
                        </span>
                    )}
                </div>
                {loading ? (
                    <>
                        <Skeleton className="h-8 w-30" />
                        <Skeleton className="h-4 w-24" />
                    </>
                ) : (
                    <p className="text-2xl font-medium tabular-nums">{empty ? '—' : value}</p>
                )}
                {!loading && !empty && (trend || caption) && (
                    <p className="flex flex-wrap items-center gap-gap-2xs text-xs text-muted-foreground">
                        {trend && (
                            <span
                                className={cn(
                                    'inline-flex items-center gap-0.5 font-medium',
                                    {
                                        up: 'text-success',
                                        down: 'text-destructive',
                                        neutral: 'text-muted-foreground',
                                    }[trendDirection],
                                )}
                            >
                                <TrendIcon className="size-3.5" aria-hidden="true" />
                                <span className="sr-only">
                                    {
                                        { up: 'Sube', down: 'Baja', neutral: 'Sin cambios' }[
                                            trendDirection
                                        ]
                                    }
                                </span>
                                {trend}
                            </span>
                        )}
                        {caption}
                    </p>
                )}
            </div>
        );
    },
);
MetricCard.displayName = 'MetricCard';

export { MetricCard };
