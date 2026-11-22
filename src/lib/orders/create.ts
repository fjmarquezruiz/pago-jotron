/**
 * Creación del pedido (RF7): la parte del checkout que se ejecuta cuando el cliente ya eligió
 * envío, dirección y método de pago. Es lógica de servidor sin HTTP (la ruta
 * `POST /api/checkout/pedido` solo traduce el resultado a códigos de respuesta).
 *
 * Todo sale de la BD y de Stripe, nunca del navegador: el carrito guardado, los precios y el IVA
 * de ahora, el coste del envío y, con tarjeta, el importe y la huella autorizados.
 *
 * El orden con tarjeta es: (1) UNA transacción que descuenta el stock (con `stock >= cantidad`,
 * atómico), inserta el pedido y sus líneas y vacía el carrito, y se CONFIRMA (commit); (2) solo
 * entonces se CAPTURA el cobro. Así nunca hay un cobro sin pedido: si el commit falla, no se ha
 * cobrado nada (la reserva caduca sola), y no se mantiene abierta una transacción con las filas
 * de stock bloqueadas mientras Stripe responde (hasta 10 s con reintentos), que haría esperar a
 * otros compradores (RNF4).
 *
 * Si la captura falla, el fallo es nuestro y se controla: una SEGUNDA transacción de
 * compensación devuelve el stock, vuelve a llenar el carrito, marca el pedido como 'Anulado' y
 * anota en la auditoría (`audit_logs`) qué pedido y qué PaymentIntent fueron, y después se
 * cancela la autorización. Antes de compensar se pregunta a Stripe si el cobro se hizo de verdad
 * (una captura con tiempo agotado puede haber salido bien): si está cobrado, el pedido se queda.
 * Si Stripe no contesta o la compensación falla, no se adivina: se deja el pedido como está y se
 * registra con `[CRÍTICO]` en el log (con los ids) para resolverlo a mano.
 *
 * El pedido de tarjeta nace 'Confirmado' antes de capturar. Esa ventana dura lo que tarda
 * Stripe (segundos); quien reaccione a los pedidos 'Confirmado' (A10: correos, preparación)
 * debe saber que, si el cobro falla, pasan a 'Anulado'.
 */
import { notifyOrderConfirmed } from '@/lib/emails/order-emails';
import { db } from '@/db';
import { cartFingerprint } from '@/lib/orders/fingerprint';
import { centsToDecimal, orderNumber } from '@/lib/orders/format';
import { quoteOrder } from '@/lib/orders/quote';
import { findStockProblems, type StockProblem } from '@/lib/orders/stock';
import { isDuplicateEntryError } from '@/lib/db/errors';
import {
    changeOrderStatusQuery,
    clearUserCartQuery,
    decrementStockQuery,
    getCartLines,
    getOrderByPaymentIntent,
    getOrderStatusId,
    getShippingTypeById,
    getUserAddress,
    getUserCart,
    insertAuditLogQuery,
    insertOrderLinesQuery,
    insertOrderQuery,
    restoreStockQuery,
    upsertCartItemsQuery,
} from '@/lib/db/queries';
import { cancel, capture, getAuthorization, PaymentError } from '@/lib/payments';
import { isTransferEnabled } from '@/lib/payments/transfer';
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
    | 'method_unavailable' // 400: la transferencia está apagada (MVP2)
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
 * Deja constancia de un fallo que el cliente no ve: lo escribe en el log con `[CRÍTICO]` y, si la
 * BD responde, lo anota en la auditoría. Nunca lanza: es lo último que se hace con un fallo ya
 * grave y no debe taparlo.
 */
async function reportFailure(userId: number, action: string, details: string): Promise<void> {
    console.error(`[CRÍTICO] ${action}: ${details}`);
    try {
        await insertAuditLogQuery(db, { userId, action, details });
    } catch (error) {
        console.error('No se pudo anotar en la auditoría', error);
    }
}

/** Lo que hace falta para cobrar un pedido ya creado o deshacerlo si no se puede. */
interface SettleInput {
    orderId: number;
    userId: number;
    paymentIntentId: string;
    items: readonly { variantId: number; quantity: number }[];
    confirmedStatusId: number;
    cancelledStatusId: number;
}

