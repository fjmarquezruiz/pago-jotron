'use client';

import * as React from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepProps extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'title'
> {
    /** Título del paso. */
    title: React.ReactNode;
    /** Estado del paso: marca el icono y el color del título. */
    status?: 'upcoming' | 'current' | 'completed';
    /** Mensaje de error bajo las notas. Pone el borde en rojo. */
    error?: string;
    /** Si se pasa, muestra el botón de quitar el paso (Figma: showClose). */
    onRemove?: () => void;
    /** Tamaño del texto: xs 12, sm y md 14, lg 16 px. */
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

const textSizes = { xs: 'text-xs', sm: 'text-sm', md: 'text-sm', lg: 'text-base' };

/**
 * Paso editable con título y notas (Figma: Step). Sirve para listas de pasos que se
 * escriben a mano, como el guion de una visita o cata. El resto de props van al
 * `textarea` de las notas.
 *
 * @example
 * <Step title="Recepción en la bodega" status="completed" value={notas} onChange={...} onRemove={quitar} />
 */
const Step = React.forwardRef<HTMLTextAreaElement, StepProps>(
    (
        {
            className,
            title,
            status = 'upcoming',
            error,
            onRemove,
            size = 'md',
            disabled,
            placeholder = 'Añade notas sobre este paso…',
            id,
            ...props
        },
        ref,
    ) => {
        const autoId = React.useId();
        const notesId = id ?? autoId;
        const errorId = `${notesId}-error`;
        return (
            <div
                aria-current={status === 'current' ? 'step' : undefined}
                className={cn(
                    'flex flex-col gap-gap-xs rounded-sm border bg-card p-inset-sm transition-colors focus-within:border-ring',
                    error ? 'border-destructive' : 'border-input hover:border-foreground/40',
                    disabled && 'pointer-events-none opacity-50',
                    textSizes[size],
                    className,
                )}
            >
                <div className="flex items-center gap-gap-xs">
                    {status === 'completed' && (
                        <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
                    )}
                    {error && (
                        <CircleAlert
                            aria-hidden="true"
                            className="size-4 shrink-0 text-destructive"
                        />
                    )}
                    <label
                        htmlFor={notesId}
                        className={cn(
                            'flex-1 truncate font-medium',
                            status === 'current' ? 'text-foreground' : 'text-muted-foreground',
                        )}
                    >
                        {title}
                        {status === 'completed' && <span className="sr-only"> (completado)</span>}
                    </label>
                    {onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            aria-label="Quitar paso"
                            className="inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <X aria-hidden="true" className="size-3" />
                        </button>
                    )}
                </div>
                <textarea
                    ref={ref}
                    id={notesId}
                    rows={1}
                    disabled={disabled}
                    placeholder={placeholder}
                    aria-invalid={!!error || undefined}
                    aria-describedby={error ? errorId : undefined}
                    className="field-sizing-content min-h-6 resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                    {...props}
                />
                {error && (
                    <p id={errorId} role="alert" className="text-xs text-destructive">
                        {error}
                    </p>
                )}
            </div>
        );
    },
);
Step.displayName = 'Step';

export { Step };
