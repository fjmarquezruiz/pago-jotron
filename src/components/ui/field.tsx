'use client';

import * as React from 'react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';
import { Label, type LabelProps } from '@/components/ui/label';
import { HelperText, type HelperTextProps } from '@/components/ui/helper-text';

interface FieldContextValue {
    id: string;
    descriptionId: string;
    messageId: string;
    invalid: boolean;
    disabled: boolean;
    size: FieldSize;
    hasDescription: boolean;
    hasMessage: boolean;
    setHasDescription: (value: boolean) => void;
    setHasMessage: (value: boolean) => void;
}

type FieldSize = 'xs' | 'sm' | 'md' | 'lg';

const FieldContext = React.createContext<FieldContextValue | null>(null);

/**
 * Devuelve el contexto del `Field` más cercano.
 *
 * @throws {Error} Si se usa fuera de un `<Field>`.
 */
function useField(): FieldContextValue {
    const ctx = React.useContext(FieldContext);
    if (!ctx) throw new Error('useField debe usarse dentro de <Field>.');
    return ctx;
}

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Marca el campo con error: pinta el mensaje en rojo y añade `aria-invalid` al control. */
    invalid?: boolean;
    /** Desactiva visualmente la etiqueta y el control. */
    disabled?: boolean;
    /** Id del control. Si no se pasa, se genera uno. */
    id?: string;
    /** Tamaño de etiqueta, descripción y mensaje (Figma: Field size). El control lleva su propio `size`. */
    size?: FieldSize;
}

/**
 * Campo de formulario completo (Figma: Field): etiqueta + descripción + control + mensaje.
 * Conecta solo los `id`, `aria-describedby` y `aria-invalid` entre sus partes.
 *
 * @example
 * <Field invalid={!!errors.email}>
 *     <FieldLabel indicator="required">Correo electrónico</FieldLabel>
 *     <FieldControl><Input type="email" {...register('email')} /></FieldControl>
 *     <FieldMessage>{errors.email?.message}</FieldMessage>
 * </Field>
 */
const Field = React.forwardRef<HTMLDivElement, FieldProps>(
    ({ className, invalid = false, disabled = false, id, size = 'md', ...props }, ref) => {
        const autoId = React.useId();
        const baseId = id ?? autoId;
        const [hasDescription, setHasDescription] = React.useState(false);
        const [hasMessage, setHasMessage] = React.useState(false);
        const value = React.useMemo<FieldContextValue>(
            () => ({
                id: baseId,
                descriptionId: `${baseId}-description`,
                messageId: `${baseId}-message`,
                invalid,
                disabled,
                size,
                hasDescription,
                hasMessage,
                setHasDescription,
                setHasMessage,
            }),
            [baseId, invalid, disabled, size, hasDescription, hasMessage],
        );
        return (
            <FieldContext.Provider value={value}>
                <div
                    ref={ref}
                    data-slot="field"
                    data-invalid={invalid}
                    data-disabled={disabled}
                    className={cn('group/field flex flex-col gap-gap-xs', className)}
                    {...props}
                />
            </FieldContext.Provider>
        );
    },
);
Field.displayName = 'Field';

/** Etiqueta del campo; apunta al control con `htmlFor`. */
const FieldLabel = React.forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
    const { id, size } = useField();
    return <Label ref={ref} htmlFor={id} size={size} {...props} />;
});
FieldLabel.displayName = 'FieldLabel';

/**
 * Envuelve el control (Input, Select, Textarea...) e inyecta `id`,
 * `aria-describedby` y `aria-invalid`.
 */
const FieldControl = React.forwardRef<
    HTMLElement,
    React.ComponentPropsWithoutRef<typeof Slot.Root>
>((props, ref) => {
    const { id, descriptionId, messageId, invalid, disabled, hasDescription, hasMessage } =
        useField();
    const describedBy =
        [hasDescription && descriptionId, hasMessage && messageId].filter(Boolean).join(' ') ||
        undefined;
    return (
        <Slot.Root
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            data-disabled={disabled || undefined}
            {...props}
        />
    );
});
FieldControl.displayName = 'FieldControl';

/** Texto de apoyo bajo la etiqueta o el control. */
const FieldDescription = React.forwardRef<HTMLParagraphElement, HelperTextProps>((props, ref) => {
    const { descriptionId, size, setHasDescription } = useField();
    React.useEffect(() => {
        setHasDescription(true);
        return () => setHasDescription(false);
    }, [setHasDescription]);
    return (
        <HelperText
            ref={ref}
            id={descriptionId}
            size={size === 'lg' ? 'md' : size === 'md' ? 'sm' : 'xs'}
            {...props}
        />
    );
});
FieldDescription.displayName = 'FieldDescription';

/**
 * Mensaje de validación. Solo se pinta si tiene contenido; con `invalid` sale en rojo
 * y con `role="alert"` para que se anuncie al aparecer.
 */
const FieldMessage = React.forwardRef<HTMLParagraphElement, HelperTextProps>(
    ({ children, type, ...props }, ref) => {
        const { messageId, invalid, size, setHasMessage } = useField();
        const visible = Boolean(children);
        React.useEffect(() => {
            setHasMessage(visible);
            return () => setHasMessage(false);
        }, [visible, setHasMessage]);
        if (!visible) return null;
        return (
            <HelperText
                ref={ref}
                id={messageId}
                role={invalid ? 'alert' : undefined}
                type={type ?? (invalid ? 'error' : 'default')}
                showIcon={invalid}
                size={size === 'lg' ? 'lg' : size === 'md' ? 'sm' : 'xs'}
                {...props}
            >
                {children}
            </HelperText>
        );
    },
);
FieldMessage.displayName = 'FieldMessage';

export { Field, FieldLabel, FieldControl, FieldDescription, FieldMessage, useField };
