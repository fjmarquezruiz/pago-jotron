'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { CardNumberElement } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { ArrowRight } from 'lucide-react';
import {
    CardFields,
    INITIAL_CARD_FIELDS_STATE,
    type CardFieldsState,
} from '@/components/shop/card-fields';
import { CheckoutHydrator } from '@/components/shop/checkout-hydrator';
import { CheckoutSteps } from '@/components/shop/checkout-steps';
import { CheckoutSummary, type ShippingChoice } from '@/components/shop/checkout-summary';
import { PaymentAddressSection } from '@/components/shop/payment-address-section';
import { PaymentMethodTabs } from '@/components/shop/payment-method-tabs';
import { PaymentNotice } from '@/components/shop/payment-notice';
import { PaymentSkeleton } from '@/components/shop/payment-skeleton';
import { TransferDetails } from '@/components/shop/transfer-details';
import { useCartLines } from '@/components/shop/use-cart-lines';
import { useCheckoutData } from '@/components/shop/use-checkout-data';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Cart } from '@/lib/cart/cart';
import {
    LOGIN_URL,
    PAYMENT_ERROR_MESSAGE,
    canPlaceOrder,
    placeOrder,
    type CheckoutPaymentMethod,
} from '@/lib/checkout/payment';
import type { CartLine, UserAddress } from '@/lib/db/queries';
import { estimatedDeliveryDate, formatDeliveryDate } from '@/lib/orders/delivery';
import { quoteOrder, type OrderQuote } from '@/lib/orders/quote';
import { useCartStore } from '@/stores/cart';
import { useCheckoutStore } from '@/stores/checkout';
import { useCartHydrated } from '@/stores/use-cart-hydrated';
import { useCartSynced } from '@/stores/use-cart-synced';
import { useCheckoutHydrated } from '@/stores/use-checkout-hydrated';

/** Datos bancarios de la tienda para la transferencia (`getTransferDetails()`, del servidor). */
export interface PaymentTransfer {
    holder: string;
    iban: string;
}

interface PaymentViewProps {
    /** Modalidades de envío con plazo (`deliveryOptions(await getShippingTypes())`). */
    shippingOptions: ShippingChoice[];
    /** Titular e IBAN, o `null` si el servidor no los tiene: entonces la transferencia no se ofrece. */
    transfer: PaymentTransfer | null;
}

let stripePromise: Promise<Stripe | null> | undefined;

/**
 * Stripe.js del navegador (con la clave pública `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`), cargado la
 * primera vez que se pinta el formulario de Pago y compartido después: así Stripe.js solo se
 * descarga en esta página, no en toda la tienda. Sin la clave devuelve `null`.
 */
function getStripePromise(): Promise<Stripe | null> | null {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) return null;
    stripePromise ??= loadStripe(key);
    return stripePromise;
}

/**
 * Opciones de `Elements`, constantes (Stripe avisa si cambian). Idioma español y Geist para el
 * texto de los iframes (Stripe no ve las fuentes de la página: se le da la hoja de Google Fonts).
 */
const ELEMENTS_OPTIONS: StripeElementsOptions = {
    locale: 'es',
    fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Geist:wght@400&display=swap' }],
};

/** El presupuesto con el que se pinta el resumen: subtotal y total en céntimos. */
type DisplayQuote = Pick<OrderQuote, 'subtotalCents' | 'totalCents'>;

/**
 * Presupuesto con las líneas del servidor (precio e IVA de ahora) y las cantidades del carrito.
 * Solo es lo que se enseña: el importe que se reserva y se cobra lo calcula el servidor al pagar.
 *
 * @returns El presupuesto, o `null` si no se puede calcular.
 */
function localQuote(
    items: Cart,
    lines: readonly CartLine[],
    shippingCost: string,
): OrderQuote | null {
    try {
        return quoteOrder(
            items.flatMap(({ variantId, quantity }) => {
                const line = lines.find((candidate) => candidate.variantId === variantId);
                return line ? [{ quantity, price: line.price, taxRate: line.taxRate }] : [];
            }),
            shippingCost,
        );
    } catch {
        return null;
    }
}

