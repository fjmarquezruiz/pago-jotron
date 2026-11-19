'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addToCartWithFeedback } from '@/components/shop/add-to-cart';
import { Button } from '@/components/ui/button';

interface ProductCardAddButtonProps {
    slug: string;
    name: string;
    /** Presentaciones a la venta del producto (`variantCount`). */
    variantCount: number;
    /** Id de la única presentación (`firstVariantId`); solo se usa si `variantCount` es 1. */
    firstVariantId: number;
    /** Stock del producto; con una sola presentación es el de esa presentación. */
    stock: number;
}

/**
 * Botón "Añadir" de la tarjeta de producto (Figma: ProductCard, al pasar el ratón).
 *
 * - Con una sola presentación, añade 1 unidad al carrito y sale el aviso con "Ver carrito".
 * - Con varias (por ejemplo, una caja de 500 g y otra de 1000 g, con distinto precio y stock),
 *   dice "Elegir formato" (no "Añadir": no añade nada, y el botón debe cumplir lo que promete) y
 *   lleva a la ficha: no se mete en el carrito algo que el cliente no ha elegido.
 *
 * En pantallas táctiles el botón no se ve (aparece al pasar el ratón o al enfocar) y no recibe
 * toques: quien toca una tarjeta entra en su ficha, como siempre.
 *
 * @example
 * <ProductCardAddButton slug="tinto-roble" name="Tinto Roble" variantCount={1} firstVariantId={4} stock={12} />
 */
export function ProductCardAddButton({
    slug,
    name,
    variantCount,
    firstVariantId,
    stock,
}: ProductCardAddButtonProps) {
    const router = useRouter();
    // Por encima del enlace que cubre la tarjeta; invisible y sin toques en pantallas táctiles.
    const className = 'pointer-events-auto w-full [@media(hover:none)]:pointer-events-none';

    if (variantCount > 1) {
        return (
            <Button asChild variant="brand" size="lg" className={className}>
                <Link href={`/productos/${slug}`} aria-label={`Elegir formato de ${name}`}>
                    Elegir formato
                </Link>
            </Button>
        );
    }

    return (
        <Button
            variant="brand"
            size="lg"
            className={className}
            aria-label={`Añadir ${name} al carrito`}
            onClick={() =>
                addToCartWithFeedback({
                    variantId: firstVariantId,
                    quantity: 1,
                    stock,
                    onViewCart: () => router.push('/carrito'),
                })
            }
        >
            Añadir
        </Button>
    );
}
