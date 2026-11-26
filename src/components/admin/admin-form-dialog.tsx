'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface AdminFormDialogProps {
    /** Título del modal: «Añadir variedad de uva». */
    title: string;
    /** `id` del `<form>`: «Guardar» (en el pie, fuera del formulario) lo envía con él. */
    formId: string;
    /** Se llama al enviar; normalmente `handleSubmit(...)` de RHF. */
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    /** Se llama al cancelar, cerrar con la X o pulsar Esc (nunca mientras `saving`). */
    onClose: () => void;
    /** Guardando: «Guardar» muestra el spinner y no se puede cerrar. */
    saving?: boolean;
    /** Texto del botón principal; por defecto «Guardar». */
    submitLabel?: string;
    /** Los `Field` del formulario. */
    children: React.ReactNode;
}

/**
 * Modal de alta y edición de un valor del panel (Figma: grape-variety-create-modal): 480 px, cabecera
 * con el título de 18 px y la X de 36 px a 24 px del borde, cuerpo con 24 px de relleno y 24 px entre
 * campos, y pie con «Cancelar» y «Guardar» de 40 px a la derecha. Es el hermano de `DialogFrame`
 * para formularios: rol `dialog` (no `alertdialog`), que sí se cierra con Esc.
 *
 * Se monta solo mientras está abierto: cada vez parte de un formulario nuevo.
 *
 * @example
 * <AdminFormDialog title="Añadir variedad de uva" formId="grape-form" onClose={close}
 *     onSubmit={handleSubmit(save)} saving={isSubmitting}>
 *     <Field>…</Field>
 * </AdminFormDialog>
 */
export function AdminFormDialog({
    title,
    formId,
    onSubmit,
    onClose,
    saving = false,
    submitLabel = 'Guardar',
    children,
}: AdminFormDialogProps) {
    return (
        <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
            <DialogContent
                hideClose
                aria-describedby={undefined}
                onInteractOutside={(event) => saving && event.preventDefault()}
                onEscapeKeyDown={(event) => saving && event.preventDefault()}
                className="max-w-120 gap-0 overflow-clip rounded-sm p-0"
            >
                <DialogHeader className="relative flex-row items-center gap-gap-md border-b py-inset-lg pr-16 pl-inset-xl">
                    <DialogTitle className="text-lg font-medium">{title}</DialogTitle>
                    <DialogClose
                        aria-label="Cerrar"
                        disabled={saving}
                        className="absolute top-4 right-6 inline-flex size-control-sm cursor-pointer items-center justify-center rounded-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X aria-hidden="true" className="size-4" />
                    </DialogClose>
                </DialogHeader>
                <form
                    id={formId}
                    noValidate
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit(event);
                    }}
                    className="flex flex-col gap-gap-lg p-inset-xl text-sm text-foreground"
                >
                    {children}
                </form>
                <DialogFooter className="flex-row justify-end gap-gap-md border-t px-inset-xl pt-inset-lg pb-inset-xl">
                    <Button
                        type="button"
                        variant="outline"
                        size="md"
                        disabled={saving}
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form={formId}
                        variant="default"
                        size="md"
                        loading={saving}
                    >
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
