import * as React from 'react';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface PaymentNoticeProps {
    /** Título del aviso (14 px, semibold, del color del tipo). */
    title: React.ReactNode;
    /** Descripción opcional bajo el título (12 px). */
    children?: React.ReactNode;
    className?: string;
}

/**
 * Aviso ámbar pequeño de Pago (Figma: `Alert size=sm type=warning`): lo usan el aviso de "Pendiente
 * de pago" de la transferencia y la nota "No se ha realizado ningún cargo." del resumen.
 *
 * Retoque LOCAL del `Alert size="sm"` del sistema de diseño, que no coincide con Figma: allí el
 * relleno es 8 arriba, a la derecha y abajo y 12 a la izquierda (`inset-xs` e `inset-sm`; el
 * sistema pone 12 en todos), el hueco entre icono y texto es 8 (`gap-xs`; el sistema, 12) y el
 * título es `sm` semibold 14/20 (el sistema, 12). La descripción sí es 12/16 como en el sistema.
 *
 * Es información estática, no una incidencia: lleva `role="note"` en lugar del `alert` que pone
 * el `Alert` a los de tipo `warning`, para que no se anuncie de golpe al aparecer.
 *
 * @example
 * <PaymentNotice title="No se ha realizado ningún cargo." />
 */
export function PaymentNotice({ title, children, className }: PaymentNoticeProps) {
    return (
        <Alert
            type="warning"
            size="sm"
            role="note"
            title={title}
            className={cn(
                'gap-x-gap-xs py-inset-xs pr-inset-xs pl-inset-sm [&_[data-slot=alert-title]]:text-sm',
                className,
            )}
        >
            {children}
        </Alert>
    );
}
