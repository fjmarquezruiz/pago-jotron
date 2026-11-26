'use client';

import { useId, useState } from 'react';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { Strong } from '@/components/admin/admin-dialog-frame';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { salesStatusLabel } from '@/lib/admin/catalog';

export interface AdminSalesToggleProps {
    /** `is_blocked` actual de la fila. El interruptor está encendido cuando NO está bloqueada. */
    isBlocked: boolean;
    /** Qué se bloquea, en minúscula: «producto», «bodega», «denominación de origen». Va en el título. */
    noun: string;
    /** Artículo de la frase del modal: «El» o «La». */
    article: 'El' | 'La';
    /** Nombre de la fila, en negrita en el modal. */
    name: string;
    /** Complemento de la frase del modal, sin comas, como «de Bodegas Pago de Jotrón» (Figma: admin-confirm-modal-block). */
    context?: string;
    /**
     * Pide el cambio al servidor. Devuelve `true` si se guardó (el modal se cierra) y `false` si
     * falló (el modal sigue abierto y quien llama avisa con un toast). Quien llama hace `router.refresh()`.
     */
    onChange: (nextIsBlocked: boolean) => Promise<boolean>;
    /** Sin permiso (el bloqueo de bodega y D.O. es solo del administrador) o mientras se carga. */
    disabled?: boolean;
    /** Lo que va entre el texto y los botones del modal de bloqueo: el aviso y la tabla de pedidos en curso (`SalesBlockOrders`). Se monta al abrir el modal. */
    blockExtra?: React.ReactNode;
    /** Título del modal de bloqueo; por defecto «Bloquear {noun}». Figma: «¿Bloquear ventas de la bodega?». */
    blockTitle?: string;
    /** Texto del botón de bloquear; por defecto «Bloquear». Figma (bodega, D.O.): «Bloquear ventas». */
    blockConfirmLabel?: string;
    /** Párrafos del modal de bloqueo en lugar de la frase por defecto (la de bodega y D.O. de Figma es más larga). */
    blockBody?: React.ReactNode;
}

/**
 * Interruptor de Estado de venta de un producto, bodega o D.O. (Figma: admin-product-edit, la
 * etiqueta «Estado» + Switch + Badge de 24 px de alto). Guarda `is_blocked` al revés: encendido es
 * «A la venta» (insignia verde) y apagado «Ventas bloqueadas» (insignia roja).
 *
 * Al apagarlo se abre el modal de bloqueo (Figma: admin-confirm-modal-block) y el interruptor no
 * se mueve hasta que el servidor confirma. Al volver a encenderlo se abre una confirmación sencilla
 * («Poner a la venta»), que no está en Figma.
 *
 * @example
 * <AdminSalesToggle isBlocked={wine.isBlocked} noun="producto" article="El" name={wine.name}
 *     context={`de ${wine.winery}`} onChange={(blocked) => setBlocked(wine.id, blocked)} />
 */
export function AdminSalesToggle({
    isBlocked,
    noun,
    article,
    name,
    context,
    onChange,
    disabled = false,
    blockExtra,
    blockTitle,
    blockConfirmLabel,
    blockBody,
}: AdminSalesToggleProps) {
    const [confirming, setConfirming] = useState<'block' | 'release' | null>(null);
    const [busy, setBusy] = useState(false);
    const labelId = useId();

    async function apply(next: boolean) {
        if (busy) return;
        setBusy(true);
        const saved = await onChange(next);
        setBusy(false);
        if (saved) setConfirming(null);
    }

    return (
        <>
            <div className="flex h-6 items-center gap-gap-xs">
                <span id={labelId} className="text-xs font-medium">
                    Estado
                </span>
                <Switch
                    size="md"
                    variant="outline"
                    aria-labelledby={labelId}
                    checked={!isBlocked}
                    disabled={disabled || busy}
                    onCheckedChange={(onSale) => setConfirming(onSale ? 'release' : 'block')}
                />
                <Badge tone={isBlocked ? 'destructive' : 'success'} variant="subtle">
                    {salesStatusLabel(isBlocked)}
                </Badge>
            </div>
            <AdminConfirmDialog
                open={confirming !== null}
                onOpenChange={(open) => !open && setConfirming(null)}
                title={
                    confirming === 'release'
                        ? `Poner a la venta ${noun}`
                        : (blockTitle ?? `Bloquear ${noun}`)
                }
                confirmLabel={
                    confirming === 'release'
                        ? 'Poner a la venta'
                        : (blockConfirmLabel ?? 'Bloquear')
                }
                tone="default"
                busy={busy}
                onConfirm={() => void apply(confirming === 'block')}
                extra={confirming === 'block' ? blockExtra : undefined}
            >
                {confirming === 'release' ? (
                    <p>
                        {article} {noun} <Strong>{name}</Strong>
                        {context ? `, ${context},` : ''} volverá a poder comprarse en la web.
                    </p>
                ) : (
                    (blockBody ?? (
                        <p>
                            {article} {noun} <Strong>{name}</Strong>
                            {context ? `, ${context},` : ''} dejará de poder comprarse en la web.
                        </p>
                    ))
                )}
            </AdminConfirmDialog>
        </>
    );
}
