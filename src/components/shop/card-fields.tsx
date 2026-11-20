'use client';

import * as React from 'react';
import { CardCvcElement, CardExpiryElement, CardNumberElement } from '@stripe/react-stripe-js';
import type {
    StripeCardCvcElementChangeEvent,
    StripeCardExpiryElementChangeEvent,
    StripeCardNumberElementChangeEvent,
    StripeElementClasses,
    StripeElementStyle,
} from '@stripe/stripe-js';
import { Lock } from 'lucide-react';
import { CheckoutSection } from '@/components/shop/checkout-section';
import { Field, FieldControl, FieldLabel, FieldMessage, useField } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { CardFieldsComplete } from '@/lib/checkout/payment';

/**
 * Estilo del texto DENTRO de los iframes de Stripe. No heredan el CSS de la página ni entienden
 * `var(--…)`, así que van los valores literales de los tokens (Figma, spec de Pago §6.3):
 * Geist 16/24 peso 400 (`--font-family-sans`, base/regular), el marcador en `--muted-foreground`
 * (#525252, verificado en Figma) y el error en `--destructive` (#b81f1d).
 *
 * El color del texto escrito (#0a0a0a, `--foreground`) NO está verificado en Figma: el diseño solo
 * dibuja marcadores. No hay tema oscuro para este paso, así que no cambia con el tema.
 */
export const STRIPE_ELEMENT_STYLE: StripeElementStyle = {
    base: {
        fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
        fontSize: '16px',
        fontWeight: '400',
        color: '#0a0a0a',
        '::placeholder': { color: '#525252' },
    },
    invalid: { color: '#b81f1d' },
};

/**
 * Clases que Stripe pone al contenedor de cada campo según su estado. Replican las de
 * `controlBase` de `ui/input.tsx`: el foco pinta `border-ring ring-1 ring-ring` y el error
 * `border-destructive` (con su anillo si además está enfocado).
 */
const STRIPE_ELEMENT_CLASSES: StripeElementClasses = {
    focus: 'border-ring ring-1 ring-ring',
    invalid: 'border-destructive focus:ring-destructive',
};

/**
 * Contenedor de cada Element de Stripe, con las medidas de `Input size="lg"` (Figma): 48 de alto,
 * relleno horizontal de 24 (`inset-xl`), borde de 1 px `input`, `rounded-sm`, fondo `card`. El
 * iframe de Stripe (sin `lineHeight`, que Stripe desaconseja: usa el alto natural) se centra en vertical.
 */
const stripeContainerClassName =
    'flex h-control-lg w-full min-w-0 items-center rounded-sm border border-input bg-card px-inset-xl transition-colors hover:border-foreground/50 [&>*]:w-full';

/** Estado de cada campo suelto de Stripe: si está completo y su mensaje de error, si lo hay. */
export interface CardFieldsState {
    complete: CardFieldsComplete;
    errors: { number: string | null; expiry: string | null; cvc: string | null };
}

/** El estado de partida: nada completo y sin errores. */
export const INITIAL_CARD_FIELDS_STATE: CardFieldsState = {
    complete: { number: false, expiry: false, cvc: false },
    errors: { number: null, expiry: null, cvc: null },
};

type CardChangeEvent =
    | StripeCardNumberElementChangeEvent
    | StripeCardExpiryElementChangeEvent
    | StripeCardCvcElementChangeEvent;

interface CardFieldProps {
    label: string;
    /** Mensaje de error de Stripe para este campo, o `null`. */
    error: string | null;
    /** Pinta el Element de Stripe con el `id` que enlaza la etiqueta. */
    children: (id: string) => React.ReactNode;
}

/**
 * Un campo de la tarjeta: `Field` del sistema (etiqueta `base/medium`, hueco de 8) con el Element de
 * Stripe como control. La etiqueta usa `text-muted-foreground`, como en Figma (el `Label` del
 * sistema es `text-foreground`). El `id` del Element enlaza la etiqueta (`htmlFor`): al pulsarla,
 * Stripe enfoca el campo. El mensaje de error es `role="alert"` y sale bajo el campo.
 */
function CardField({ label, error, children }: CardFieldProps) {
    return (
        <Field size="lg" invalid={error !== null}>
            <FieldLabel className="text-muted-foreground">{label}</FieldLabel>
            <CardFieldControl>{children}</CardFieldControl>
            <FieldMessage>{error}</FieldMessage>
        </Field>
    );
}

/** Pinta el Element con el `id` del `Field` más cercano. */
function CardFieldControl({ children }: { children: (id: string) => React.ReactNode }) {
    const { id } = useField();
    return <>{children(id)}</>;
}

