/**
 * Pasarela de pago (RF7, RNF2): lo único que el resto de la tienda sabe de Stripe. El pago va en
 * dos tiempos: `createAuthorization` reserva el importe en la tarjeta del cliente sin cobrarlo
 * (`capture_method: 'manual'`) y, cuando el pedido ya está creado y el stock descontado,
 * `capture` cobra; si no se puede servir, `cancel` libera la reserva y no se cobra nada.
 *
 * La tarjeta nunca pasa por nuestro servidor: la teclea el cliente en el Payment Element de
 * Stripe (PCI DSS, RNF3). Aquí solo llega un `PaymentIntent`. Quien use este módulo no importa
 * `stripe`: los fallos salen como `PaymentError`.
 */
import Stripe from 'stripe';
import { PaymentError } from './errors';
import { getStripe } from './stripe';

export { PaymentError } from './errors';

/** Importe mínimo que Stripe admite en euros: 0,50 €. */
export const MIN_AMOUNT_CENTS = 50;

/** Lo que hace falta para reservar un importe. */
export interface AuthorizationInput {
    /** Importe en céntimos, calculado en el servidor (`quoteOrder`): entero y >= `MIN_AMOUNT_CENTS`. */
    amountCents: number;
    /** Cliente que paga (`metadata.userId`). */
    userId: number;
    /** Huella del carrito (`cartFingerprint`): al crear el pedido se compara con la autorizada. */
    cartFingerprint: string;
}

/** Una reserva creada: el cliente la confirma con `clientSecret` y el servidor la sigue por `id`. */
export interface Authorization {
    /** Id del PaymentIntent (`pi_…`): se guarda en `orders.payment_intent_id`. */
    id: string;
    /** Secreto para que el Payment Element confirme la tarjeta. Solo se lo ve el cliente que paga. */
    clientSecret: string;
    amountCents: number;
}

/** Resultado de capturar o cancelar. */
export interface PaymentResult {
    id: string;
    /** `succeeded` tras capturar; `canceled` tras cancelar. */
    status: 'succeeded' | 'canceled';
    amountCents: number;
}

/**
 * Ejecuta una llamada a Stripe y convierte sus fallos (`StripeError`: red, tarjeta, estado del
 * PaymentIntent) en `PaymentError`. Lo demás se deja pasar: un `RangeError` por un importe
 * inválido o el `Error` de la clave que falta son del programador, no de la pasarela.
 */
async function callStripe<T>(action: string, run: (stripe: Stripe) => Promise<T>): Promise<T> {
    const stripe = getStripe();
    try {
        return await run(stripe);
    } catch (error) {
        if (!(error instanceof Stripe.errors.StripeError)) throw error;
        throw new PaymentError(
            `No se ha podido ${action} el pago`,
            error.code ?? error.rawType ?? error.type ?? 'unknown',
            {
                cause: error,
            },
        );
    }
}

/**
 * Reserva un importe en la tarjeta del cliente sin cobrarlo: crea un PaymentIntent de captura
 * manual, solo con tarjeta, en euros, con el cliente y la huella del carrito en los `metadata`.
 * El cliente lo confirma en el navegador con `clientSecret`; hasta entonces no hay reserva.
 *
 * @param input - Importe, cliente y huella del carrito.
 * @returns El id del PaymentIntent y su `clientSecret`.
 * @throws {RangeError} Si el importe no es un entero >= `MIN_AMOUNT_CENTS`.
 * @throws {PaymentError} Si Stripe falla.
 *
 * @example
 * const { id, clientSecret } = await createAuthorization({ amountCents: 3345, userId: 12, cartFingerprint });
 */
export async function createAuthorization({
    amountCents,
    userId,
    cartFingerprint,
}: AuthorizationInput): Promise<Authorization> {
    if (!Number.isInteger(amountCents) || amountCents < MIN_AMOUNT_CENTS)
        throw new RangeError(`Importe no válido: ${amountCents}`);

    return callStripe('autorizar', async (stripe) => {
        const intent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: 'eur',
            capture_method: 'manual',
            allowed_payment_method_types: ['card'],
            metadata: { userId: String(userId), cartFingerprint },
        });
        if (!intent.client_secret)
            throw new PaymentError('No se ha podido autorizar el pago', 'missing_client_secret');
        return { id: intent.id, clientSecret: intent.client_secret, amountCents: intent.amount };
    });
}

/**
 * Cobra una reserva ya confirmada por el cliente (`requires_capture`): el dinero sale de la
 * tarjeta. Se llama cuando el pedido está creado y el stock descontado.
 *
 * @param paymentIntentId - Id del PaymentIntent (`pi_…`).
 * @returns El cobro hecho.
 * @throws {PaymentError} Si Stripe falla o la reserva no se puede capturar (no confirmada,
 * caducada o ya cancelada).
 */
export async function capture(paymentIntentId: string): Promise<PaymentResult> {
    return callStripe('cobrar', async (stripe) => {
        const intent = await stripe.paymentIntents.capture(paymentIntentId);
        return { id: intent.id, status: 'succeeded', amountCents: intent.amount_received };
    });
}

/**
 * Cancela una reserva y libera el importe en la tarjeta: no se cobra nada. Se llama cuando falta
 * stock al crear el pedido o el carrito cambió desde que se autorizó.
 *
 * @param paymentIntentId - Id del PaymentIntent (`pi_…`).
 * @returns La reserva cancelada.
 * @throws {PaymentError} Si Stripe falla o la reserva ya estaba cobrada.
 */
export async function cancel(paymentIntentId: string): Promise<PaymentResult> {
    return callStripe('cancelar', async (stripe) => {
        const intent = await stripe.paymentIntents.cancel(paymentIntentId);
        return { id: intent.id, status: 'canceled', amountCents: intent.amount };
    });
}
