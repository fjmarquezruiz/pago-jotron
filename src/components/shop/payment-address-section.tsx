'use client';

import Link from 'next/link';
import { AddressCardGroup } from '@/components/shop/address-card';
import { CheckoutSection } from '@/components/shop/checkout-section';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { UserAddress } from '@/lib/db/queries';

interface PaymentAddressSectionProps {
    /** Direcciones vigentes de la cuenta. */
    addresses: readonly UserAddress[];
    /** Dirección de envío elegida en Datos. */
    shippingAddressId: number | null;
    onShippingChange: (id: number) => void;
    /** Casilla "la facturación es la misma que el envío". */
    billingSameAsShipping: boolean;
    onBillingSameChange: (same: boolean) => void;
    /** Dirección de facturación elegida; solo cuenta con la casilla desmarcada. */
    billingAddressId: number | null;
    onBillingChange: (id: number) => void;
}

/**
 * Bloque "Dirección de envío" de Pago (Figma: sumary-blocks): la casilla de facturación y las
 * tarjetas de dirección seleccionables, las mismas que en Datos. Lo que se cambia aquí actualiza el
 * almacén del checkout (lo hace quien lo pinta con los callbacks).
 *
 * Con la casilla desmarcada el diseño no dibuja nada más. Decisión conservadora: debajo aparece un
 * segundo grupo "Dirección de facturación" con SOLO las direcciones de tipo Facturación (el
 * servidor exige ese tipo para la facturación, `createOrder`). Si no hay ninguna, se avisa y se
 * remite a Datos, donde se pueden añadir.
 *
 * La tarjeta "Añadir nueva dirección" del diseño no se pinta aquí: crear direcciones es cosa del
 * paso Datos (su formulario es suyo) y en Pago no hay dónde abrirlo.
 *
 * @example
 * <PaymentAddressSection addresses={addresses} shippingAddressId={3} onShippingChange={select}
 *     billingSameAsShipping onBillingSameChange={setSame} billingAddressId={null} onBillingChange={selectBilling} />
 */
export function PaymentAddressSection({
    addresses,
    shippingAddressId,
    onShippingChange,
    billingSameAsShipping,
    onBillingSameChange,
    billingAddressId,
    onBillingChange,
}: PaymentAddressSectionProps) {
    const billingAddresses = addresses.filter(({ addressType }) => addressType === 'Facturación');
    return (
        <CheckoutSection title="Dirección de envío">
            <div className="flex min-h-6 items-center gap-2.5">
                <Checkbox
                    size="lg"
                    id="pago-facturacion-igual"
                    checked={billingSameAsShipping}
                    onCheckedChange={(checked) => onBillingSameChange(checked === true)}
                />
                <Label htmlFor="pago-facturacion-igual">
                    La dirección de facturación es la misma que la de envío
                </Label>
            </div>
            <AddressCardGroup
                aria-label="Dirección de envío"
                addresses={addresses}
                value={shippingAddressId}
                onValueChange={onShippingChange}
            />
            {!billingSameAsShipping && (
                <div className="flex flex-col gap-6">
                    <h3 className="text-base font-medium">Dirección de facturación</h3>
                    {billingAddresses.length > 0 ? (
                        <AddressCardGroup
                            aria-label="Dirección de facturación"
                            addresses={billingAddresses}
                            value={billingAddressId}
                            onValueChange={onBillingChange}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No tienes ninguna dirección de facturación guardada. Puedes añadirla en{' '}
                            <Link
                                href="/checkout"
                                className="font-medium text-foreground underline"
                            >
                                Datos
                            </Link>
                            .
                        </p>
                    )}
                </div>
            )}
        </CheckoutSection>
    );
}
