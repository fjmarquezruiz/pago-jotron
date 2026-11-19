/**
 * Creación del pedido (RF7): la parte del checkout que se ejecuta cuando el cliente ya eligió
 * envío, dirección y método de pago. Es lógica de servidor sin HTTP (la ruta
 * `POST /api/checkout/pedido` solo traduce el resultado a códigos de respuesta).
 *
 * Todo sale de la BD y de Stripe, nunca del navegador: el carrito guardado, los precios y el IVA
 * de ahora, el coste del envío y, con tarjeta, el importe y la huella autorizados. La escritura
 * va en UNA transacción: descuenta el stock (con `stock >= cantidad`, atómico), inserta el
 * pedido y sus líneas, vacía el carrito y, con tarjeta, CAPTURA el pago justo antes del commit.
 * Si la captura falla, la transacción se revierte: no hay pedido ni stock descontado.
 *
 * Limitación conocida: si la captura tiene éxito y el commit falla justo después (la BD cae en
 * ese instante), el cobro queda hecho sin pedido. Es una ventana de milisegundos; se deja
 * constancia en el log con el id del PaymentIntent para devolverlo a mano.
 */
import { db } from '@/db';
import { cartFingerprint } from '@/lib/orders/fingerprint';
import { centsToDecimal, orderNumber } from '@/lib/orders/format';
import { quoteOrder } from '@/lib/orders/quote';
import { findStockProblems, type StockProblem } from '@/lib/orders/stock';
import { isDuplicateEntryError } from '@/lib/db/errors';
import {
    clearUserCartQuery,
    decrementStockQuery,
    getCartLines,
    getOrderByPaymentIntent,
    getOrderStatusId,
    getShippingTypeById,
    getUserAddress,
    getUserCart,
    insertOrderLinesQuery,
    insertOrderQuery,
} from '@/lib/db/queries';
import { cancel, capture, getAuthorization, PaymentError } from '@/lib/payments';
import type { CheckoutOrderRequest } from '@/lib/validations/checkout';

/** Estado con el que nace un pedido según cómo se paga: la tarjeta ya está cobrada; la transferencia, no. */
const STATUS_BY_METHOD = {
    Tarjeta: 'Confirmado',
    Transferencia: 'Pendiente de pago',
} as const;

/** Estados de Stripe en los que ya no hay nada que cancelar (ya cobrado o ya cancelado). */
const NOTHING_TO_CANCEL = new Set(['succeeded', 'canceled']);

/** Lo que se devuelve del pedido, creado o ya existente. */
export interface OrderSummary {
    orderId: number;
    /** Número que ve el cliente: `PJ-<id>`. */
    orderNumber: string;
    /** Nombre del estado (`order_statuses.name`). */
    status: string;
    paymentMethod: 'Tarjeta' | 'Transferencia' | 'PayPal';
}

/** Por qué no se pudo crear el pedido; la ruta lo traduce a un código HTTP. */
export type CreateOrderFailureCode =
    | 'empty_cart' // 400
    | 'shipping_not_found' // 404
    | 'address_not_found' // 404
    | 'billing_not_found' // 404
    | 'payment_not_found' // 404: el PaymentIntent no existe en Stripe
    | 'payment_forbidden' // 403: el PaymentIntent es de otra cuenta
    | 'stock' // 409
    | 'payment_mismatch' // 409: la autorización no corresponde al carrito de ahora
    | 'payment_failed'; // 402: no se pudo capturar

/** Resultado de `createOrder`: el pedido (nuevo o ya existente) o el motivo del fallo. */
export type CreateOrderResult =
    | { ok: true; created: boolean; order: OrderSummary }
    | { ok: false; code: CreateOrderFailureCode; message: string; problems?: StockProblem[] };

/** Falta stock al descontar dentro de la transacción: fuerza el ROLLBACK. */
class StockConflictError extends Error {
    constructor(readonly variantId: number) {
        super(`Sin stock suficiente de la presentación ${variantId}`);
    }
}

const fail = (
    code: CreateOrderFailureCode,
    message: string,
    problems?: StockProblem[],
): CreateOrderResult => ({ ok: false, code, message, ...(problems ? { problems } : {}) });

/**
 * Cancela una autorización sin dejar que un fallo de Stripe tape el motivo real del error: si
 * cancelar falla se anota en el log y se sigue (la reserva caduca sola).
 */
