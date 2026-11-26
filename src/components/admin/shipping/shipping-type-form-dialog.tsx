'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { AdminFormDialog } from '@/components/admin/admin-form-dialog';
import {
    Field,
    FieldControl,
    FieldDescription,
    FieldLabel,
    FieldMessage,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { shippingStatusLabel } from '@/lib/admin/shipping-types';
import { valueRequest } from '@/lib/admin/value-request';
import type { AdminShippingTypeRow } from '@/lib/db/admin-shipping';
import { parseShippingForm, type ShippingFormValues } from '@/lib/validations/admin-shipping';

export interface ShippingTypeFormDialogProps {
    /** El tipo de envío que se edita; sin él, alta de uno nuevo. */
    shippingType?: AdminShippingTypeRow;
    /** Cierra el modal (cancelar, X, Esc o al guardar). */
    onClose: () => void;
}

/** Un tipo de envío nuevo se ofrece en el checkout (`is_blocked` es 0 por defecto). */
const NEW_SHIPPING_TYPE: ShippingFormValues = {
    name: '',
    cost: '',
    minDeliveryDays: '',
    maxDeliveryDays: '',
    isActive: true,
};

/** El coste de la BD (`'4.95'`) como se escribe: coma decimal; 0 se deja vacío (gratis). */
function costToText(cost: string): string {
    return Number(cost) === 0 ? '' : String(Number(cost)).replace('.', ',');
}

/** Resolver de RHF: convierte el texto con `parseShippingForm`, que valida con el esquema de la API. */
const resolver: Resolver<ShippingFormValues> = async (values) => {
    const result = parseShippingForm(values);
    if ('data' in result) return { values, errors: {} };
    return {
        values: {},
        errors: Object.fromEntries(
            Object.entries(result.errors).map(([name, message]) => [
                name,
                { type: 'validate', message },
            ]),
        ),
    };
};

/**
 * Modal de alta y edición de un tipo de envío (Figma: shipping-type-create-modal; CU13). Nombre,
 * precio (IVA incluido, opcional: vacío es envío gratis), plazos mínimo y máximo en días (opcionales)
 * y el interruptor de Estado, que es la única forma de desactivar un tipo (nunca se borran: los
 * pedidos los referencian). Guarda con `POST /api/admin/envios` o `PATCH /api/admin/envios/[id]` y
 * refresca el listado. Un nombre repetido (409) se pinta en el campo; no poder desactivar el último
 * activo, en el interruptor.
 *
 * @param props - El tipo de envío que se edita (opcional) y cómo cerrar.
 */
export function ShippingTypeFormDialog({ shippingType, onClose }: ShippingTypeFormDialogProps) {
    const router = useRouter();
    const formId = useId();
    const switchId = useId();
    const [saving, setSaving] = useState(false);
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<ShippingFormValues>({
        resolver,
        defaultValues: shippingType
            ? {
                  name: shippingType.name,
                  cost: costToText(shippingType.cost),
                  minDeliveryDays: shippingType.minDeliveryDays?.toString() ?? '',
                  maxDeliveryDays: shippingType.maxDeliveryDays?.toString() ?? '',
                  isActive: !shippingType.isBlocked,
              }
            : NEW_SHIPPING_TYPE,
    });

    const save = async (values: ShippingFormValues) => {
        if (saving) return;
        const parsed = parseShippingForm(values);
        if ('errors' in parsed) return;
        setSaving(true);
        const outcome = await valueRequest(
            shippingType ? `/api/admin/envios/${shippingType.id}` : '/api/admin/envios',
            shippingType ? 'PATCH' : 'POST',
            parsed.data,
        );
        setSaving(false);
        if (outcome.kind === 'ok') {
            toast.success(shippingType ? 'Tipo de envío actualizado' : 'Tipo de envío añadido');
            onClose();
            router.refresh();
        } else if (outcome.kind === 'rejected' && outcome.status === 409) {
            // Nombre repetido (campo) o último tipo activo (interruptor).
            setError(outcome.message.includes('nombre') ? 'name' : 'isActive', {
                message: outcome.message,
            });
        } else if (outcome.kind === 'rejected') {
            toast.error(outcome.message);
            if (outcome.status === 404) {
                onClose();
                router.refresh();
            }
        } else {
            toast.error('No se ha podido guardar el tipo de envío. Inténtalo de nuevo.');
        }
    };

    return (
        <AdminFormDialog
            title={shippingType ? 'Editar tipo de envío' : 'Añadir tipo de envío'}
            formId={formId}
            onSubmit={handleSubmit(save)}
            onClose={onClose}
            saving={saving}
        >
            <div className="grid grid-cols-1 gap-gap-md sm:grid-cols-2">
                <Field size="sm" invalid={!!errors.name} className="sm:col-span-2">
                    <FieldLabel className="text-muted-foreground">Nombre</FieldLabel>
                    <FieldControl>
                        <Input
                            size="sm"
                            autoComplete="off"
                            placeholder="p. ej., Exprés"
                            {...register('name')}
                        />
                    </FieldControl>
                    <FieldMessage>{errors.name?.message}</FieldMessage>
                </Field>
                <Field size="sm" invalid={!!errors.cost} className="sm:col-span-1">
                    <FieldLabel
                        indicator="optional"
                        className="w-full justify-between text-muted-foreground"
                    >
                        Precio (IVA incluido)
                    </FieldLabel>
                    <FieldControl>
                        <Input
                            size="sm"
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="p. ej., 9,95 €"
                            {...register('cost')}
                        />
                    </FieldControl>
                    {errors.cost ? (
                        <FieldMessage>{errors.cost.message}</FieldMessage>
                    ) : (
                        <FieldDescription>Vacío = envío gratis.</FieldDescription>
                    )}
                </Field>
                <div className="hidden sm:block" aria-hidden="true" />
                <Field size="sm" invalid={!!errors.minDeliveryDays}>
                    <FieldLabel
                        indicator="optional"
                        className="w-full justify-between text-muted-foreground"
                    >
                        Plazo mínimo (días)
                    </FieldLabel>
                    <FieldControl>
                        <Input
                            size="sm"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="p. ej., 3"
                            {...register('minDeliveryDays')}
                        />
                    </FieldControl>
                    {errors.minDeliveryDays ? (
                        <FieldMessage>{errors.minDeliveryDays.message}</FieldMessage>
                    ) : (
                        <FieldDescription>Vacío si no hay envío.</FieldDescription>
                    )}
                </Field>
                <Field size="sm" invalid={!!errors.maxDeliveryDays}>
                    <FieldLabel
                        indicator="optional"
                        className="w-full justify-between text-muted-foreground"
                    >
                        Plazo máximo (días)
                    </FieldLabel>
                    <FieldControl>
                        <Input
                            size="sm"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="p. ej., 5"
                            {...register('maxDeliveryDays')}
                        />
                    </FieldControl>
                    {errors.maxDeliveryDays ? (
                        <FieldMessage>{errors.maxDeliveryDays.message}</FieldMessage>
                    ) : (
                        <FieldDescription>Igual o mayor que el mínimo.</FieldDescription>
                    )}
                </Field>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label size="sm" htmlFor={switchId} className="text-muted-foreground">
                        Estado
                    </Label>
                    <Controller
                        control={control}
                        name="isActive"
                        render={({ field }) => (
                            <div className="flex min-h-6 max-w-80 items-center gap-gap-xs">
                                <Switch
                                    id={switchId}
                                    size="md"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    aria-invalid={!!errors.isActive || undefined}
                                />
                                <Label size="sm" htmlFor={switchId}>
                                    {field.value
                                        ? `${shippingStatusLabel(false)}: se ofrece en el checkout`
                                        : `${shippingStatusLabel(true)}: no se ofrece en el checkout`}
                                </Label>
                            </div>
                        )}
                    />
                    {errors.isActive && (
                        <p role="alert" className="text-xs text-destructive">
                            {errors.isActive.message}
                        </p>
                    )}
                </div>
            </div>
        </AdminFormDialog>
    );
}
