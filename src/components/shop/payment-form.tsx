'use client';

import * as React from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

let stripePromise: Promise<Stripe | null> | undefined;

/**
 * Stripe.js del navegador (con la clave pública `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`), cargado la
 * primera vez que se pinta el formulario y compartido después: así Stripe.js solo se descarga en
 * el checkout, no en toda la tienda. Sin la clave devuelve `null` y el formulario avisa.
 */
function getStripePromise(): Promise<Stripe | null> | null {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) return null;
    stripePromise ??= loadStripe(key);
    return stripePromise;
}

export interface PaymentFormProps {
    /** Secreto del PaymentIntent que devuelve `POST /api/checkout/pago`. */
    clientSecret: string;
    /**
     * Dirección a la que Stripe vuelve si el banco pide autenticar la tarjeta con una redirección
     * (3-D Secure). Normalmente se confirma sin salir de la página.
     */
    returnUrl: string;
    /**
     * Se llama cuando la tarjeta está confirmada y el importe reservado (`requires_capture`).
     * Todavía no se ha cobrado: falta crear el pedido y capturar.
     *
     * @param paymentIntentId - Id del PaymentIntent (`pi_…`).
     */
    onAuthorized: (paymentIntentId: string) => void;
    /** Texto del botón. Por defecto, "Pagar". */
    submitLabel?: string;
}

/** El formulario de tarjeta: dentro de `Elements`, que es de donde salen `useStripe` y `useElements`. */
function PaymentFormFields({
    returnUrl,
    onAuthorized,
    submitLabel,
}: Omit<PaymentFormProps, 'clientSecret'>) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!stripe || !elements || submitting) return;

        setSubmitting(true);
        setError(null);
        try {
            const result = await stripe.confirmPayment({
                elements,
                confirmParams: { return_url: returnUrl },
                // Sin redirección salvo que el banco la exija: la tarjeta se confirma aquí.
                redirect: 'if_required',
            });
            if (result.error) {
                // Stripe da el mensaje ya en el idioma del formulario (`locale: 'es'`).
                setError(result.error.message ?? 'No se ha podido confirmar la tarjeta.');
            } else if (result.paymentIntent.status === 'requires_capture') {
                onAuthorized(result.paymentIntent.id);
            } else {
                setError('No se ha podido autorizar el pago. Inténtalo de nuevo.');
            }
        } catch {
            setError('No se ha podido confirmar la tarjeta. Inténtalo de nuevo.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <PaymentElement />
            {error && (
                <Alert type="error" role="alert">
                    {error}
                </Alert>
            )}
            <Button
                type="submit"
                variant="brand"
                size="lg"
                className="w-full"
                loading={submitting}
                disabled={!stripe || !elements}
            >
                {submitLabel ?? 'Pagar'}
            </Button>
        </form>
    );
}

/**
 * Formulario de pago con tarjeta (RF7): el Payment Element de Stripe. La tarjeta se teclea en un
 * iframe de Stripe y no pasa por nuestro servidor ni por nuestro código (PCI DSS, RNF3). Al
 * enviar, Stripe confirma la tarjeta y **reserva** el importe del PaymentIntent (captura manual);
 * `onAuthorized` avisa entonces. El cobro y el pedido los hace el servidor después.
 *
 * Es el cuerpo del paso "Pago" del checkout: no lleva título ni resumen, y su aspecto es el de
 * Stripe con el idioma español (el tema del sistema de diseño se aplicará con el diseño del
 * paso). Sin `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` muestra un aviso en lugar del formulario.
 *
 * @example
 * <PaymentForm
 *     clientSecret={clientSecret}
 *     returnUrl={`${window.location.origin}/checkout`}
 *     onAuthorized={(paymentIntentId) => confirmOrder(paymentIntentId)}
 * />
 */
export function PaymentForm({
    clientSecret,
    returnUrl,
    onAuthorized,
    submitLabel,
}: PaymentFormProps) {
    const promise = getStripePromise();
    if (!promise) {
        return (
            <Alert type="error" role="alert">
                El pago con tarjeta no está disponible ahora mismo.
            </Alert>
        );
    }
    return (
        <Elements stripe={promise} options={{ clientSecret, locale: 'es' }}>
            <PaymentFormFields
                returnUrl={returnUrl}
                onAuthorized={onAuthorized}
                submitLabel={submitLabel}
            />
        </Elements>
    );
}
