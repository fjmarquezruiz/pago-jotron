import * as React from 'react';
import { cn } from '@/lib/utils';
import { HelperText } from '@/components/ui/helper-text';

export interface FieldsetProps extends Omit<
    React.FieldsetHTMLAttributes<HTMLFieldSetElement>,
    'title'
> {
    /** Título del grupo (se pinta como `legend`). */
    legend?: React.ReactNode;
    /** Ayuda o error bajo el grupo. */
    helper?: React.ReactNode;
    invalid?: boolean;
    /** `horizontal` coloca los controles en fila; los `SwitchGroupItem` pasan a tarjetas (Figma: orientation). */
    orientation?: 'vertical' | 'horizontal';
}

/**
 * Grupo de controles con leyenda y ayuda (Figma: RadioGroup y SwitchGroup).
 * Usa `fieldset` y `legend`, así el lector de pantalla anuncia el título al entrar.
 *
 * @example
 * <Fieldset legend="Tipo de envío"><RadioGroup>...</RadioGroup></Fieldset>
 */
const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
    (
        {
            className,
            legend,
            helper,
            invalid,
            disabled,
            orientation = 'vertical',
            children,
            ...props
        },
        ref,
    ) => (
        <fieldset
            ref={ref}
            disabled={disabled}
            data-orientation={orientation}
            className={cn(
                'group/fieldset flex min-w-0 flex-col gap-gap-sm disabled:opacity-50',
                className,
            )}
            {...props}
        >
            {legend && <legend className="mb-gap-xs text-sm font-medium">{legend}</legend>}
            <div
                className={cn(
                    'flex gap-gap-sm',
                    orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
                )}
            >
                {children}
            </div>
            {helper && (
                <HelperText
                    type={invalid ? 'error' : 'default'}
                    showIcon={invalid}
                    role={invalid ? 'alert' : undefined}
                >
                    {helper}
                </HelperText>
            )}
        </fieldset>
    ),
);
Fieldset.displayName = 'Fieldset';

export interface SwitchGroupItemProps {
    id: string;
    label: React.ReactNode;
    description?: React.ReactNode;
    /** El `Switch` de la fila. */
    children: React.ReactNode;
    className?: string;
}

/**
 * Fila de un grupo de interruptores (Figma: SwitchGroupItem): texto a la izquierda y switch a la derecha.
 * Pasa al `Switch` el mismo `id` y `aria-describedby={`${id}-description`}` si hay descripción.
 *
 * @example
 * <SwitchGroupItem id="news" label="Novedades" description="Un correo al mes">
 *     <Switch id="news" aria-describedby="news-description" />
 * </SwitchGroupItem>
 */
function SwitchGroupItem({ id, label, description, children, className }: SwitchGroupItemProps) {
    return (
        <div
            className={cn(
                'flex items-start justify-between gap-gap-md group-data-[orientation=horizontal]/fieldset:w-80 group-data-[orientation=horizontal]/fieldset:max-w-full group-data-[orientation=horizontal]/fieldset:rounded-md group-data-[orientation=horizontal]/fieldset:border group-data-[orientation=horizontal]/fieldset:p-inset-sm',
                className,
            )}
        >
            <div className="flex flex-col gap-gap-2xs">
                <label htmlFor={id} className="text-sm font-medium">
                    {label}
                </label>
                {description && (
                    <p id={`${id}-description`} className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}

export { Fieldset, SwitchGroupItem };
