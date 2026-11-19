/**
 * Lógica pura del paso Pago del checkout (RF7): qué hace falta para poder pagar, cómo se
 * interpretan las respuestas de Stripe y del servidor y el orquestador `placeOrder`, que recibe
 * por parámetro todo lo que toca el navegador (`fetch`, la confirmación de la tarjeta) para poder
 * probarse sin jsdom.
 */

/** Métodos de pago que ofrece la tienda (PayPal no se implementa). */
export type CheckoutPaymentMethod = 'Tarjeta' | 'Transferencia';

/** Ruta de la API que autoriza (reserva) el importe en la tarjeta. */
export const PAYMENT_API = '/api/checkout/pago';

/** Ruta de la API que crea el pedido. */
export const ORDER_API = '/api/checkout/pedido';

/** Pantalla roja del paso Confirmar: el pago se autorizó pero el pedido no se pudo cerrar. */
export const REJECTED_URL = '/checkout/confirmacion?resultado=rechazado';

/** A dónde se manda al cliente que ha perdido la sesión; vuelve a Pago al entrar. */
export const LOGIN_URL = '/auth/login?callbackUrl=%2Fcheckout%2Fpago';

/**
 * Texto literal del banner de error de Pago (Figma: checkout-3-pago-error). Sirve para cualquier
 * fallo previo al pedido: nunca se ha cobrado nada.
 */
export const PAYMENT_ERROR_MESSAGE =
    'No pudimos procesar tu pago. Revisa los datos de tu tarjeta y vuelve a intentarlo.';

/**
 * Dirección de la pantalla de confirmación de un pedido.
 *
 * @param orderId - `orders.order_id`.
 * @returns Por ejemplo `/checkout/confirmacion?pedido=12`.
 */
export function confirmationUrl(orderId: number): string {
    return `/checkout/confirmacion?pedido=${orderId}`;
}

// ---------------------------------------------------------------------------------------------
// Campos de la tarjeta y "puedo enviar"
// ---------------------------------------------------------------------------------------------

/** Si cada campo suelto de Stripe (`CardNumberElement`, `CardExpiryElement`, `CardCvcElement`) está completo y es válido. */
export interface CardFieldsComplete {
    number: boolean;
    expiry: boolean;
    cvc: boolean;
}

/** Los tres campos de Stripe sin completar: el estado de partida. */
export const EMPTY_CARD_FIELDS: CardFieldsComplete = { number: false, expiry: false, cvc: false };

/** Lo que decide si el botón "Realizar pedido" está habilitado. */
export interface CanPlaceOrderInput {
    method: CheckoutPaymentMethod;
    /** Hay presupuesto calculado (se tiene el importe que se va a cobrar). */
    hasQuote: boolean;
    /** Modalidad de envío y dirección elegidas en Datos. */
    shippingTypeId: number | null;
    shippingAddressId: number | null;
    /** Con la casilla de facturación desmarcada hace falta haber elegido una dirección de facturación. */
    billingSameAsShipping: boolean;
    billingAddressId: number | null;
    /** `true` si Stripe.js ya está cargado (`useStripe()` no es `null`). Solo cuenta con tarjeta. */
    stripeReady: boolean;
    cardFields: CardFieldsComplete;
    /** Nombre del titular tal como lo ha escrito el cliente. Solo cuenta con tarjeta. */
    holderName: string;
    /** `true` mientras hay una petición en vuelo. */
    submitting: boolean;
}

/**
 * Decide si se puede pulsar "Realizar pedido".
 *
 * - Siempre: hay presupuesto, envío y dirección, facturación resuelta y nada en vuelo.
 * - Con tarjeta, además: Stripe.js cargado, número, caducidad y CVC completos y nombre del titular
 *   no vacío (solo espacios no cuenta).
 * - Con transferencia no hay nada más que rellenar.
 *
 * @param input - El estado de la página.
 * @returns `true` si se puede enviar.
 *
 * @example
 * canPlaceOrder({ method: 'Transferencia', hasQuote: true, shippingTypeId: 1, shippingAddressId: 3,
 *     billingSameAsShipping: true, billingAddressId: null, stripeReady: false,
 *     cardFields: EMPTY_CARD_FIELDS, holderName: '', submitting: false }); // true
 */
export function canPlaceOrder(input: CanPlaceOrderInput): boolean {
    if (input.submitting || !input.hasQuote) return false;
    if (input.shippingTypeId === null || input.shippingAddressId === null) return false;
    if (!input.billingSameAsShipping && input.billingAddressId === null) return false;
    if (input.method === 'Transferencia') return true;

    const { number, expiry, cvc } = input.cardFields;
    return input.stripeReady && number && expiry && cvc && input.holderName.trim() !== '';
}

