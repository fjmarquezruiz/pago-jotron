/**
 * Lógica pura de la página Confirmar del checkout (Figma: checkout-4-confirmacion, su variante de
 * transferencia y checkout-3-pago-rechazado): qué variante se pinta, los textos que dependen de los
 * datos y el mapeo del pedido (o del carrito, en el rechazo) a las props de `OrderSummary`.
 */
import type { OrderSummaryItem } from '@/components/shop/order-summary';
import { cartSubtotalCents, lineTotalCents, priceToCents } from '@/lib/cart/totals';
import type { Cart } from '@/lib/cart/cart';
import { formatPresentation } from '@/lib/catalog/presentation';
import type { AddressLike } from '@/lib/checkout/address';
import {
    calendarDate,
    estimatedDeliveryDate,
    formatDeliveryDate,
    toIsoDate,
} from '@/lib/orders/delivery';
import type { TransferDetails } from '@/lib/payments/transfer';
import { MAX_ID } from '@/lib/validations/ids';
import type { ConfirmationOrder } from '@/lib/validations/order-response';

/** Qué muestra la página según su URL: un pedido hecho, el rechazo del pago o nada válido. */
export type ConfirmationTarget =
    { kind: 'order'; orderId: number } | { kind: 'rejected' } | { kind: 'invalid' };

/** Parámetros de búsqueda de la página, tal como los da Next. */
export interface ConfirmationParams {
    pedido?: string | string[];
    resultado?: string | string[];
}

/** Variante de un pedido hecho: pagado con tarjeta o pendiente de la transferencia. */
export type ConfirmationVariant = 'card' | 'transfer';

