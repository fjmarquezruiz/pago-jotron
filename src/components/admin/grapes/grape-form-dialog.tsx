'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminFormDialog } from '@/components/admin/admin-form-dialog';
import { GrapeFields } from '@/components/admin/grapes/grape-fields';
import { toast } from '@/components/ui/toast';
import { valueRequest } from '@/lib/admin/value-request';
import { grapeSchema, type GrapeInput } from '@/lib/validations/admin-grapes';

export interface GrapeFormDialogProps {
    /** La uva que se edita; sin ella, alta de una nueva. */
    grape?: { id: number; name: string; color: GrapeInput['color'] };
    /** Cierra el modal (cancelar, X, Esc o al guardar). */
    onClose: () => void;
}

/**
 * Modal de alta y edición de una variedad de uva (Figma: grape-variety-create-modal; CU9). RHF con
 * `grapeSchema`; guarda con `POST /api/admin/uvas` o `PATCH /api/admin/uvas/[id]` y refresca el
 * listado (`router.refresh()`). Un nombre repetido (409) se pinta en el campo; cualquier otro
 * fallo, en un aviso.
 *
 * @param props - La uva que se edita (opcional) y cómo cerrar.
 */
export function GrapeFormDialog({ grape, onClose }: GrapeFormDialogProps) {
    const router = useRouter();
    const formId = useId();
    const [saving, setSaving] = useState(false);
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<GrapeInput>({
        resolver: zodResolver(grapeSchema),
        defaultValues: grape ? { name: grape.name, color: grape.color } : { name: '' },
    });

    const save = async (values: GrapeInput) => {
        if (saving) return;
        setSaving(true);
        const outcome = await valueRequest(
            grape ? `/api/admin/uvas/${grape.id}` : '/api/admin/uvas',
            grape ? 'PATCH' : 'POST',
            values,
        );
        setSaving(false);
        if (outcome.kind === 'ok') {
            toast.success(grape ? 'Variedad actualizada' : 'Variedad añadida');
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
            toast.error('No se ha podido guardar la variedad. Inténtalo de nuevo.');
        }
    };

    return (
        <AdminFormDialog
            title={grape ? 'Editar variedad de uva' : 'Añadir variedad de uva'}
            formId={formId}
            onSubmit={handleSubmit(save)}
            onClose={onClose}
            saving={saving}
        >
            <GrapeFields register={register} control={control} errors={errors} placeholders />
        </AdminFormDialog>
    );
}
