'use client';

import { DialogFrame } from '@/components/admin/admin-dialog-frame';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';

export interface AdminConfirmDialogProps {
    open: boolean;
    /** Se llama al cancelar, cerrar con la X o pulsar Esc (nunca mientras `busy`). */
    onOpenChange: (open: boolean) => void;
    /** Título del modal: «Dar de baja producto». */
    title: string;
    /** Texto del botón de confirmar: «Dar de baja». */
    confirmLabel: string;
    /** `destructive` (fondo rojo suave, Figma: admin-confirm-modal) o `default` (negro, admin-confirm-modal-block). */
    tone?: 'destructive' | 'default';
    /** Guardando: bloquea los dos botones y la X. */
    busy?: boolean;
    /** Confirmar. El modal NO se cierra solo: lo cierra quien llama al acabar (`onOpenChange(false)`). */
    onConfirm: () => void;
    /** Párrafos del cuerpo (14 px, 24 px entre ellos). */
    children: React.ReactNode;
    /** Lo que hay entre el cuerpo y los botones, como la tabla de pedidos afectados del bloqueo. */
    extra?: React.ReactNode;
}

/**
 * Modal de confirmación del panel (Figma: admin-confirm-modal y admin-confirm-modal-block): 480 px,
 * título de 18 px, cuerpo de 14 px y «Cancelar» + botón de confirmar de 40 px a la derecha. Sobre
 * `DialogFrame` y `AlertDialog` (rol `alertdialog`, no se cierra al pulsar fuera).
 *
 * @example
 * <AdminConfirmDialog open={open} onOpenChange={setOpen} title="Dar de baja producto"
 *     confirmLabel="Dar de baja" tone="destructive" onConfirm={baja}>
 *     <p>El producto <Strong>Jotrón Reserva 2019</Strong> dejará de verse en la tienda.</p>
 * </AdminConfirmDialog>
 */
export function AdminConfirmDialog({
    open,
    onOpenChange,
    title,
    confirmLabel,
    tone = 'destructive',
    busy = false,
    onConfirm,
    children,
    extra,
}: AdminConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
            {open && (
                <DialogFrame
                    title={title}
                    busy={busy}
                    footer={
                        <>
                            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={busy}
                                onClick={(event) => {
                                    // Radix cierra el diálogo al pulsar la acción: se cierra cuando acaba.
                                    event.preventDefault();
                                    onConfirm();
                                }}
                                className={buttonVariants({
                                    variant: tone === 'destructive' ? 'destructive' : 'default',
                                })}
                            >
                                {confirmLabel}
                            </AlertDialogAction>
                        </>
                    }
                >
                    <AlertDialogDescription asChild>
                        <div className="flex flex-col gap-gap-lg text-sm text-foreground">
                            {children}
                        </div>
                    </AlertDialogDescription>
                    {extra}
                </DialogFrame>
            )}
        </AlertDialog>
    );
}
