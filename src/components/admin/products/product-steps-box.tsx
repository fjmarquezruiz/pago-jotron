'use client';

import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { AdminBox } from '@/components/admin/admin-box';
import { Button } from '@/components/ui/button';
import { Step } from '@/components/ui/step';
import type { ProductFormValues } from '@/lib/validations/admin-products';

export interface ProductStepsBoxProps {
    form: UseFormReturn<ProductFormValues>;
    className?: string;
}

/**
 * Caja «Elaboración del vino» (Figma: AdminBox con una lista de `Step` en `fieldset`): cabecera de
 * 18 px con el botón «Añadir paso» (xs) y, debajo, un `Step` por paso con su título de 12 px, la
 * descripción de 14 px y el botón de quitar. Las filas son un `useFieldArray` y su orden es el de
 * `product_steps.position`. El título se escribe en el propio paso (`Step` con `onTitleChange`).
 */
export function ProductStepsBox({ form, className }: ProductStepsBoxProps) {
    const {
        control,
        formState: { errors },
    } = form;
    const { fields, append, remove } = useFieldArray({ control, name: 'steps' });

    return (
        <AdminBox
            title="Elaboración del vino"
            titleId="elaboracion"
            className={className}
            action={
                <Button
                    type="button"
                    size="xs"
                    onClick={() => append({ title: '', description: '' })}
                >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Añadir paso
                </Button>
            }
        >
            {errors.steps?.message && (
                <p role="alert" className="text-xs text-destructive">
                    {errors.steps.message}
                </p>
            )}
            {fields.length > 0 && (
                <div className="flex flex-col gap-4">
                    {fields.map((field, index) => (
                        <Controller
                            key={field.id}
                            control={control}
                            name={`steps.${index}`}
                            render={({ field: step }) => (
                                <Step
                                    size="xs"
                                    title={step.value.title}
                                    onTitleChange={(title) =>
                                        step.onChange({ ...step.value, title })
                                    }
                                    titleMaxLength={100}
                                    value={step.value.description}
                                    onChange={(event) =>
                                        step.onChange({
                                            ...step.value,
                                            description: event.target.value,
                                        })
                                    }
                                    onBlur={step.onBlur}
                                    onRemove={() => remove(index)}
                                    maxLength={2000}
                                    placeholder="Describe este paso"
                                    error={
                                        errors.steps?.[index]?.title?.message ??
                                        errors.steps?.[index]?.description?.message
                                    }
                                    className="[&_textarea]:text-sm [&_textarea]:leading-5 [&_textarea]:font-medium"
                                />
                            )}
                        />
                    ))}
                </div>
            )}
        </AdminBox>
    );
}
