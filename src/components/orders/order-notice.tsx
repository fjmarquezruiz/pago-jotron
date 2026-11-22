import { Alert } from '@/components/ui/alert';
import { ORDER_NOTICES, type OrderNoticeKind } from '@/lib/orders/status-ui';
import { cn } from '@/lib/utils';

interface OrderNoticeProps {
    /** Qué aviso enseñar (`stepperProgress(...).notice`). */
    kind: OrderNoticeKind;
    className?: string;
}

/**
 * Aviso sobre las líneas del pedido (Figma: Alert de account-order-pending-payment y
 * account-order-blocked): el título en negrita y el resto del texto, en la misma línea y con el
 * color del tipo. Pendiente de pago y Bloqueado son `warning`; Anulado, `error`.
 *
 * @param props.kind - `pending-payment`, `blocked` o `cancelled`.
 *
 * @example
 * <OrderNotice kind="blocked" />
 */
export function OrderNotice({ kind, className }: OrderNoticeProps) {
    const { type, title, description } = ORDER_NOTICES[kind];
    const color = type === 'error' ? 'text-destructive' : 'text-warning';
    return (
        <Alert
            type={type}
            size="sm"
            className={cn(
                'items-center gap-x-gap-xs py-inset-xs pr-inset-xs pl-inset-sm text-sm',
                className,
            )}
        >
            <p className={color}>
                <strong className="font-semibold">{title}</strong>
                {description && <span> {description}</span>}
            </p>
        </Alert>
    );
}