interface CardFieldsProps {
    /** Estado de los tres campos de Stripe. */
    state: CardFieldsState;
    /** Se llama con el estado nuevo cada vez que cambia un campo. */
    onStateChange: (next: (previous: CardFieldsState) => CardFieldsState) => void;
    /** Nombre del titular (`billing_details.name`). */
    holderName: string;
    onHolderNameChange: (value: string) => void;
    /** `true` si Stripe.js está disponible (hay clave pública); si no, se avisa en lugar de pintar los campos. */
    available: boolean;
}

/**
 * Bloque "Tarjeta de crédito" (Figma: sumary-blocks, variante tarjeta): número, caducidad y CVC como
 * campos sueltos de Stripe (`CardNumberElement`, `CardExpiryElement`, `CardCvcElement`, en iframes de
 * Stripe: los datos de la tarjeta no pasan por nuestro código ni por nuestro servidor) y el
 * "Nombre del titular" como `Input` del sistema. Debe pintarse dentro de `<Elements>`.
 *
 * Los tres Elements informan de si están completos y de su error (`onChange`); el estado vive en
 * quien lo pinta (`PaymentView`) porque el botón "Realizar pedido" lo necesita.
 *
 * Retícula: 4 columnas con hueco de 24 desde `2xl` (donde el contenedor mide los 1440 del diseño y
 * cada campo, 196,67); 2 columnas debajo y 1 en móvil (el diseño solo existe a 1920).
 *
 * No se pintan los 3 logos de marcas de tarjeta de la fila del título: en Figma son marcadores de
 * posición de 48x32 con el patrón de cuadros de "transparencia", sin marcas reales, y no se
 * inventan marcas. La fila del título conserva su alto de 32 (`min-h-8`) para no cambiar el del bloque.
 *
 * @example
 * <CardFields state={state} onStateChange={setState} holderName={name} onHolderNameChange={setName} available />
 */
export function CardFields({
    state,
    onStateChange,
    holderName,
    onHolderNameChange,
    available,
}: CardFieldsProps) {
    /** Recoge `complete` y `error` de un Element en el estado. */
    function track(field: keyof CardFieldsComplete) {
        return (event: CardChangeEvent) =>
            onStateChange((previous) => ({
                complete: { ...previous.complete, [field]: event.complete },
                errors: { ...previous.errors, [field]: event.error?.message ?? null },
            }));
    }

    return (
        <CheckoutSection
            title={<span className="flex min-h-8 items-center">Tarjeta de crédito</span>}
        >
            {available ? (
                <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-4">
                    <CardField label="Número de tarjeta" error={state.errors.number}>
                        {(id) => (
                            <CardNumberElement
                                id={id}
                                className={stripeContainerClassName}
                                options={{
                                    placeholder: '0000-0000-0000-0000',
                                    style: STRIPE_ELEMENT_STYLE,
                                    classes: STRIPE_ELEMENT_CLASSES,
                                }}
                                onChange={track('number')}
                            />
                        )}
                    </CardField>
                    <CardField label="Fecha de caducidad" error={state.errors.expiry}>
                        {(id) => (
                            <CardExpiryElement
                                id={id}
                                className={stripeContainerClassName}
                                options={{
                                    placeholder: 'MM / AA',
                                    style: STRIPE_ELEMENT_STYLE,
                                    classes: STRIPE_ELEMENT_CLASSES,
                                }}
                                onChange={track('expiry')}
                            />
                        )}
                    </CardField>
                    <CardField label="CVV" error={state.errors.cvc}>
                        {(id) => (
                            <CardCvcElement
                                id={id}
                                className={stripeContainerClassName}
                                options={{
                                    placeholder: '123',
                                    style: STRIPE_ELEMENT_STYLE,
                                    classes: STRIPE_ELEMENT_CLASSES,
                                }}
                                onChange={track('cvc')}
                            />
                        )}
                    </CardField>
                    <Field size="lg">
                        <FieldLabel className="text-muted-foreground">
                            Nombre del titular
                        </FieldLabel>
                        <FieldControl>
                            <Input
                                size="lg"
                                name="cc-name"
                                autoComplete="cc-name"
                                required
                                placeholder="Nombre tal como aparece en la tarjeta"
                                value={holderName}
                                onChange={(event) => onHolderNameChange(event.target.value)}
                                className="truncate"
                            />
                        </FieldControl>
                    </Field>
                </div>
            ) : (
                <p role="alert" className="text-sm text-destructive">
                    El pago con tarjeta no está disponible ahora mismo.
                </p>
            )}
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex h-5 shrink-0 items-center">
                    <Lock aria-hidden="true" className="size-4" />
                </span>
                <p>
                    Los campos de la tarjeta los gestiona la pasarela de pago (Stripe) dentro de
                    esta página. Tus datos no pasan por nuestro servidor.
                </p>
            </div>
        </CheckoutSection>
    );
}
