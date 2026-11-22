import type { UserOrder } from '@/lib/db/queries';
import { calendarDate, estimatedDeliveryDate, toIsoDate } from './delivery';
import { orderNumber } from './format';
import { quoteOrder, type OrderQuote } from './quote';
import { canCustomerCancel, type OrderStatus } from './status';

/** Una línea del pedido tal como la ve el cliente: con el precio guardado y sin el IVA. */
export interface OrderDetailLine {
    variantId: number;
    name: string;
    vintage: number | null;
    /** Imagen del producto (id de Cloudinary); `null` si no tiene. */
    image: string | null;
    /** Nombre de la D.O. del producto. */
    originName: string;
    format: string;
    capacity: number;
    capacityUnit: 'ml' | 'g';
    quantity: number;
    unitPrice: string;
}

/** El pedido de un cliente, listo para la API y la página de detalle. */
export interface OrderDetail {
    id: number;
    /** `PJ-<id>`. */
    number: string;
    status: OrderStatus;
    paymentMethod: string;
    createdAt: string;
    /** Cuándo entró en el estado actual. */
    statusUpdatedAt: string;
    /** Estado que tenía al bloquearse; `null` si no está Bloqueado. */
    blockedFrom: OrderStatus | null;
    /** Número de su factura (`F-2026-0001`); `null` si aún no tiene (solo la tiene un pedido Entregado). */
    invoiceNumber: string | null;
    /** Quién lo anuló (`orders.cancelled_by`); `null` si no está anulado o fue el sistema. */
    cancelledBy: 'Cliente' | 'Administrador' | null;
    /** Si el cliente puede cancelarlo ahora (`canCustomerCancel`, comprobado en el servidor). */
    canCancel: boolean;
    shippingAddress: {
        recipientName: string | null;
        streetType: string | null;
        streetName: string | null;
        number: string | null;
        floor: string | null;
        postalCode: string | null;
        city: string | null;
        province: string | null;
        country: string | null;
        phone: string | null;
    };
    shippingType: {
        name: string;
        cost: string;
        minDeliveryDays: number | null;
        maxDeliveryDays: number | null;
    };
    /** `AAAA-MM-DD`, o `null` si el envío no tiene plazo. */
    estimatedDelivery: string | null;
    lines: OrderDetailLine[];
    /** Presupuesto recalculado con los precios y el envío GUARDADOS en el pedido. */
    quote: OrderQuote;
}

/**
 * Monta la vista del pedido de un cliente a partir de `getUserOrder`: el presupuesto con el precio
 * y el IVA guardados (no los vigentes), la entrega estimada y si se puede cancelar. Es lo que
 * comparten `GET /api/pedidos/[id]` y la página del servidor, para no repetir el cálculo.
 *
 * @param found - El pedido con sus líneas (`getUserOrder`).
 * @param now - Reloj, para el plazo de 24 h de la cancelación.
 * @returns La vista del pedido.
 */
export function buildOrderDetail(found: UserOrder, now: Date = new Date()): OrderDetail {
    const { order, lines } = found;
    const status = order.status as OrderStatus;

    const quote = quoteOrder(
        lines.map(({ quantity, unitPrice, taxRate }) => ({ quantity, price: unitPrice, taxRate })),
        order.shippingCost,
    );
    const estimatedDelivery =
        order.maxDeliveryDays === null
            ? null
            : toIsoDate(
                  estimatedDeliveryDate(calendarDate(order.createdAt), order.maxDeliveryDays),
              );

    return {
        id: order.id,
        number: orderNumber(order.id),
        status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        statusUpdatedAt: order.statusUpdatedAt,
        blockedFrom: order.blockedFrom as OrderStatus | null,
        invoiceNumber: order.invoiceNumber,
        cancelledBy: order.cancelledBy,
        canCancel: canCustomerCancel(
            { status, createdAt: order.createdAt, statusUpdatedAt: order.statusUpdatedAt },
            now,
        ),
        shippingAddress: {
            recipientName: order.recipientName,
            streetType: order.streetType,
            streetName: order.streetName,
            number: order.number,
            floor: order.floor,
            postalCode: order.postalCode,
            city: order.city,
            province: order.province,
            country: order.country,
            phone: order.phone,
        },
        shippingType: {
            name: order.shippingTypeName,
            cost: order.shippingCost,
            minDeliveryDays: order.minDeliveryDays,
            maxDeliveryDays: order.maxDeliveryDays,
        },
        estimatedDelivery,
        lines: lines.map((line) => ({
            variantId: line.variantId,
            name: line.name,
            vintage: line.vintage,
            image: line.image,
            originName: line.originName,
            format: line.format,
            capacity: line.capacity,
            capacityUnit: line.capacityUnit,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
        })),
        quote,
    };
}