// ---------------------------------------------------------------------------------------------
// Resultado de `stripe.confirmCardPayment`
// ---------------------------------------------------------------------------------------------

/** Lo que usamos del resultado de `confirmCardPayment` (un subconjunto de `PaymentIntentResult`). */
export interface CardConfirmation {
    paymentIntent?: { id: string; status: string };
    error?: { type?: string; code?: string };
}

/** Clasificación del resultado de confirmar la tarjeta. */
export type CardOutcome =
    /** El importe está reservado (`requires_capture`): se puede crear el pedido. */
    | { kind: 'authorized'; paymentIntentId: string }
    /** El banco o Stripe rechaza la tarjeta o los datos: el cliente puede corregir y reintentar. */
    | { kind: 'declined' }
    /** Cualquier otra cosa (red, pasarela, estado inesperado): no se ha reservado nada. */
    | { kind: 'failed' };

/** Códigos de `invalid_request_error` que en realidad son un rechazo de la tarjeta. */
const DECLINE_CODES = new Set(['payment_intent_authentication_failure']);

/**
 * Clasifica el resultado de `stripe.confirmCardPayment`. La captura es manual, así que el único
 * estado de éxito es `requires_capture`.
 *
 * - `requires_capture` → autorizado.
 * - Error de tarjeta (`card_error`), de validación (`validation_error`) o fallo de autenticación
 *   3-D Secure → rechazo.
 * - `requires_payment_method` (Stripe devuelve el intento para empezar otra vez) → rechazo.
 * - Todo lo demás (errores de API o de red, `succeeded`, `processing`…) → fallo.
 *
 * @param result - Lo que devuelve Stripe.js, o `undefined` si la promesa falló.
 * @returns El resultado clasificado.
 *
 * @example
 * classifyCardResult({ paymentIntent: { id: 'pi_1', status: 'requires_capture' } });
 * // { kind: 'authorized', paymentIntentId: 'pi_1' }
 */
export function classifyCardResult(result: CardConfirmation | undefined): CardOutcome {
    if (!result) return { kind: 'failed' };
    const { error, paymentIntent } = result;
    if (error) {
        const declined =
            error.type === 'card_error' ||
            error.type === 'validation_error' ||
            (error.code !== undefined && DECLINE_CODES.has(error.code));
        return declined ? { kind: 'declined' } : { kind: 'failed' };
    }
    if (paymentIntent?.status === 'requires_capture') {
        return { kind: 'authorized', paymentIntentId: paymentIntent.id };
    }
    if (paymentIntent?.status === 'requires_payment_method') return { kind: 'declined' };
    return { kind: 'failed' };
}

// ---------------------------------------------------------------------------------------------
// Cuerpos y respuestas de la API
// ---------------------------------------------------------------------------------------------

/** Las elecciones de Datos que viajan al servidor. */
export interface OrderSelection {
    shippingTypeId: number;
    shippingAddressId: number;
    /** `true` (casilla marcada): la facturación es la dirección de envío y no se manda `billingAddressId`. */
    billingSameAsShipping: boolean;
    billingAddressId: number | null;
}

/**
 * Cuerpo de `POST /api/checkout/pago`: solo el envío y la dirección; los importes los calcula el servidor.
 *
 * @param selection - Las elecciones.
 * @returns `{ shippingTypeId, shippingAddressId }`.
 */
export function buildPaymentBody({ shippingTypeId, shippingAddressId }: OrderSelection) {
    return { shippingTypeId, shippingAddressId };
}

/**
 * Cuerpo de `POST /api/checkout/pedido` (`checkoutOrderRequestSchema`). `billingAddressId` solo
 * viaja con la casilla desmarcada; `paymentIntentId` solo con tarjeta (con transferencia el
 * servidor lo rechaza).
 *
 * @param method - Método de pago.
 * @param selection - Las elecciones.
 * @param paymentIntentId - Id del PaymentIntent ya autorizado; obligatorio con `Tarjeta`.
 * @returns El cuerpo, listo para `JSON.stringify`.
 *
 * @example
 * buildOrderBody('Transferencia', { shippingTypeId: 1, shippingAddressId: 3, billingSameAsShipping: true, billingAddressId: null });
 * // { paymentMethod: 'Transferencia', shippingTypeId: 1, shippingAddressId: 3 }
 */
