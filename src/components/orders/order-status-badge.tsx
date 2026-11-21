import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { OrderStatus } from '@/lib/orders/status';
import { STATUS_TONE } from '@/lib/orders/status-ui';

interface OrderStatusBadgeProps extends Omit<BadgeProps, 'tone' | 'children'> {
    /** Estado del pedido (`order_statuses.name`). */
    status: OrderStatus;
}

/**
 * Etiqueta del estado de un pedido (Figma: Badge en la tabla del historial y junto al título del
 * detalle). El color sale de `STATUS_TONE`, el mismo mapa que usa el stepper: un color fijo por
 * estado en todo el sitio. Por defecto `solid` y `sm`, como en el historial.
 *
 * @param props.status - Estado del pedido.
 *
 * @example
 * <OrderStatusBadge status="Entregado" />
 */
export function OrderStatusBadge({
    status,
    variant = 'solid',
    size = 'sm',
    ...props
}: OrderStatusBadgeProps) {
    return (
        <Badge tone={STATUS_TONE[status]} variant={variant} size={size} {...props}>
            {status}
        </Badge>
    );
}
