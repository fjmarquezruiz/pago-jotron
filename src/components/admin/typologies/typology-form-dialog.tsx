'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminFormDialog } from '@/components/admin/admin-form-dialog';
import { Field, FieldControl, FieldLabel, FieldMessage } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { PRODUCT_TYPES } from '@/lib/admin/typologies';
import { valueRequest } from '@/lib/admin/value-request';
import { typologySchema, type TypologyInput } from '@/lib/validations/admin-typologies';

export interface TypologyFormDialogProps {
    /** La tipología que se edita (con el IVA como número); sin ella, alta de una nueva. */
    typology?: { id: number } & TypologyInput;
    /** Cierra el modal (cancelar, X, Esc o al guardar). */
    onClose: () => void;
}

/** Valores de una tipología nueva: los de `DEFAULT` de la tabla (Vino, orden 0, IVA del 21 %). */
const NEW_TYPOLOGY: TypologyInput = { name: '', productType: 'Vino', filterOrder: 0, taxRate: 21 };

/**
 * Modal de alta y edición de una tipología (CU9). No hay diseño propio: lleva el marco del modal de
 * uvas (grape-variety-create-modal) con los cuatro campos que enseña typologies-list: nombre, tipo
 * de producto, orden en filtros e IVA. RHF con `typologySchema`; guarda con
 * `POST /api/admin/tipologias` o `PATCH /api/admin/tipologias/[id]` y refresca el listado. Un nombre
 * repetido (409) se pinta en el campo.
 *
 * @param props - La tipología que se edita (opcional) y cómo cerrar.
 */
export function TypologyFormDialog({ typology, onClose }: TypologyFormDialogProps) {
    const router = useRouter();
    const formId = useId();
    const [saving, setSaving] = useState(false);
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<TypologyInput>({
        resolver: zodResolver(typologySchema),
        defaultValues: typology
            ? {
                  name: typology.name,
                  productType: typology.productType,
                  filterOrder: typology.filterOrder,
                  taxRate: typology.taxRate,
              }
            : NEW_TYPOLOGY,
    });

    const save = async (values: TypologyInput) => {
        if (saving) return;
        setSaving(true);
        const outcome = await valueRequest(
            typology ? `/api/admin/tipologias/${typology.id}` : '/api/admin/tipologias',
            typology ? 'PATCH' : 'POST',
            values,
        );
        setSaving(false);
        if (outcome.kind === 'ok') {
            toast.success(typology ? 'Tipología actualizada' : 'Tipología añadida');
            onClose();
            router.refresh();
        } else if (outcome.kind === 'rejected' && outcome.status === 409) {
            setError('name', { message: outcome.message });
        } else if (outcome.kind === 'rejected') {
            toast.error(outcome.message);
            if (outcome.status === 404) {
                onClose();
                router.refresh();
            }
        } else {
            toast.error('No se ha podido guardar la tipología. Inténtalo de nuevo.');
        }
    };

    return (
        <AdminFormDialog
            title={typology ? 'Editar tipología' : 'Añadir tipología'}
            formId={formId}
            onSubmit={handleSubmit(save)}
            onClose={onClose}
            saving={saving}
        >
            <Field size="sm" invalid={!!errors.name}>
                <FieldLabel className="text-muted-foreground">Nombre de la tipología</FieldLabel>
                <FieldControl>
                    <Input size="sm" autoComplete="off" {...register('name')} />
                </FieldControl>
                <FieldMessage>{errors.name?.message}</FieldMessage>
            </Field>
            <Field size="sm" invalid={!!errors.productType}>
                <FieldLabel className="text-muted-foreground">Tipo de producto</FieldLabel>
                <Controller
                    control={control}
                    name="productType"
                    render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <FieldControl>
                                <SelectTrigger size="sm" onBlur={field.onBlur} ref={field.ref}>
                                    <SelectValue placeholder="Seleccionar tipo (Vino o Pasas)" />
                                </SelectTrigger>
                            </FieldControl>
                            <SelectContent>
                                {PRODUCT_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                <FieldMessage>{errors.productType?.message}</FieldMessage>
            </Field>
            <Field size="sm" invalid={!!errors.filterOrder}>
                <FieldLabel className="text-muted-foreground">Orden en filtros</FieldLabel>
                <FieldControl>
                    <Input
                        size="sm"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        {...register('filterOrder', { valueAsNumber: true })}
                    />
                </FieldControl>
                <FieldMessage>{errors.filterOrder?.message}</FieldMessage>
            </Field>
            <Field size="sm" invalid={!!errors.taxRate}>
                <FieldLabel className="text-muted-foreground">IVA (%)</FieldLabel>
                <FieldControl>
                    <Input
                        size="sm"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step={0.01}
                        {...register('taxRate', { valueAsNumber: true })}
                    />
                </FieldControl>
                <FieldMessage>{errors.taxRate?.message}</FieldMessage>
            </Field>
        </AdminFormDialog>
    );
}
