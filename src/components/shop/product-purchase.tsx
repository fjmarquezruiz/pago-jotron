'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { addToCartWithFeedback } from '@/components/shop/add-to-cart';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { NumberInput } from '@/components/ui/number-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatPresentation, pickDefaultVariant, soldOutMessage } from '@/lib/catalog/presentation';
import { formatEuros } from '@/lib/utils';
import type { ProductDetail } from '@/lib/db/queries';

export interface ProductPurchaseProps {
    /** Presentaciones a la venta del producto (`product.variants`), de menor a mayor capacidad. */
    variants: ProductDetail['variants'];
    /** Descripción del producto: se pinta encima del precio. */
    children?: React.ReactNode;
}

/**
 * Compra de la ficha de producto: descripción, precio de la presentación elegida, selector de
 * presentación, cantidad y botón. Es lo único de la ficha con estado.
 *
 * - Al abrir queda elegida la primera presentación con stock (`pickDefaultVariant`).
 * - La cantidad va de 1 al stock de la presentación y vuelve a 1 al cambiar de presentación.
 * - "Añadir al carrito" mete la cantidad elegida de esa presentación en el carrito, limitada al
 *   stock con el que se cargó la ficha (el servidor lo vuelve a comprobar). Un toast con la acción
 *   "Ver carrito" confirma, o avisa de que el stock ha limitado lo añadido (`describeAdd`).
 * - Si la presentación elegida está agotada, el botón dice "Agotado", la cantidad se desactiva y
 *   un aviso invita a elegir otro formato, o dice que no queda nada si todas están agotadas
 *   (`soldOutMessage`).
 *
 * Devuelve dos bloques sin envoltorio (descripción con precio, y selector con botón), para que
 * el contenedor de la ficha (columna con separación de 48 px) los separe como el resto.
 *
 * @example
 * <ProductPurchase variants={product.variants}>
 *     <p>{product.description}</p>
 * </ProductPurchase>
 */
export function ProductPurchase({ variants, children }: ProductPurchaseProps) {
    const [variantId, setVariantId] = React.useState(() => pickDefaultVariant(variants)?.id);
    const [quantity, setQuantity] = React.useState(1);
    const router = useRouter();

    const variant = variants.find((item) => item.id === variantId) ?? pickDefaultVariant(variants);
    if (!variant) return null;

    const soldOut = variant.stock === 0;
    const selectorLabelId = `presentation-label-${variant.productId}`;

    /** Cambia la presentación y vuelve la cantidad a 1: el stock de cada una es distinto. */
    function selectVariant(id: string) {
        setVariantId(Number(id));
        setQuantity(1);
    }

    /** Añade al carrito y avisa de lo que ha entrado, que el stock puede limitar. */
    function handleAdd() {
        if (!variant) return;
        addToCartWithFeedback({
            variantId: variant.id,
            quantity,
            stock: variant.stock,
            onViewCart: () => router.push('/carrito'),
        });
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                {children}
                <p aria-live="polite" className="font-display text-5xl leading-none">
                    {formatEuros(variant.price)}
                </p>
            </div>

            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                    <div className="flex flex-col gap-2 lg:min-w-0 lg:flex-1">
                        <span
                            id={selectorLabelId}
                            className="text-sm font-medium text-muted-foreground"
                        >
                            Presentación
                        </span>
                        <RadioGroup
                            orientation="horizontal"
                            aria-labelledby={selectorLabelId}
                            value={String(variant.id)}
                            onValueChange={selectVariant}
                            className="gap-3"
                        >
                            {variants.map((item) => (
                                <RadioGroupItem
                                    key={item.id}
                                    variant="chip"
                                    value={String(item.id)}
                                    className="flex-1 lg:flex-none"
                                >
                                    {formatPresentation(item)}
                                </RadioGroupItem>
                            ))}
                        </RadioGroup>
                    </div>

                    <Field className="gap-2 lg:w-40 lg:shrink-0">
                        <FieldLabel className="text-muted-foreground">Cantidad</FieldLabel>
                        <FieldControl>
                            <NumberInput
                                fluid
                                value={quantity}
                                onValueChange={setQuantity}
                                min={1}
                                max={variant.stock}
                                disabled={soldOut}
                            />
                        </FieldControl>
                    </Field>
                </div>

                <div className="flex flex-col gap-4">
                    <Button
                        variant="brand"
                        size="lg"
                        className="w-full"
                        disabled={soldOut}
                        onClick={handleAdd}
                    >
                        {soldOut ? 'Agotado' : 'Añadir al carrito'}
                    </Button>
                    {soldOut && (
                        <p className="text-sm leading-[normal] text-foreground">
                            {soldOutMessage(variants)}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
