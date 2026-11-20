'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { CheckoutPaymentMethod } from '@/lib/checkout/payment';

/** Texto de cada método en el selector (Figma: payment-method-tabs; PayPal no se implementa). */
const METHOD_LABELS: Record<CheckoutPaymentMethod, string> = {
    Tarjeta: 'Tarjeta de crédito',
    Transferencia: 'Transferencia bancaria',
};

interface PaymentMethodTabsProps {
    /** Método elegido. */
    value: CheckoutPaymentMethod;
    /** Se llama con el método que elige el cliente. */
    onValueChange: (method: CheckoutPaymentMethod) => void;
    /** Métodos que se ofrecen, en orden. La transferencia solo si el servidor tiene los datos bancarios. */
    methods: readonly CheckoutPaymentMethod[];
}

/**
 * Selector del método de pago (Figma: payment-method-tabs): un chip por método, el elegido en negro
 * (`Button default`) y los demás con borde (`Button outline`).
 *
 * Es un `RadioGroup` con `RadioGroupItem variant="chip"` y no un `tablist`: lo que se elige es un
 * valor del formulario (con qué se paga), no se navega entre vistas, y Radix da gratis las flechas
 * y el foco itinerante. El grupo tiene nombre accesible ("Método de pago").
 *
 * Retoque LOCAL de las medidas del chip: el del sistema mide 40 de alto, 16 de relleno, texto `sm` y
 * 12 de hueco; el de Figma es un `Button size="lg"`: 48 de alto, `inset-xl` (24) de relleno, texto
 * `base` y 16 de hueco. Se pasa por `className` (`cn` resuelve el conflicto) sin tocar `radio-group.tsx`.
 *
 * @example
 * <PaymentMethodTabs value={method} onValueChange={setMethod} methods={['Tarjeta', 'Transferencia']} />
 */
export function PaymentMethodTabs({ value, onValueChange, methods }: PaymentMethodTabsProps) {
    return (
        <RadioGroup
            aria-label="Método de pago"
            orientation="horizontal"
            value={value}
            onValueChange={(next) => onValueChange(next as CheckoutPaymentMethod)}
            className="gap-4"
        >
            {methods.map((method) => (
                <RadioGroupItem
                    key={method}
                    variant="chip"
                    value={method}
                    className="h-control-lg px-inset-xl text-base"
                >
                    {METHOD_LABELS[method]}
                </RadioGroupItem>
            ))}
        </RadioGroup>
    );
}