/** Primer valor de un parámetro que puede venir repetido (`?a=1&a=2`). */
function first(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

/**
 * Decide qué variante de la página se pinta a partir de la URL. `?pedido=<id>` (entero positivo)
 * manda sobre `?resultado=rechazado`: con un pedido válido hay un pedido que enseñar. Cualquier otra
 * cosa (sin parámetros, un id que no es un entero válido, otro `resultado`) es `invalid` y la
 * página redirige al carrito.
 *
 * @param params - `pedido` y `resultado` de la URL.
 * @returns El destino de la página.
 *
 * @example
 * parseConfirmationParams({ pedido: '4521' }); // { kind: 'order', orderId: 4521 }
 * parseConfirmationParams({ resultado: 'rechazado' }); // { kind: 'rejected' }
 */
export function parseConfirmationParams(params: ConfirmationParams): ConfirmationTarget {
    const pedido = first(params.pedido);
    if (pedido !== undefined && /^\d+$/.test(pedido)) {
        const orderId = Number(pedido);
        if (Number.isSafeInteger(orderId) && orderId >= 1 && orderId <= MAX_ID)
            return { kind: 'order', orderId };
    }
    return first(params.resultado) === 'rechazado' ? { kind: 'rejected' } : { kind: 'invalid' };
}

/**
 * Variante que corresponde a un pedido: `card` (tarjeta, estado Confirmado) o `transfer`
 * (transferencia, Pendiente de pago). Cualquier otra combinación (otro método, o un pedido cuyo
 * estado ya cambió: cancelado, enviado…) devuelve `null`: la pantalla no puede decir "confirmado"
 * ni "pendiente de pago" con verdad, y se trata como pedido no disponible.
 *
 * @param order - Método de pago y estado del pedido.
 * @returns La variante, o `null` si no hay ninguna que cuadre.
 *
 * @example
 * confirmationVariant({ paymentMethod: 'Tarjeta', status: 'Confirmado' }); // 'card'
 */
export function confirmationVariant(
    order: Pick<ConfirmationOrder, 'paymentMethod' | 'status'>,
): ConfirmationVariant | null {
    if (order.paymentMethod === 'Tarjeta' && order.status === 'Confirmado') return 'card';
    if (order.paymentMethod === 'Transferencia' && order.status === 'Pendiente de pago')
        return 'transfer';
    return null;
}

/**
 * Nombre con el que se saluda: el del titular de la cuenta (la persona que compra, no quien recibe
 * el envío, que puede ser otra), sin espacios sobrantes. `null` si no hay perfil o no tiene nombre.
 *
 * @example
 * greetingName({ name: ' María ' }); // 'María'
 */
export function greetingName(profile: { name: string } | null | undefined): string | null {
    const name = profile?.name.trim();
    return name ? name : null;
}

/**
 * "Gracias por tu compra, María." (sin nombre: "Gracias por tu compra.").
 *
 * @example
 * thanksText('María'); // 'Gracias por tu compra, María.'
 */
export function thanksText(name: string | null): string {
    return name ? `Gracias por tu compra, ${name}.` : 'Gracias por tu compra.';
}

/**
 * Subtítulo del rechazo: "Lo sentimos, María. Hubo un problema con la transacción." (sin nombre:
 * "Lo sentimos. Hubo un problema con la transacción.").
 *
 * @example
 * rejectionSubtitle('María'); // 'Lo sentimos, María. Hubo un problema con la transacción.'
 */
export function rejectionSubtitle(name: string | null): string {
    return `Lo sentimos${name ? `, ${name}` : ''}. Hubo un problema con la transacción.`;
}

/** Texto del rechazo, tal como está en el diseño. */
export const REJECTION_TEXT =
    'Tu tarjeta fue rechazada por el banco emisor. Asegúrate de que tengas fondos suficientes o prueba con un método de pago diferente.';

/**
 * Texto del pedido pagado con tarjeta. Sin correo (no se pudo leer el perfil) se omite la frase del
 * correo en vez de enseñar un hueco.
 *
 * @param number - Número de pedido (`PJ-4521`).
 * @param email - Correo de la cuenta, o `null`.
 *
 * @example
 * cardOrderText('PJ-4521', 'maria@ejemplo.com');
 * // 'Tu pedido #PJ-4521 ha sido registrado y se procesará pronto. Recibirás un correo de confirmación en maria@ejemplo.com.'
 */
export function cardOrderText(number: string, email: string | null): string {
    const placed = `Tu pedido #${number} ha sido registrado y se procesará pronto.`;
    return email ? `${placed} Recibirás un correo de confirmación en ${email}.` : placed;
}

/**
 * Los párrafos del pedido pendiente de transferencia: el aviso, el titular, el IBAN y el concepto.
 * El concepto es el número de pedido real (decisión tomada: sustituye al "tu número de pedido"
 * genérico del diseño). Si los datos bancarios no están configurados (`details` nulo) se omiten
 * titular e IBAN, y el aviso no remite a "estos datos".
 *
 * @param number - Número de pedido (`PJ-4521`).
 * @param details - Titular e IBAN, o `null`.
 *
 * @example
 * transferParagraphs('PJ-4521', { holder: 'Pago de Jotrón S.L.', iban: 'ES12 3456' });
 * // [aviso, 'Titular: Pago de Jotrón S.L.', 'IBAN: ES12 3456', 'Concepto: PJ-4521']
 */
export function transferParagraphs(number: string, details: TransferDetails | null): string[] {
    const pending = `Tu pedido #${number} está pendiente de pago. Haz la transferencia ${
        details ? 'con estos datos ' : ''
    }y lo prepararemos en cuanto confirmemos el cobro.`;
    return [
        pending,
        ...(details ? [`Titular: ${details.holder}`, `IBAN: ${details.iban}`] : []),
        `Concepto: ${number}`,
    ];
}

/** Lo que `OrderSummary` necesita, calculado en céntimos enteros. */
export interface ConfirmationSummary {
    address: AddressLike;
    /** Fecha ya formateada ("Jue, 18 oct"), o `null` si no hay plazo. */
    estimatedDelivery: string | null;
    items: OrderSummaryItem[];
    shipping: { name: string; cents: number };
    totalCents: number;
}

/**
 * Fecha de entrega estimada para mostrar a partir de la `AAAA-MM-DD` del servidor.
 *
 * @param isoDate - `estimatedDelivery` del pedido, o `null`.
 * @returns "Jue, 18 oct", o `null` si no hay fecha o no es válida.
 *
 * @example
 * formatEstimatedDelivery('2026-10-15'); // 'Jue, 15 oct'
 */
export function formatEstimatedDelivery(isoDate: string | null): string | null {
    if (isoDate === null) return null;
    try {
        return formatDeliveryDate(calendarDate(isoDate));
    } catch {
        return null;
    }
}

/** Lo que hace falta de una línea para ponerle nombre. */
interface LineLabelInput {
    name: string;
    format: string;
    capacity: number;
    capacityUnit: 'ml' | 'g';
}

/**
 * Nombre de una línea en el resumen: el producto y su presentación entre paréntesis
 * ("Tinto Roble (Botella 75 cl)"), para distinguir dos formatos del mismo vino. El diseño solo
 * pone el nombre; es el criterio conservador (la spec lo deja abierto, duda 12).
 *
 * @example
 * lineLabel({ name: 'Tinto Roble', format: 'Botella', capacity: 750, capacityUnit: 'ml' });
 * // 'Tinto Roble (Botella 75 cl)'
 */
export function lineLabel(line: LineLabelInput): string {
    return `${line.name} (${formatPresentation(line)})`;
}

/**
 * Pasa el pedido de `GET /api/pedidos/[id]` a las props de `OrderSummary`. Todos los importes salen
 * del servidor (precio guardado de cada línea, envío y total del presupuesto): aquí solo se pasan a
 * céntimos enteros, sin decimales de coma flotante, y se multiplica por la cantidad.
 *
 * @param order - El pedido.
 * @returns Dirección, fecha estimada, líneas, envío y total.
 *
 * @example
 * orderSummary(order).items[0]; // { id: 4, name: 'Tinto Roble (Botella 75 cl)', quantity: 2, unitCents: 1150, totalCents: 2300 }
 */
export function orderSummary(order: ConfirmationOrder): ConfirmationSummary {
    return {
        address: order.shippingAddress,
        estimatedDelivery: formatEstimatedDelivery(order.estimatedDelivery),
        items: order.lines.map((line) => ({
            id: line.variantId,
            name: lineLabel(line),
            quantity: line.quantity,
            unitCents: priceToCents(line.unitPrice),
            totalCents: lineTotalCents(line.unitPrice, line.quantity),
        })),
        shipping: { name: order.shippingType.name, cents: order.quote.shippingCents },
        totalCents: order.quote.totalCents,
    };
}

/** Una línea del carrito con sus datos del servidor (`CartLine`, reducida a lo que se usa). */
export interface CartLineInput extends LineLabelInput {
    variantId: number;
    /** Precio unitario en euros, como texto (`'9.50'`). */
    price: string;
}

/**
 * Resumen del rechazo de pago: no hay pedido (el servidor revierte lo que hizo), así que se pinta
 * con el carrito, que sigue intacto, y con la dirección y el envío elegidos en el checkout. El
 * total es el subtotal más el envío, en céntimos. La entrega estimada es `hoy` más los días
 * laborables máximos de la modalidad, como en el pedido, o `null` si no tiene plazo.
 *
 * Una línea del carrito que no esté en `lines` (retirada del catálogo) no se cuenta.
 *
 * @param input.cart - El carrito local.
 * @param input.lines - Precio y datos de las líneas, del servidor.
 * @param input.shippingType - Modalidad elegida: nombre, coste (`'4.95'`) y plazo máximo.
 * @param input.address - Dirección de envío elegida.
 * @param input.today - Día de partida, por su día en UTC (ver `calendarDate`).
 * @returns El resumen, o `null` si el carrito no tiene ninguna línea que enseñar.
 *
 * @example
 * rejectedSummary({ cart, lines, shippingType, address, today: calendarDate('2026-10-15') });
 */
export function rejectedSummary(input: {
    cart: Cart;
    lines: readonly CartLineInput[];
    shippingType: { name: string; cost: string; maxDeliveryDays: number | null };
    address: AddressLike;
    today: Date;
}): ConfirmationSummary | null {
    const { cart, lines, shippingType, address, today } = input;
    const items = cart.flatMap(({ variantId, quantity }): OrderSummaryItem[] => {
        const line = lines.find((candidate) => candidate.variantId === variantId);
        if (!line) return [];
        return [
            {
                id: variantId,
                name: lineLabel(line),
                quantity,
                unitCents: priceToCents(line.price),
                totalCents: lineTotalCents(line.price, quantity),
            },
        ];
    });
    if (items.length === 0) return null;

    const shippingCents = priceToCents(shippingType.cost);
    return {
        address,
        estimatedDelivery:
            shippingType.maxDeliveryDays === null
                ? null
                : formatDeliveryDate(estimatedDeliveryDate(today, shippingType.maxDeliveryDays)),
        items,
        shipping: { name: shippingType.name, cents: shippingCents },
        totalCents: cartSubtotalCents(cart, lines) + shippingCents,
    };
}

/**
 * Día de hoy como día de calendario (medianoche UTC), listo para `rejectedSummary`.
 *
 * @param now - El instante actual; solo lo cambian los tests.
 */
export function today(now: Date = new Date()): Date {
    return calendarDate(toIsoDate(now));
}