async function cancelQuietly(paymentIntentId: string): Promise<void> {
    try {
        await cancel(paymentIntentId);
    } catch (error) {
        console.error('No se pudo cancelar la autorización', paymentIntentId, error);
    }
}

/**
 * Crea el pedido del carrito guardado del cliente (RF7).
 *
 * Orden de las comprobaciones, y qué pasa con la autorización de la tarjeta:
 * 1. Idempotencia (solo tarjeta): si ya hay un pedido de ese PaymentIntent y es de este cliente,
 *    se devuelve tal cual (`created: false`); si es de otro, `payment_forbidden`.
 * 2. Con tarjeta se lee la autorización YA AQUÍ y se comprueba que es de este cliente: si no,
 *    `payment_forbidden` y no se toca (no se puede cancelar el pago de otro). Se adelanta a las
 *    demás comprobaciones, aunque el orden natural las pondría después del stock, para que
 *    ningún cliente pueda cancelar con un fallo provocado el PaymentIntent de otra cuenta.
 * 3. Carrito vacío, envío, direcciones, stock, estado `requires_capture`, importe y huella: si
 *    algo falla con tarjeta, se CANCELA la autorización antes de responder, así no queda dinero
 *    retenido (también con carrito vacío o dirección inexistente: es decisión conservadora, el
 *    cliente tendría que autorizar de nuevo igualmente, porque la huella incluye el envío).
 * 4. La transacción (ver arriba). Una colisión por `orders.payment_intent_id` único (dos
 *    peticiones a la vez) devuelve el pedido ya creado por la otra.
 *
 * Facturación: si falta `billingAddressId` o es la de envío, `billing_address_id` guarda la
 * dirección de envío; si es otra, debe ser una dirección vigente del cliente de tipo 'Facturación'.
 * Transferencia: estado 'Pendiente de pago', sin cobro, con el stock ya descontado (reservado).
 *
 * @param userId - Cliente de la sesión (`getSessionUserId`).
 * @param input - Cuerpo validado (`checkoutOrderRequestSchema`).
 * @returns El pedido o el motivo del fallo.
 * @throws {PaymentError} Si Stripe falla al leer la autorización (la ruta responde 502).
 * @throws Errores inesperados de la BD (la ruta responde 500).
 */