export function buildOrderBody(
    method: CheckoutPaymentMethod,
    selection: OrderSelection,
    paymentIntentId?: string,
) {
    const { shippingTypeId, shippingAddressId, billingSameAsShipping, billingAddressId } =
        selection;
    return {
        paymentMethod: method,
        shippingTypeId,
        shippingAddressId,
        ...(!billingSameAsShipping && billingAddressId !== null && { billingAddressId }),
        ...(method === 'Tarjeta' && paymentIntentId !== undefined && { paymentIntentId }),
    };
}

/** Lo que usamos de la respuesta de `POST /api/checkout/pago`. */
export interface AuthorizationResponse {
    clientSecret: string;
    paymentIntentId: string;
    /** Total que el servidor va a reservar, en céntimos, con el presupuesto completo. */
    quote: { subtotalCents: number; shippingCents: number; totalCents: number };
}

/** Comprueba que `value` es un objeto (no `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/**
 * Valida la respuesta 200 de `/api/checkout/pago`: `clientSecret`, `paymentIntentId` y el
 * presupuesto con importes enteros.
 *
 * @param body - El JSON recibido.
 * @returns La respuesta tipada, o `null` si no tiene la forma esperada.
 */
export function parseAuthorization(body: unknown): AuthorizationResponse | null {
    if (!isRecord(body) || !isRecord(body.quote)) return null;
    const { clientSecret, paymentIntentId, quote } = body;
    const { subtotalCents, shippingCents, totalCents } = quote;
    if (
        typeof clientSecret !== 'string' ||
        typeof paymentIntentId !== 'string' ||
        !Number.isSafeInteger(subtotalCents) ||
        !Number.isSafeInteger(shippingCents) ||
        !Number.isSafeInteger(totalCents)
    ) {
        return null;
    }
    return {
        clientSecret,
        paymentIntentId,
        quote: {
            subtotalCents: subtotalCents as number,
            shippingCents: shippingCents as number,
            totalCents: totalCents as number,
        },
    };
}

/**
 * Lee `orderId` de la respuesta 200/201 de `/api/checkout/pedido`.
 *
 * @param body - El JSON recibido.
 * @returns El id del pedido, o `null` si no viene un entero positivo.
 */
export function parseOrderId(body: unknown): number | null {
    if (!isRecord(body)) return null;
    const { orderId } = body;
    return typeof orderId === 'number' && Number.isSafeInteger(orderId) && orderId > 0
        ? orderId
        : null;
}

// ---------------------------------------------------------------------------------------------
// Orquestador
// ---------------------------------------------------------------------------------------------

/** Qué debe hacer la página tras pulsar "Realizar pedido". */
export type PlaceOrderResult =
    /** Pedido creado: ir a la confirmación. */
    | { kind: 'done'; url: string }
    /** Sin sesión: ir al login. */
    | { kind: 'login'; url: string }
    /** Carrito vacío o sin stock (antes de reservar nada): ir al carrito, que lo pone al día. */
    | { kind: 'cart'; url: string }
    /** El envío o la dirección ya no existen: volver a Datos. */
    | { kind: 'data'; url: string }
    /** Se reservó el importe pero el pedido no se cerró: pantalla roja de Confirmar. */
    | { kind: 'rejected'; url: string }
    /** Quedarse en Pago con el estado de error (nunca se ha cobrado nada). `declined`: tarjeta rechazada. */
    | { kind: 'error'; reason: 'declined' | 'failed' }
    /** El importe del servidor no coincide con el que se enseñaba: hay que enseñar el nuevo y no pagar aún. */
    | { kind: 'price-changed'; quote: AuthorizationResponse['quote'] };

/** `fetch` reducido a lo que se usa. */
export type PaymentFetch = (input: string, init: RequestInit) => Promise<Response>;

/** Datos de `placeOrder`. */
export interface PlaceOrderInput {
    method: CheckoutPaymentMethod;
    selection: OrderSelection;
    /** Total que enseña la página, en céntimos: se compara con el del servidor antes de reservar. */
    expectedTotalCents: number;
    /**
     * Confirma la tarjeta con Stripe.js (`confirmCardPayment` con el número, el nombre del titular
     * y el `clientSecret`). Puede lanzar: cuenta como fallo.
     */
    confirmCard: (clientSecret: string) => Promise<CardConfirmation>;
    /** Cómo hacer las peticiones; por defecto `fetch`. Solo lo cambian los tests. */
    fetchFn?: PaymentFetch;
}

