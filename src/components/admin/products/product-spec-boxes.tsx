'use client';

import { Controller, type Control, type FieldPath, type UseFormReturn } from 'react-hook-form';
import { AdminBox } from '@/components/admin/admin-box';
import { Field, FieldControl, FieldLabel, FieldMessage } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ProductFormValues } from '@/lib/validations/admin-products';
import { inputToNumber, numberToInput } from './product-form-values';

/** Relleno de los controles de 36 px del diseño (12 px a cada lado). */
const CONTROL = 'px-inset-sm';

/** El «Opcional» de la etiqueta va pegado a la derecha del campo (Figma: FormLabel). */
const OPTIONAL_LABEL = 'w-full [&>span]:ml-auto';

type NumericName = Extract<
    FieldPath<ProductFormValues>,
    'alcoholContent' | 'minTemperature' | 'maxTemperature' | 'vineyardAltitude' | 'yield'
>;

type TextName = Extract<
    FieldPath<ProductFormValues>,
    'agingTime' | 'production' | 'agingMethod' | 'soilType'
>;

/** Campo numérico opcional: vacío es `null`; la unidad (si la hay) va al final del campo. */
function NumberControl({
    control,
    name,
    unit,
    step,
    ariaLabel,
}: {
    control: Control<ProductFormValues>;
    name: NumericName;
    unit?: string;
    step: string;
    ariaLabel?: string;
}) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <FieldControl>
                    <Input
                        type="number"
                        inputMode="decimal"
                        size="sm"
                        step={step}
                        className={cn(CONTROL, unit && 'pr-12')}
                        endIcon={unit && <span className="text-sm">{unit}</span>}
                        aria-label={ariaLabel}
                        value={numberToInput(field.value as number | null)}
                        onChange={(event) => {
                            const value = inputToNumber(event.target.value);
                            field.onChange(Number.isNaN(value) ? null : value);
                        }}
                        onBlur={field.onBlur}
                    />
                </FieldControl>
            )}
        />
    );
}

/** Campo de texto opcional con su etiqueta. */
function TextField({
    form,
    name,
    label,
    className,
}: {
    form: UseFormReturn<ProductFormValues>;
    name: TextName;
    label: string;
    className?: string;
}) {
    const error = form.formState.errors[name]?.message;
    return (
        <Field className={className} invalid={Boolean(error)}>
            <FieldLabel indicator="optional" className={OPTIONAL_LABEL}>
                {label}
            </FieldLabel>
            <FieldControl>
                <Input size="sm" className={CONTROL} {...form.register(name)} />
            </FieldControl>
            <FieldMessage>{error}</FieldMessage>
        </Field>
    );
}

/** Campo numérico opcional con su etiqueta. */
function NumberField({
    form,
    name,
    label,
    unit,
    step,
    className,
}: {
    form: UseFormReturn<ProductFormValues>;
    name: NumericName;
    label: string;
    unit?: string;
    step: string;
    className?: string;
}) {
    const error = form.formState.errors[name]?.message;
    return (
        <Field className={className} invalid={Boolean(error)}>
            <FieldLabel indicator="optional" className={OPTIONAL_LABEL}>
                {label}
            </FieldLabel>
            <NumberControl control={form.control} name={name} unit={unit} step={step} />
            <FieldMessage>{error}</FieldMessage>
        </Field>
    );
}

/**
 * Caja «Ficha técnica» (Figma: AdminBox con `fieldset` de tres columnas): graduación, temperatura
 * de servicio (mínima y máxima, con un guion entre las dos), crianza y producción. Todo es
 * opcional.
 */
export function ProductTechnicalBox({
    form,
    className,
}: {
    form: UseFormReturn<ProductFormValues>;
    className?: string;
}) {
    const { errors } = form.formState;
    const temperatureError = errors.minTemperature?.message ?? errors.maxTemperature?.message;
    return (
        <AdminBox title="Ficha técnica" titleId="ficha-tecnica" className={className}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <NumberField form={form} name="alcoholContent" label="Graduación (%)" step="0.01" />
                <Field
                    className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-2 sm:col-span-2"
                    invalid={Boolean(temperatureError)}
                >
                    <FieldLabel indicator="optional" className={cn(OPTIONAL_LABEL, 'col-span-3')}>
                        Temperatura de servicio (ºC)
                    </FieldLabel>
                    <div className="col-start-1 row-start-2">
                        <NumberControl
                            control={form.control}
                            name="minTemperature"
                            step="0.5"
                            ariaLabel="Temperatura mínima de servicio (ºC)"
                        />
                    </div>
                    <span
                        aria-hidden="true"
                        className="col-start-2 row-start-2 self-center text-sm font-medium text-muted-foreground"
                    >
                        -
                    </span>
                    <div className="col-start-3 row-start-2">
                        <NumberControl
                            control={form.control}
                            name="maxTemperature"
                            step="0.5"
                            ariaLabel="Temperatura máxima de servicio (ºC)"
                        />
                    </div>
                    <FieldMessage className="col-span-4">{temperatureError}</FieldMessage>
                </Field>
                <TextField form={form} name="agingTime" label="Crianza" className="sm:col-span-2" />
                <TextField form={form} name="production" label="Producción" />
            </div>
        </AdminBox>
    );
}

/**
 * Caja «Datos clave» (Figma: AdminBox con `fieldset` de dos columnas): altitud del viñedo, tipo
 * de suelo, método de crianza y rendimiento. Todo es opcional; la altitud va en m y el
 * rendimiento en kg/ha.
 */
export function ProductKeyDataBox({
    form,
    className,
}: {
    form: UseFormReturn<ProductFormValues>;
    className?: string;
}) {
    return (
        <AdminBox title="Datos clave" titleId="datos-clave" className={className}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NumberField
                    form={form}
                    name="vineyardAltitude"
                    label="Altitud del viñedo"
                    unit="m"
                    step="1"
                />
                <TextField form={form} name="soilType" label="Tipo de suelo" />
                <TextField form={form} name="agingMethod" label="Método de crianza" />
                <NumberField form={form} name="yield" label="Rendimiento" unit="kg/ha" step="1" />
            </div>
        </AdminBox>
    );
}