interface PaymentBodyProps extends PaymentViewProps {
    addresses: UserAddress[];
    items: Cart;
    lines: CartLine[];
    /** `true` si hay clave pública de Stripe. */
    stripeAvailable: boolean;
}

/**
 * El cuerpo de Pago, ya con todo lo necesario (carrito, líneas del servidor, direcciones, envío y
 * dirección elegidos). Va dentro de `Elements`: de ahí salen `useStripe` y `useElements`.
 */
function PaymentBody({
    shippingOptions,
    transfer,
    addresses,
    items,
    lines,
    stripeAvailable,
}: PaymentBodyProps) {
    const router = useRouter();
    const stripe = useStripe();
    const elements = useElements();

    const shippingTypeId = useCheckoutStore((state) => state.shippingTypeId);
    const shippingAddressId = useCheckoutStore((state) => state.shippingAddressId);
    const billingSameAsShipping = useCheckoutStore((state) => state.billingSameAsShipping);
    const storedBillingId = useCheckoutStore((state) => state.billingAddressId);
    const setShippingType = useCheckoutStore((state) => state.setShippingType);
    const selectShippingAddress = useCheckoutStore((state) => state.selectShippingAddress);
    const setBillingSame = useCheckoutStore((state) => state.setBillingSame);
    const selectBillingAddress = useCheckoutStore((state) => state.selectBillingAddress);

    const methods: CheckoutPaymentMethod[] = transfer ? ['Tarjeta', 'Transferencia'] : ['Tarjeta'];
    const [method, setMethod] = useState<CheckoutPaymentMethod>('Tarjeta');
    const [cardState, setCardState] = useState<CardFieldsState>(INITIAL_CARD_FIELDS_STATE);
    const [holderName, setHolderName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // `declined`: el banco rechaza la tarjeta; `failed`: cualquier otro fallo previo al pedido. Los
    // dos pintan el mismo estado de error de Figma (no se ha cobrado nada).
    const [error, setError] = useState<'declined' | 'failed' | null>(null);
    // Importe que dijo el servidor cuando no coincidía con el que se enseñaba (válido para ese envío).
    const [serverQuote, setServerQuote] = useState<{
        shippingTypeId: number;
        quote: DisplayQuote;
    } | null>(null);
    const submittingRef = useRef(false);
    const bannerRef = useRef<HTMLDivElement>(null);

    const shipping = shippingOptions.find((option) => option.id === shippingTypeId) ?? null;
    const calculated = useMemo(
        () => (shipping ? localQuote(items, lines, shipping.cost) : null),
        [items, lines, shipping],
    );
    const quote: DisplayQuote | null =
        serverQuote && serverQuote.shippingTypeId === shippingTypeId
            ? serverQuote.quote
            : calculated;

    // La facturación elegida solo vale si sigue siendo una dirección de tipo Facturación.
    const billingAddressId =
        !billingSameAsShipping &&
        addresses.some(
            ({ id, addressType }) => id === storedBillingId && addressType === 'Facturación',
        )
            ? storedBillingId
            : null;

    const deliveryDays = shipping?.maxDeliveryDays ?? shipping?.minDeliveryDays ?? null;
    const estimatedDelivery = useMemo(
        () =>
            deliveryDays === null
                ? null
                : formatDeliveryDate(estimatedDeliveryDate(new Date(), deliveryDays)),
        [deliveryDays],
    );

    const canPlace = canPlaceOrder({
        method,
        hasQuote: quote !== null,
        shippingTypeId,
        shippingAddressId,
        billingSameAsShipping,
        billingAddressId,
        stripeReady: stripe !== null && elements !== null,
        cardFields: cardState.complete,
        holderName,
        submitting,
    });

    // Tras un error, el foco va al banner (se anuncia como `alert` y se ve, aunque el botón esté abajo).
    useEffect(() => {
        if (error) bannerRef.current?.focus();
    }, [error]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!canPlace || submittingRef.current || !quote) return;
        if (shippingTypeId === null || shippingAddressId === null) return;

        submittingRef.current = true;
        setSubmitting(true);
        setError(null);
        setServerQuote(null);
        const result = await placeOrder({
            method,
            selection: {
                shippingTypeId,
                shippingAddressId,
                billingSameAsShipping,
                billingAddressId,
            },
            expectedTotalCents: quote.totalCents,
            confirmCard: async (clientSecret) => {
                const card = elements?.getElement(CardNumberElement);
                if (!stripe || !card) throw new Error('Stripe no está listo');
                return stripe.confirmCardPayment(clientSecret, {
                    payment_method: { card, billing_details: { name: holderName.trim() } },
                });
            },
        });

        if (result.kind === 'error') {
            setError(result.reason);
        } else if (result.kind === 'price-changed') {
            setServerQuote({ shippingTypeId, quote: result.quote });
        } else {
            // Cualquier otro resultado cambia de página: el botón sigue bloqueado hasta que se va.
            router.push(result.url);
            return;
        }
        submittingRef.current = false;
        setSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-12">
            <CheckoutSteps current={2} errorStep={error ? 2 : undefined} />
            <div className="flex min-h-12 items-baseline gap-4">
                <h1 className="font-display text-4xl">Pago</h1>
            </div>
            <div className="grid gap-x-16 gap-y-12 xl:grid-cols-3">
                <div className="flex flex-col gap-12 xl:col-span-2">
                    {error && (
                        <Alert
                            ref={bannerRef}
                            type="error"
                            size="md"
                            tabIndex={-1}
                            title={PAYMENT_ERROR_MESSAGE}
                            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        />
                    )}
                    {serverQuote && (
                        <Alert type="warning" size="md" title="El importe del pedido ha cambiado.">
                            Revisa el total del resumen y vuelve a pulsar «Realizar pedido».
                        </Alert>
                    )}
                    <PaymentMethodTabs
                        value={method}
                        methods={methods}
                        onValueChange={(next) => {
                            setMethod(next);
                            setError(null);
                        }}
                    />
                    {/* El panel de la tarjeta sigue montado al cambiar de método: los iframes de Stripe conservan lo escrito. */}
                    <div hidden={method !== 'Tarjeta'}>
                        <CardFields
                            state={cardState}
                            onStateChange={setCardState}
                            holderName={holderName}
                            onHolderNameChange={setHolderName}
                            available={stripeAvailable}
                        />
                    </div>
                    {method === 'Transferencia' && transfer && (
                        <TransferDetails holder={transfer.holder} iban={transfer.iban} />
                    )}
                    <PaymentAddressSection
                        addresses={addresses}
                        shippingAddressId={shippingAddressId}
                        onShippingChange={selectShippingAddress}
                        billingSameAsShipping={billingSameAsShipping}
                        onBillingSameChange={setBillingSame}
                        billingAddressId={billingAddressId}
                        onBillingChange={selectBillingAddress}
                    />
                </div>
                <CheckoutSummary
                    quote={quote}
                    shippingOptions={shippingOptions}
                    shippingTypeId={shippingTypeId}
                    onShippingChange={setShippingType}
                    estimatedDelivery={estimatedDelivery}
                    note={error && <PaymentNotice title="No se ha realizado ningún cargo." />}
                    cta={
                        <Button
                            type="submit"
                            variant="brand"
                            size="lg"
                            className="w-full"
                            disabled={!canPlace}
                            loading={submitting}
                        >
                            Realizar pedido
                            <ArrowRight aria-hidden="true" />
                        </Button>
                    }
                />
            </div>
        </form>
    );
}