/**
 * Captura el cobro de un pedido de tarjeta que ya está confirmado en la BD (commit hecho) y, si
 * no se puede, lo deshace con una transacción de compensación.
 *
 * @returns `'captured'` si el cobro está hecho (o no se puede saber, y se deja el pedido) o
 * `'undone'` si se compensó: stock devuelto, carrito repuesto, pedido 'Anulado' y autorización
 * cancelada.
 * @throws Si la transacción de compensación falla: el pedido queda 'Confirmado' sin cobrar y la
 * autorización intacta (no se cancela, para poder capturarla a mano); ya se registró `[CRÍTICO]`.
 */
async function settlePayment(input: SettleInput): Promise<'captured' | 'undone'> {
    const { orderId, userId, paymentIntentId, items } = input;
    try {
        await capture(paymentIntentId);
        return 'captured';
    } catch (captureError) {
        console.error('No se pudo capturar el pago', paymentIntentId, captureError);
    }

    // ¿Se cobró de verdad? Una captura con tiempo agotado puede haber salido bien en Stripe.
    let status: string;
    try {
        status = (await getAuthorization(paymentIntentId)).status;
    } catch (lookupError) {
        console.error('No se pudo leer el estado del pago', paymentIntentId, lookupError);
        await reportFailure(
            userId,
            'Estado del cobro desconocido',
            `pedido ${orderId}, PaymentIntent ${paymentIntentId}: la captura falló y Stripe no responde. El pedido se ha dejado como está; revisar a mano.`,
        );
        return 'captured';
    }
    if (status === 'succeeded') return 'captured';

    try {
        await db.transaction(async (tx) => {
            const [moved] = await changeOrderStatusQuery(
                tx,
                orderId,
                input.confirmedStatusId,
                input.cancelledStatusId,
            );
            // Otro proceso ya movió el pedido: no se devuelve el stock dos veces.
            if (moved.affectedRows === 0) return;
            // Mismo orden que al descontar (por presentación): sin bloqueos cruzados.
            for (const { variantId, quantity } of [...items].sort(
                (a, b) => a.variantId - b.variantId,
            ))
                await restoreStockQuery(tx, variantId, quantity);
            // El carrito se vació al crear el pedido: se repone para poder reintentar el pago.
            await upsertCartItemsQuery(tx, userId, items);
            await insertAuditLogQuery(tx, {
                userId,
                action: 'Pedido anulado: no se pudo cobrar el pago',
                details: `pedido ${orderId}, PaymentIntent ${paymentIntentId} (estado en Stripe: ${status})`,
            });
        });
    } catch (undoError) {
        console.error(
            `[CRÍTICO] No se pudo anular el pedido ${orderId} tras fallar el cobro (PaymentIntent ${paymentIntentId}): queda 'Confirmado' sin cobrar`,
            undoError,
        );
        throw undoError;
    }
    await cancelQuietly(paymentIntentId);
    return 'undone';
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

    // MVP2: la transferencia está apagada por entorno; el cuerpo es válido pero no se atiende.
    if (paymentMethod === 'Transferencia' && !isTransferEnabled())
        return fail('method_unavailable', 'La transferencia bancaria no está disponible');

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
    // Se busca ya, antes de tocar nada: la compensación no puede fallar por no encontrarlo.
    const cancelledStatusId = paymentIntentId !== null ? await getOrderStatusId('Anulado') : null;
    if (paymentIntentId !== null && cancelledStatusId === null)
        throw new Error("Falta el estado de pedido 'Anulado'");

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
            return insertId;
        });
        // El pedido ya está confirmado en la BD: ahora sí se cobra (fuera de la transacción).
        if (paymentIntentId !== null) {
            const outcome = await settlePayment({
                orderId,
                userId,
                paymentIntentId,
                items,
                confirmedStatusId: statusId,
                cancelledStatusId: cancelledStatusId!,
            });
            if (outcome === 'undone')
                return fail(
                    'payment_failed',
                    'No se ha podido cobrar el pago. No se ha hecho ningún cargo.',
                );
        }
        // El pedido de tarjeta ya está cobrado: se avisa al cliente. No lanza ni cambia la respuesta.
        if (paymentIntentId !== null) await notifyOrderConfirmed(orderId);
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
