/**
 * Fallo de la pasarela de pago (Stripe): la red, la clave, un importe que rechaza o una
 * autorización que ya no se puede capturar. Es el único error que sale de `src/lib/payments/`:
 * quien lo usa no importa nada de Stripe (RNF2). El mensaje es genérico y se puede enseñar tal
 * cual; el detalle de Stripe está en `code` y `cause`, y solo va al registro del servidor.
 */
export class PaymentError extends Error {
    /** Código de Stripe (`card_declined`, `payment_intent_unexpected_state`) o su tipo de error; `unknown` si no hay. */
    readonly code: string;

    constructor(message: string, code: string, options?: { cause?: unknown }) {
        super(message, options);
        this.name = 'PaymentError';
        this.code = code;
    }
}