export async function createOrder(
    userId: number,
    input: CheckoutOrderRequest,
): Promise<CreateOrderResult> {
    const { paymentMethod, shippingTypeId, shippingAddressId } = input;
    const paymentIntentId = input.paymentMethod === 'Tarjeta' ? input.paymentIntentId : null;

    let authorization: Awaited<ReturnType<typeof getAuthorization>> | null = null;
    if (paymentIntentId !== null) {
        const existing = await getOrderByPaymentIntent(paymentIntentId);
        if (existing)
            return existing.userId === userId
                ? { ok: true, created: false, order: summaryOf(existing.id, existing) }
                : fail('payment_forbidden', 'Este pago pertenece a otra cuenta');

        try {
            authorization = await getAuthorization(paymentIntentId);
        } catch (error) {
            if (error instanceof PaymentError && error.code === 'resource_missing')
                return fail('payment_not_found', 'No existe la autorización de pago');
            throw error;
        }
        if (authorization.userId !== userId)
            return fail('payment_forbidden', 'Este pago pertenece a otra cuenta');
    }

    /** Responde con un fallo y, con tarjeta, libera antes la reserva. */
    const reject = async (
        code: CreateOrderFailureCode,
        message: string,
        problems?: StockProblem[],
    ) => {
        if (paymentIntentId !== null && !NOTHING_TO_CANCEL.has(authorization!.status))
            await cancelQuietly(paymentIntentId);
        return fail(code, message, problems);
    };

    const items = await getUserCart(userId);
    if (items.length === 0) return reject('empty_cart', 'Tu carrito está vacío');

    const billingId = input.billingAddressId ?? shippingAddressId;
    const [shipping, address, billing, lines] = await Promise.all([
        getShippingTypeById(shippingTypeId),
        getUserAddress(userId, shippingAddressId),
        billingId === shippingAddressId ? null : getUserAddress(userId, billingId),
        getCartLines(items.map(({ variantId }) => variantId)),
    ]);
    if (!shipping) return reject('shipping_not_found', 'El tipo de envío no está disponible');
    if (!address) return reject('address_not_found', 'La dirección de envío no existe');
    if (billingId !== shippingAddressId && billing?.addressType !== 'Facturación')
        return reject('billing_not_found', 'La dirección de facturación no existe');

    const problems = findStockProblems(items, lines);
    if (problems.length > 0) return reject('stock', 'Hay productos sin stock suficiente', problems);

    const lineByVariant = new Map(lines.map((line) => [line.variantId, line]));
    const orderLines = items.map(({ variantId, quantity }) => {
        // `findStockProblems` ya garantizó que la línea existe.
        const { price, taxRate } = lineByVariant.get(variantId)!;
        return { variantId, quantity, unitPrice: price, taxRate };
    });
    const quote = quoteOrder(
        orderLines.map(({ quantity, unitPrice, taxRate }) => ({
            quantity,
            price: unitPrice,
            taxRate,
        })),
        shipping.cost,
    );

    if (authorization !== null) {
        if (authorization.status !== 'requires_capture')
            return reject('payment_mismatch', 'El pago no está confirmado. Inténtalo de nuevo.');
        const expected = cartFingerprint({
            lines: items,
            shippingTypeId,
            totalCents: quote.totalCents,
        });
        if (
            authorization.amountCents !== quote.totalCents ||
            authorization.cartFingerprint !== expected
        )
            return reject(
                'payment_mismatch',
                'Tu carrito ha cambiado desde que autorizaste el pago. Revisa el pedido y vuelve a pagar.',
            );
    }

    const statusName = STATUS_BY_METHOD[paymentMethod];
    const statusId = await getOrderStatusId(statusName);
    if (statusId === null) throw new Error(`Falta el estado de pedido '${statusName}'`);

    try {
        const orderId = await db.transaction(async (tx) => {
            // Siempre en el mismo orden (por presentación): dos pedidos a la vez no se bloquean entre sí.
            for (const { variantId, quantity } of [...items].sort(
                (a, b) => a.variantId - b.variantId,
            )) {
                const [result] = await decrementStockQuery(tx, variantId, quantity);
                if (result.affectedRows === 0) throw new StockConflictError(variantId);
            }
            const [{ insertId }] = await insertOrderQuery(tx, {
                userId,
                shippingAddressId,
                billingAddressId: billingId,
                paymentMethod,
                shippingTypeId,
                shippingCost: centsToDecimal(quote.shippingCents),
                total: centsToDecimal(quote.totalCents),
                statusId,
                paymentIntentId,
            });
            await insertOrderLinesQuery(tx, insertId, orderLines);
            await clearUserCartQuery(tx, userId);
            // Lo último antes del commit: si cobrar falla, se revierte todo lo anterior.
            if (paymentIntentId !== null) await capture(paymentIntentId);
            return insertId;
        });
        return {
            ok: true,
            created: true,
            order: {
                orderId,
                orderNumber: orderNumber(orderId),
                status: statusName,
                paymentMethod,
            },
        };
    } catch (error) {
        if (error instanceof StockConflictError) {
            // Otro cliente compró entre la comprobación y el descuento: se vuelve a leer qué queda.
            const fresh = findStockProblems(
                items,
                await getCartLines(items.map((i) => i.variantId)),
            );
            return reject(
                'stock',
                'Hay productos sin stock suficiente',
                fresh.length > 0 ? fresh : [{ variantId: error.variantId, available: 0 }],
            );
        }
        if (paymentIntentId !== null && isDuplicateEntryError(error, 'payment_intent_id')) {
            // Dos peticiones a la vez con el mismo pago: la otra ganó y este intento se revirtió entero.
            const existing = await getOrderByPaymentIntent(paymentIntentId);
            if (existing?.userId === userId)
                return { ok: true, created: false, order: summaryOf(existing.id, existing) };
        }
        if (error instanceof PaymentError) {
            console.error('No se pudo capturar el pago', paymentIntentId, error, error.cause);
            return reject(
                'payment_failed',
                'No se ha podido cobrar el pago. No se ha hecho ningún cargo.',
            );
        }
        throw error;
    }
}

/** Resumen de un pedido ya existente (`getOrderByPaymentIntent`). */
function summaryOf(
    orderId: number,
    row: { status: string; paymentMethod: OrderSummary['paymentMethod'] },
): OrderSummary {
    return {
        orderId,
        orderNumber: orderNumber(orderId),
        status: row.status,
        paymentMethod: row.paymentMethod,
    };
}