/** POST de JSON sin caché; lee el cuerpo con tolerancia (una respuesta sin JSON da `undefined`). */
async function postJson(fetchFn: PaymentFetch, url: string, body: unknown) {
    const response = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
    });
    const json: unknown = await response.json().catch(() => undefined);
    return { status: response.status, ok: response.ok, json };
}

/**
 * Interpreta la respuesta de `/api/checkout/pedido`.
 *
 * - 200/201 con `orderId` → confirmación.
 * - 401 → login.
 * - Cualquier otro fallo (409 stock o huella, 402 captura, 5xx, respuesta rara): con tarjeta, el
 *   importe ya está reservado, así que se va a la pantalla roja de Confirmar; con transferencia
 *   no ha pasado nada y se queda en Pago con el banner.
 *
 * @param method - Método con el que se pidió.
 * @param response - Estado HTTP y cuerpo.
 * @returns Qué hacer.
 */
export function mapOrderResponse(
    method: CheckoutPaymentMethod,
    response: { status: number; ok: boolean; json: unknown },
): PlaceOrderResult {
    if (response.status === 401) return { kind: 'login', url: LOGIN_URL };
    if (response.ok) {
        const orderId = parseOrderId(response.json);
        if (orderId !== null) return { kind: 'done', url: confirmationUrl(orderId) };
    }
    return method === 'Tarjeta'
        ? { kind: 'rejected', url: REJECTED_URL }
        : { kind: 'error', reason: 'failed' };
}

/**
 * Hace el pedido de punta a punta, sin tocar la página.
 *
 * **Tarjeta**: (1) `POST /api/checkout/pago` autoriza el importe del servidor; si ese importe no es
 * el que se enseñaba, se para (`price-changed`); (2) `confirmCard` confirma la tarjeta con Stripe
 * (captura manual: éxito = `requires_capture`); (3) `POST /api/checkout/pedido` crea el pedido y
 * cobra. Un rechazo en el paso 2 deja la página en estado de error; un fallo en el 3 lleva a la
 * pantalla roja de Confirmar.
 *
 * **Transferencia**: solo `POST /api/checkout/pedido`.
 *
 * Nunca lanza: lo inesperado (red, JSON) se traduce a un resultado.
 *
 * @param input - Método, elecciones, importe esperado y cómo confirmar la tarjeta.
 * @returns Qué debe hacer la página.
 *
 * @example
 * const result = await placeOrder({ method: 'Transferencia', selection, expectedTotalCents: 4690, confirmCard });
 * if (result.kind === 'done') router.push(result.url);
 */
export async function placeOrder({
    method,
    selection,
    expectedTotalCents,
    confirmCard,
    fetchFn = (input, init) => globalThis.fetch(input, init),
}: PlaceOrderInput): Promise<PlaceOrderResult> {
    if (method === 'Transferencia') {
        try {
            const order = await postJson(fetchFn, ORDER_API, buildOrderBody(method, selection));
            return mapOrderResponse(method, order);
        } catch {
            return { kind: 'error', reason: 'failed' };
        }
    }

    // Paso 1: autorizar. Aún no se ha reservado nada si falla.
    let authorization: AuthorizationResponse;
    try {
        const response = await postJson(fetchFn, PAYMENT_API, buildPaymentBody(selection));
        if (response.status === 401) return { kind: 'login', url: LOGIN_URL };
        if (response.status === 400 || response.status === 409)
            return { kind: 'cart', url: '/carrito' };
        if (response.status === 404) return { kind: 'data', url: '/checkout' };
        const parsed = response.ok ? parseAuthorization(response.json) : null;
        if (!parsed) return { kind: 'error', reason: 'failed' };
        authorization = parsed;
    } catch {
        return { kind: 'error', reason: 'failed' };
    }
    if (authorization.quote.totalCents !== expectedTotalCents) {
        return { kind: 'price-changed', quote: authorization.quote };
    }

    // Paso 2: confirmar la tarjeta (reserva el importe).
    let outcome: CardOutcome;
    try {
        outcome = classifyCardResult(await confirmCard(authorization.clientSecret));
    } catch {
        outcome = { kind: 'failed' };
    }
    if (outcome.kind !== 'authorized') return { kind: 'error', reason: outcome.kind };

    // Paso 3: crear el pedido. Desde aquí el importe está reservado: un fallo va a la pantalla roja.
    try {
        const order = await postJson(
            fetchFn,
            ORDER_API,
            buildOrderBody(method, selection, outcome.paymentIntentId),
        );
        return mapOrderResponse(method, order);
    } catch {
        return { kind: 'rejected', url: REJECTED_URL };
    }
}