/** Pone `Elements` (con Stripe.js cargado de forma perezosa) alrededor del cuerpo de Pago. */
function PaymentWithStripe(props: Omit<PaymentBodyProps, 'stripeAvailable'>) {
    const [promise] = useState(getStripePromise);
    return (
        <Elements stripe={promise} options={ELEMENTS_OPTIONS}>
            <PaymentBody {...props} stripeAvailable={promise !== null} />
        </Elements>
    );
}

/**
 * Página de Pago, paso 3 del checkout (RF7; Figma: checkout-3-pago, checkout-3-pago-error y
 * checkout-3-pago-transferencia). Componente de cliente: el carrito y las elecciones de Datos viven
 * en el navegador.
 *
 * Qué hace:
 * - Espera a recuperar las elecciones (`CheckoutHydrator`), el carrito y las direcciones: mientras
 *   tanto, esqueleto.
 * - Si falta algo (carrito vacío → `/carrito`; sin envío o dirección válidos → `/checkout`) redirige
 *   con `router.replace` y sigue pintando el esqueleto, sin parpadeo. Sin sesión (401) va al login.
 * - Con todo: selector de método (tarjeta o, si el servidor tiene los datos, transferencia), el
 *   bloque del método, el bloque "Dirección de envío" y el resumen con el selector de envío.
 * - "Realizar pedido" ejecuta `placeOrder` (ver `src/lib/checkout/payment.ts`): con tarjeta
 *   autoriza en `/api/checkout/pago`, confirma con Stripe y crea el pedido; con transferencia crea
 *   el pedido directamente. Un fallo antes de crear el pedido deja la página en su estado de error
 *   (banner, paso 3 en rojo y la nota "No se ha realizado ningún cargo.").
 *
 * Los importes del resumen se calculan con precios del servidor (`/api/carrito/lineas`) y
 * `quoteOrder`; al pagar, el servidor vuelve a calcular y, si no coincide, se avisa y no se paga.
 *
 * @example
 * <PaymentView shippingOptions={deliveryOptions(await getShippingTypes())} transfer={getTransferDetails()} />
 */
