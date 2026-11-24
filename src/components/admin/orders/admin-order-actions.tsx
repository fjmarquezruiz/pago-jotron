'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogDescription,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import type { OrderStatus } from '@/lib/orders/status';
import { DialogFrame, Strong } from '@/components/admin/admin-dialog-frame';
import { changeStatusRequest } from './change-status-request';

/** Lo que el servidor ya ha decidido que el administrador puede hacer con este pedido. */
export interface AdminOrderActionsProps {
    orderId: number;
    /** `PJ-4521`. */
    orderNumber: string;
    status: OrderStatus;
    /** Botón principal (`primaryAction`), o `null` si el pedido no avanza. */
    primary: { label: string; to: OrderStatus } | null;
    /** Si se puede anular (`canAdminCancel`). */
    canCancel: boolean;
    /** Frase sobre stock y dinero del modal de anular (`cancelNotice`). */
    cancelNotice: string | null;
    /** Motivos de anulación de administración (`listAdminCancellationTypes`). */
    reasons: { id: number; description: string }[];
    /** Descarga de la factura: solo en Entregado y con factura emitida. */
    invoiceHref: string | null;
}

/** Estado de un cambio en curso y cómo avisar de su resultado; lo comparten los dos modales. */
function useStatusChange(orderId: number) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    async function run(to: OrderStatus, cancellationTypeId?: number) {
        if (busy) return;
        setBusy(true);
        const outcome = await changeStatusRequest(orderId, to, cancellationTypeId);
        setBusy(false);
        if (outcome.kind === 'error') {
            toast.error('No se ha podido cambiar el estado del pedido. Inténtalo de nuevo.');
            return;
        }
        setOpen(false);
        if (outcome.kind === 'rejected') toast.error(outcome.message);
        else if (outcome.refund === 'failed')
            toast.success('Pedido anulado. El reembolso ha fallado y hay que reintentarlo.');
        else toast.success(to === 'Anulado' ? 'Pedido anulado' : 'Estado del pedido actualizado');
        router.refresh();
    }
    return { open, setOpen, busy, run };
}

function ChangeStatusDialog({
    orderId,
    orderNumber,
    status,
    primary,
}: Pick<AdminOrderActionsProps, 'orderId' | 'orderNumber' | 'status'> & {
    primary: { label: string; to: OrderStatus };
}) {
    const { open, setOpen, busy, run } = useStatusChange(orderId);
    return (
        <AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
            <AlertDialogTrigger asChild>
                <Button variant="brand" size="xs">
                    {primary.label}
                </Button>
            </AlertDialogTrigger>
            <DialogFrame
                title="¿Cambiar el estado del pedido?"
                busy={busy}
                footer={
                    <>
                        <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={busy}
                            onClick={(event) => {
                                // Radix cierra el diálogo al pulsar la acción: se cierra solo cuando acaba.
                                event.preventDefault();
                                void run(primary.to);
                            }}
                            className={buttonVariants({ variant: 'default' })}
                        >
                            Cambiar estado
                        </AlertDialogAction>
                    </>
                }
            >
                <AlertDialogDescription className="text-sm text-foreground">
                    El pedido <Strong>#{orderNumber}</Strong> pasará de <Strong>{status}</Strong> a{' '}
                    <Strong>{primary.to}</Strong>.
                </AlertDialogDescription>
            </DialogFrame>
        </AlertDialog>
    );
}

function CancelDialog({
    orderId,
    orderNumber,
    cancelNotice,
    reasons,
}: Pick<AdminOrderActionsProps, 'orderId' | 'orderNumber' | 'cancelNotice' | 'reasons'>) {
    const { open, setOpen, busy, run } = useStatusChange(orderId);
    const [reason, setReason] = useState('');
    const selectId = `cancel-reason-${orderId}`;
    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (busy) return;
                setOpen(next);
                if (next) setReason('');
            }}
        >
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="xs">
                    Anular pedido
                </Button>
            </AlertDialogTrigger>
            <DialogFrame
                title="¿Anular el pedido?"
                busy={busy}
                footer={
                    <>
                        <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={busy || reason === ''}
                            onClick={(event) => {
                                event.preventDefault();
                                void run('Anulado', Number(reason));
                            }}
                            className={buttonVariants({ variant: 'destructive' })}
                        >
                            Anular pedido
                        </AlertDialogAction>
                    </>
                }
            >
                <AlertDialogDescription asChild>
                    <div className="flex flex-col gap-gap-lg text-sm text-foreground">
                        <p>
                            El pedido <Strong>#{orderNumber}</Strong> pasará a{' '}
                            <Strong>Anulado</Strong>.
                        </p>
                        {cancelNotice && <p>{cancelNotice}</p>}
                    </div>
                </AlertDialogDescription>
                <div className="flex flex-col gap-gap-xs">
                    <Label htmlFor={selectId} size="sm">
                        Motivo de la anulación
                    </Label>
                    <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger id={selectId} size="sm">
                            <SelectValue placeholder="Elige un motivo" />
                        </SelectTrigger>
                        <SelectContent>
                            {reasons.map(({ id, description }) => (
                                <SelectItem key={id} value={String(id)}>
                                    {description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </DialogFrame>
        </AlertDialog>
    );
}

/**
 * Botones del detalle de un pedido (Figma: admin-order-detail): "Anular pedido" (outline, solo si el
 * estado lo permite) y el principal en `brand` ("Confirmar pago", "Pasar a <estado>" o "Reanudar
 * pedido"), cada uno con su modal. En un pedido Entregado, "Factura (PDF)". El servidor vuelve a
 * comprobar cada cambio; aquí solo se enseñan los botones que tienen sentido. Va dos veces en la
 * página (cabecera y pie), con 12 px entre botones.
 */
export function AdminOrderActions(props: AdminOrderActionsProps) {
    const { primary, canCancel, invoiceHref } = props;
    return (
        <>
            {invoiceHref && (
                <Button asChild variant="outline" size="xs">
                    {/* Sin `download`: la ruta ya manda `Content-Disposition: attachment`. */}
                    <a href={invoiceHref}>
                        <Download aria-hidden="true" />
                        Factura (PDF)
                    </a>
                </Button>
            )}
            {canCancel && <CancelDialog {...props} />}
            {primary && <ChangeStatusDialog {...props} primary={primary} />}
        </>
    );
}
