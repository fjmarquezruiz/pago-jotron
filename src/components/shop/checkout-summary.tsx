'use client';

import * as React from 'react';
import {
    SummaryPanel,
    SummaryRow,
    SummaryTotal,
    TrustBadges,
} from '@/components/shop/summary-parts';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCents } from '@/lib/cart/totals';
import {
    formatBusinessDeliveryTime,
    formatShippingChoice,
    type ShippingOptionInput,
} from '@/lib/catalog/shipping';
import type { OrderQuote } from '@/lib/orders/quote';

/** Una modalidad de envío del selector: una fila de `shipping_types` con plazo (`deliveryOptions`). */
export type ShippingChoice = ShippingOptionInput & { id: number };

interface CheckoutSummaryProps {
    /** Subtotal y total del presupuesto del servidor (`quoteOrder`); `null` mientras no se tiene (se pintan "—"). */
    quote: Pick<OrderQuote, 'subtotalCents' | 'totalCents'> | null;
    /** Modalidades de envío que se ofrecen (`deliveryOptions`). */
    shippingOptions: readonly ShippingChoice[];
    /** Id de la modalidad elegida, o `null` si no hay ninguna. */
    shippingTypeId: number | null;
    /** Se llama con el id de la modalidad que el usuario elige. */
    onShippingChange: (id: number) => void;
    /** Fecha de entrega estimada ya formateada (`formatDeliveryDate`); sin ella no se pinta la fila. */
    estimatedDelivery?: string | null;
    /** Nota entre el total y el botón, por ejemplo el `Alert` ámbar "No se ha realizado ningún cargo.". */
    note?: React.ReactNode;
    /** El botón de continuar o de realizar el pedido (`Button variant="brand" size="lg"` a ancho completo). */
    cta: React.ReactNode;
}

/**
 * Resumen del pedido de los pasos Datos y Pago (Figma: summary-cart): subtotal, selector de envío
 * (un radio por modalidad, con su precio y su plazo en días laborables), entrega estimada, IVA,
 * total, nota opcional, botón y sellos de confianza.
 *
 * Los importes salen del presupuesto del servidor (`quote`, en céntimos); aquí no se calcula nada.
 * Si no hay modalidades con plazo, no se pinta el bloque de envío.
 *
 * @example
 * <CheckoutSummary
 *     quote={quote}
 *     shippingOptions={deliveryOptions(types)}
 *     shippingTypeId={shippingTypeId}
 *     onShippingChange={setShippingType}
 *     estimatedDelivery="Jue, 18 oct"
 *     cta={<Button variant="brand" size="lg" className="w-full" disabled={!valid}>Continuar pago</Button>}
 * />
 */
export function CheckoutSummary({
    quote,
    shippingOptions,
    shippingTypeId,
    onShippingChange,
    estimatedDelivery,
    note,
    cta,
}: CheckoutSummaryProps) {
    const money = (cents: number | undefined) => (cents === undefined ? '—' : formatCents(cents));
    return (
        <SummaryPanel titleId="checkout-summary-title">
            <SummaryRow label="Subtotal" value={money(quote?.subtotalCents)} />
            {shippingOptions.length > 0 && (
                <div className="flex flex-col gap-3">
                    <p
                        id="checkout-shipping-label"
                        className="text-sm font-medium text-muted-foreground"
                    >
                        Envío
                    </p>
                    <RadioGroup
                        aria-labelledby="checkout-shipping-label"
                        value={shippingTypeId === null ? '' : String(shippingTypeId)}
                        onValueChange={(next) => onShippingChange(Number(next))}
                        className="gap-3"
                    >
                        {shippingOptions.map((option) => {
                            const inputId = `checkout-shipping-${option.id}`;
                            const time = formatBusinessDeliveryTime(
                                option.minDeliveryDays,
                                option.maxDeliveryDays,
                            );
                            return (
                                <div key={option.id} className="flex items-center gap-4">
                                    <RadioGroupItem
                                        size="lg"
                                        id={inputId}
                                        value={String(option.id)}
                                    />
                                    <Label
                                        htmlFor={inputId}
                                        className="flex-col items-start gap-0 text-sm"
                                    >
                                        {formatShippingChoice(option)}
                                        {time && (
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {time}
                                            </span>
                                        )}
                                    </Label>
                                </div>
                            );
                        })}
                    </RadioGroup>
                </div>
            )}
            {estimatedDelivery && (
                <SummaryRow label="Entrega estimada" value={estimatedDelivery} align="baseline" />
            )}
            <SummaryRow label="IVA" value="Incluido" />
            <SummaryTotal value={money(quote?.totalCents)} />
            {note}
            {cta}
            <TrustBadges />
        </SummaryPanel>
    );
}
