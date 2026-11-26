'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Field, FieldControl, FieldLabel, FieldMessage } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { GRAPE_COLORS } from '@/lib/admin/grapes';
import type { GrapeInput } from '@/lib/validations/admin-grapes';

/**
 * Los dos campos de una variedad de uva, los únicos de la tabla `grapes` (Figma:
 * grape-variety-create-modal): «Nombre de la variedad» y «Color» (Tinta, Blanca o Rosada). Los usan
 * el modal de alta y edición y la ficha.
 *
 * @param props.register - `register` del `useForm<GrapeInput>` del formulario.
 * @param props.control - `control` del mismo formulario (para el selector de color).
 * @param props.errors - `formState.errors` del mismo formulario.
 * @param props.placeholders - `true` en el modal, que lleva los marcadores de Figma; la ficha enseña los valores.
 */
export function GrapeFields({
    register,
    control,
    errors,
    placeholders = false,
}: {
    register: UseFormRegister<GrapeInput>;
    control: Control<GrapeInput>;
    errors: FieldErrors<GrapeInput>;
    placeholders?: boolean;
}) {
    return (
        <>
            <Field size="sm" invalid={!!errors.name}>
                <FieldLabel className="text-muted-foreground">Nombre de la variedad</FieldLabel>
                <FieldControl>
                    <Input
                        size="sm"
                        autoComplete="off"
                        placeholder={placeholders ? 'p. ej., Moscatel, Romé' : undefined}
                        {...register('name')}
                    />
                </FieldControl>
                <FieldMessage>{errors.name?.message}</FieldMessage>
            </Field>
            <Field size="sm" invalid={!!errors.color}>
                <FieldLabel className="text-muted-foreground">Color</FieldLabel>
                <Controller
                    control={control}
                    name="color"
                    render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <FieldControl>
                                <SelectTrigger size="sm" onBlur={field.onBlur} ref={field.ref}>
                                    <SelectValue placeholder="Seleccionar color (Tinta, Blanca o Rosada)" />
                                </SelectTrigger>
                            </FieldControl>
                            <SelectContent>
                                {GRAPE_COLORS.map((color) => (
                                    <SelectItem key={color} value={color}>
                                        {color}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                <FieldMessage>{errors.color?.message}</FieldMessage>
            </Field>
        </>
    );
}
