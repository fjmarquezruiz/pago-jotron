import { CheckoutSection } from '@/components/shop/checkout-section';
import { PaymentNotice } from '@/components/shop/payment-notice';

interface TransferDetailsProps {
    /** Titular de la cuenta (`getTransferDetails()`, del servidor). */
    holder: string;
    /** IBAN de la cuenta (`getTransferDetails()`, del servidor). */
    iban: string;
}

/**
 * Bloque "Datos para la transferencia" (Figma: sumary-blocks, variante transferencia): titular,
 * IBAN y concepto en una tabla de dos columnas y el aviso ámbar de que el pedido queda como
 * "Pendiente de pago" hasta que se confirme el cobro.
 *
 * El concepto es el literal del diseño, "Tu número de pedido": el número real no existe hasta
 * pulsar "Realizar pedido" y aparece en la confirmación.
 *
 * @example
 * <TransferDetails holder="Bodegas Jotrón S.L." iban="ES12 3456 7890 1234 5678 9012" />
 */
export function TransferDetails({ holder, iban }: TransferDetailsProps) {
    const rows = [
        { label: 'Titular:', value: holder },
        { label: 'IBAN:', value: iban },
        { label: 'Concepto:', value: 'Tu número de pedido' },
    ];
    return (
        <CheckoutSection title="Datos para la transferencia">
            <dl className="grid grid-cols-[auto_1fr] gap-4">
                {rows.map(({ label, value }) => (
                    <div key={label} className="col-span-2 grid grid-cols-subgrid">
                        <dt className="self-end text-sm font-medium text-muted-foreground">
                            {label}
                        </dt>
                        <dd className="text-base font-medium break-words">{value}</dd>
                    </div>
                ))}
            </dl>
            <PaymentNotice title="El pedido quedará como Pendiente de pago hasta que confirmemos el cobro.">
                Después lo preparamos y te avisamos por correo.
            </PaymentNotice>
        </CheckoutSection>
    );
}