export function PaymentView({ shippingOptions, transfer }: PaymentViewProps) {
    const router = useRouter();
    const checkoutHydrated = useCheckoutHydrated();
    const cartHydrated = useCartHydrated();
    // Con sesión, el carrito de la cuenta puede diferir del local: se espera a la sincronización.
    const cartSynced = useCartSynced();
    const ready = checkoutHydrated && cartHydrated && cartSynced;

    const items = useCartStore((state) => state.items);
    const shippingTypeId = useCheckoutStore((state) => state.shippingTypeId);
    const shippingAddressId = useCheckoutStore((state) => state.shippingAddressId);
    const { state: data, reload } = useCheckoutData();
    const { lines, status, retry } = useCartLines(
        ready ? items.map((item) => item.variantId) : [],
        () => {},
    );

    // A dónde mandar al cliente si falta algo para pagar; `null` si todo está.
    let redirectTo: string | null = null;
    if (ready) {
        if (items.length === 0) redirectTo = '/carrito';
        else if (
            !shippingOptions.some(({ id }) => id === shippingTypeId) ||
            shippingAddressId === null
        )
            redirectTo = '/checkout';
        else if (data.status === 'error' && data.reason === 'unauthorized') redirectTo = LOGIN_URL;
        else if (
            data.status === 'ready' &&
            !data.addresses.some(({ id }) => id === shippingAddressId)
        )
            redirectTo = '/checkout';
    }
    useEffect(() => {
        if (redirectTo) router.replace(redirectTo);
    }, [redirectTo, router]);

    let content: React.ReactNode;
    if (!ready || redirectTo || data.status === 'loading') {
        content = <PaymentSkeleton />;
    } else if (data.status === 'error' || status === 'error') {
        content = (
            <div className="flex flex-col gap-12">
                <CheckoutSteps current={2} />
                <h1 className="sr-only">Pago</h1>
                <Alert
                    type="error"
                    title="No hemos podido cargar el pago"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={data.status === 'error' ? reload : retry}
                        >
                            Reintentar
                        </Button>
                    }
                >
                    Comprueba tu conexión e inténtalo de nuevo.
                </Alert>
            </div>
        );
    } else if (status === 'loading') {
        content = <PaymentSkeleton />;
    } else {
        content = (
            <PaymentWithStripe
                shippingOptions={shippingOptions}
                transfer={transfer}
                addresses={data.addresses}
                items={items}
                lines={lines}
            />
        );
    }

    return (
        <>
            <CheckoutHydrator />
            {content}
        </>
    );
}
