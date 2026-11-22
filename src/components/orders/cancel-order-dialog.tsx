'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cancelOrderRequest } from './cancel-order-request';

interface CancelOrderDialogProps {
    orderId: number;
    /** Número que ve el cliente (`PJ-12`). */
    orderNumber: string;
    /** Con tarjeta el aviso añade que se devuelve el importe. */
    paymentMethod: string;
}

/**
 * Botón "Cancelar pedido" con su confirmación (CU7, paso 5; Figma: modal de account-order-cancel,
 * con la forma del de eliminar cuenta): avisa de que no se puede deshacer. Al confirmar pide la
 * cancelación al servidor, que vuelve a comprobar el plazo. Solo se monta si `canCancel`.
 *
 * - Éxito: refresca la página (el pedido pasa a Anulado y desaparecen los botones) y avisa.
 * - 409 (plazo vencido, estado distinto o cambio simultáneo): avisa con el mensaje de la API y refresca.
 * - Otro fallo: aviso genérico y el diálogo se queda abierto para reintentar.
 *
 * @example
 * <CancelOrderDialog orderId={5} orderNumber="PJ-5" paymentMethod="Tarjeta" />
 */
export function CancelOrderDialog({ orderId, orderNumber, paymentMethod }: CancelOrderDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    async function confirm(event: React.MouseEvent) {
        // Radix cierra el diálogo al pulsar la acción: se cierra solo cuando acaba.
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        const outcome = await cancelOrderRequest(orderId);
        setBusy(false);

        if (outcome.kind === 'error') {
            toast.error('No se ha podido cancelar el pedido. Inténtalo de nuevo.');
            return;
        }
        setOpen(false);
        if (outcome.kind === 'rejected') toast.error(outcome.message);
        else
            toast.success(
                outcome.refund === 'failed'
                    ? 'Pedido cancelado. El reembolso se está tramitando.'
                    : 'Pedido cancelado',
            );
        router.refresh();
    }

    return (
        <AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">Cancelar pedido</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-120 gap-0 rounded-sm p-0">
                <AlertDialogHeader className="flex-row items-center justify-between border-b px-6 py-5">
                    <AlertDialogTitle className="text-base font-medium">
                        Cancelar pedido
                    </AlertDialogTitle>
                    <AlertDialogCancel
                        aria-label="Cerrar"
                        disabled={busy}
                        className="size-control-xs border-0 p-0 text-foreground"
                    >
                        <X aria-hidden="true" className="size-4" />
                    </AlertDialogCancel>
                </AlertDialogHeader>
                <div className="flex flex-col gap-gap-sm px-6 py-6">
                    <p className="text-base font-medium">
                        ¿Seguro que quieres cancelar el pedido {orderNumber}?
                    </p>
                    <AlertDialogDescription className="text-sm text-foreground">
                        Esta acción no se puede deshacer.
                        {paymentMethod === 'Tarjeta' &&
                            ' Se te devolverá el importe del pago a tu tarjeta en unos días.'}
                    </AlertDialogDescription>
                </div>
                <AlertDialogFooter className="flex-row justify-end border-t px-6 py-5">
                    <AlertDialogCancel disabled={busy}>Volver</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={busy}
                        onClick={confirm}
                        className={buttonVariants({ variant: 'destructive' })}
                    >
                        Cancelar pedido
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
