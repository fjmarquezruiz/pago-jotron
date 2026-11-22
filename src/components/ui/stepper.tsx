import * as React from 'react';
import { CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'upcoming' | 'active' | 'completed' | 'error';

export interface Step {
    label: string;
    description?: string;
    /** Icono en lugar del número (Figma: StepItem icon). */
    icon?: React.ReactNode;
}

export interface StepperProps extends React.OlHTMLAttributes<HTMLOListElement> {
    steps: Step[];
    /** Índice (desde 0) del paso activo. Los anteriores se marcan como completados. */
    current: number;
    /**
     * Índice de un paso con error, si lo hay (Figma: StepItem status=error): indicador en
     * `destructive-subtle` con su número, sin icono, y la etiqueta en `destructive`.
     */
    errorStep?: number;
    orientation?: 'horizontal' | 'vertical';
    /** `progress-bar`: indicador centrado entre dos barras y el texto debajo (Figma: style). */
    variant?: 'default' | 'progress-bar';
    /** Tamaño del indicador: sm 24, md 32, lg 40, xl 48 px. */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /**
     * Atenúa los indicadores al 40 % (Figma: StepItem state=disabled). Para cuando el proceso no
     * está en marcha, por ejemplo el checkout con el carrito vacío.
     */
    disabled?: boolean;
    /**
     * Seguimiento de un pedido (Figma: account-order-*, `checkout-steps`): el paso `current` es el
     * último ALCANZADO y se ve completado (con check), no activo; los pasos por venir atenúan su
     * indicador al 40 %; los pasos van centrados con su texto y los conectores ocupan el espacio
     * que sobra entre ellos. Solo en horizontal y sin `variant="progress-bar"`.
     */
    tracking?: boolean;
}

const indicatorSizes = {
    sm: 'size-6 text-xs [&_svg]:size-3',
    md: 'size-8 text-sm [&_svg]:size-4',
    lg: 'size-10 text-base [&_svg]:size-5',
    xl: 'size-12 text-lg [&_svg]:size-6',
};
const labelSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-lg' };
const descSizes = { sm: 'text-xs', md: 'text-xs', lg: 'text-sm', xl: 'text-base' };
// Hueco entre indicador, texto y conector, y entre pasos (Figma: StepItem lg usa gap-sm, 12 px).
const gapClass = { sm: 'gap-gap-xs', md: 'gap-gap-xs', lg: 'gap-gap-sm', xl: 'gap-gap-xs' };
// Para centrar la primera línea del texto con el indicador: (indicador - altura de línea) / 2.
const labelOffset = { sm: 'pt-1.5', md: 'pt-1.5', lg: 'pt-2', xl: 'pt-1.5' };
// Para centrar el conector de 2 px con el indicador: la mitad del indicador menos 1 px.
const connectorOffset = { sm: 'mt-3', md: 'mt-4', lg: 'mt-[19px]', xl: 'mt-6' };

/**
 * Pasos de un proceso (Figma: Stepper), por ejemplo el checkout.
 * `variant="progress-bar"` centra cada indicador entre dos barras con el texto debajo.
 * Es una lista ordenada; el paso activo lleva `aria-current="step"`.
 *
 * Conectores (criterio único, el de Figma en carrito, datos, pago y confirmar): el tramo que llega a
 * un paso ya alcanzado va en `brand` al 20 %; el que llega a un paso por venir o con error, en
 * `primary` al 10 %. Es decir, el tramo tras el paso `i` es `brand/20` si `i + 1 <= current` y el
 * paso `i + 1` no es el del error.
 * En horizontal y en móvil solo se ve el texto del paso activo (el resto queda para lectores de pantalla).
 *
 * @example
 * <Stepper steps={[{ label: 'Envío' }, { label: 'Pago' }, { label: 'Confirmación' }]} current={1} />
 */
const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(
    (
        {
            className,
            steps,
            current,
            errorStep,
            orientation = 'horizontal',
            variant = 'default',
            size = 'md',
            disabled = false,
            tracking: trackingProp = false,
            ...props
        },
        ref,
    ) => {
        const bar = variant === 'progress-bar' && orientation === 'horizontal';
        const tracking = trackingProp && !bar && orientation === 'horizontal';
        return (
            <ol
                ref={ref}
                className={cn(
                    'flex',
                    tracking ? 'items-center gap-gap-sm' : gapClass[size],
                    orientation === 'horizontal' ? 'flex-row' : 'flex-col',
                    orientation === 'horizontal' && !tracking && 'items-start',
                    className,
                )}
                {...props}
            >
                {steps.map((step, i) => {
                    const status: StepStatus =
                        i === errorStep
                            ? 'error'
                            : i < current || (tracking && i === current)
                              ? 'completed'
                              : i === current
                                ? 'active'
                                : 'upcoming';
                    const isLast = i === steps.length - 1;
                    const isFirst = i === 0;
                    const isCurrent = i === current && status !== 'error';
                    return (
                        <React.Fragment key={step.label}>
                            <li
                                aria-current={
                                    status === 'active' || (tracking && isCurrent)
                                        ? 'step'
                                        : undefined
                                }
                                className={cn(
                                    'flex',
                                    gapClass[size],
                                    bar
                                        ? 'relative flex-1 flex-col items-center text-center'
                                        : tracking
                                          ? 'flex-none items-center'
                                          : orientation === 'horizontal'
                                            ? 'flex-1 items-start'
                                            : 'items-start',
                                    !bar && isLast && 'flex-none',
                                    // Figma: el último paso de tamaño lg mide 128 px fijos.
                                    !bar &&
                                        isLast &&
                                        size === 'lg' &&
                                        orientation === 'horizontal' &&
                                        'sm:w-32',
                                )}
                            >
                                {bar && (
                                    <span
                                        aria-hidden="true"
                                        className="flex w-full items-center gap-gap-xs"
                                    >
                                        <span
                                            className={cn(
                                                'h-0.5 flex-1 rounded-full',
                                                isFirst
                                                    ? 'invisible'
                                                    : i <= current
                                                      ? 'bg-brand'
                                                      : 'bg-muted',
                                            )}
                                        />
                                        <span
                                            className={cn('rounded-full', indicatorSizes[size])}
                                        />
                                        <span
                                            className={cn(
                                                'h-0.5 flex-1 rounded-full',
                                                isLast
                                                    ? 'invisible'
                                                    : i < current
                                                      ? 'bg-brand'
                                                      : 'bg-muted',
                                            )}
                                        />
                                    </span>
                                )}
                                <span
                                    className={cn(
                                        'flex shrink-0 items-center justify-center rounded-full font-medium',
                                        indicatorSizes[size],
                                        bar && 'absolute',
                                        (disabled || (tracking && status === 'upcoming')) &&
                                            'opacity-40',
                                        status === 'upcoming' &&
                                            'border border-input bg-muted text-muted-foreground',
                                        (status === 'active' || status === 'completed') &&
                                            'bg-brand text-brand-foreground',
                                        status === 'error' &&
                                            'bg-destructive-subtle text-destructive',
                                    )}
                                >
                                    {status === 'completed' ? (
                                        <CircleCheck aria-hidden="true" />
                                    ) : (
                                        (step.icon ?? i + 1)
                                    )}
                                    <span className="sr-only">
                                        {status === 'completed'
                                            ? ' (completado)'
                                            : status === 'error'
                                              ? ' (con error)'
                                              : ''}
                                    </span>
                                </span>
                                <span
                                    className={cn(
                                        'flex min-w-0 flex-col',
                                        !bar && !tracking && labelOffset[size],
                                        orientation === 'horizontal' &&
                                            status !== 'active' &&
                                            !(tracking && isCurrent) &&
                                            'max-sm:sr-only',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'font-medium',
                                            labelSizes[size],
                                            status === 'upcoming' && 'text-muted-foreground',
                                            status === 'error' && 'text-destructive',
                                            (status === 'active' || status === 'completed') &&
                                                'text-foreground',
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                    {step.description && (
                                        <span
                                            className={cn('text-muted-foreground', descSizes[size])}
                                        >
                                            {step.description}
                                        </span>
                                    )}
                                </span>
                                {!bar && !tracking && !isLast && orientation === 'horizontal' && (
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'h-0.5 min-w-2 flex-1 rounded-full',
                                            connectorOffset[size],
                                            // Llega a un paso alcanzado: marca al 20 %; si no (por venir o con error), tinta al 10 %.
                                            i + 1 <= current && i + 1 !== errorStep
                                                ? 'bg-brand/20'
                                                : 'bg-primary/10',
                                        )}
                                    />
                                )}
                            </li>
                            {tracking && !isLast && (
                                // Conector entre pasos (solo seguimiento): `li` decorativo que ocupa lo que sobra.
                                <li
                                    aria-hidden="true"
                                    className={cn(
                                        'h-0.5 min-w-2 flex-1 rounded-full',
                                        i + 1 <= current && i + 1 !== errorStep
                                            ? 'bg-brand/20'
                                            : 'bg-primary/10',
                                    )}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </ol>
        );
    },
);
Stepper.displayName = 'Stepper';

export { Stepper };
