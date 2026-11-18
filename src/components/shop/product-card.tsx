import Link from 'next/link';
import { ProductCardAddButton } from '@/components/shop/product-card-add-button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CloudinaryImage } from '@/components/ui/cloudinary-image';
import { productCardBadge, productCardPrice } from '@/lib/catalog/product-card';
import type { CatalogItem } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

/** Lo que la tarjeta necesita de un producto del listado (`CatalogItem`). */
export type ProductCardProduct = Pick<
    CatalogItem,
    | 'slug'
    | 'name'
    | 'originName'
    | 'image'
    | 'minPrice'
    | 'variantCount'
    | 'firstVariantId'
    | 'totalStock'
    | 'isNew'
>;

interface ProductCardProps {
    /** Producto del listado, con su precio mínimo, número de presentaciones y stock total. */
    product: ProductCardProduct;
    /** Carga la imagen con prioridad: las primeras tarjetas del listado, que son el LCP. */
    priority?: boolean;
    className?: string;
}

const imageSizes = '(min-width: 640px) 288px, 240px';

/**
 * Tarjeta de producto del catálogo (Figma: ProductCard): nombre, D.O., un badge ("Agotado" o
 * "¡NUEVO!", si toca), precio e imagen cuadrada abajo, todo centrado. El bloque de texto ocupa el
 * alto sobrante para que las tarjetas de una misma fila midan lo mismo aunque un nombre ocupe
 * más líneas.
 *
 * Tiene dos tamaños, como en Figma: por debajo de 640 px (una tarjeta por fila) la compacta, con
 * 24 px de relleno, el nombre en xl y la imagen de 240 px como máximo; desde 640 px la grande, con
 * 32 px, el nombre en 2xl y la imagen de 288 px como máximo. La imagen tiene un alto máximo además
 * del ancho, para que la caja no crezca cuando la tarjeta ocupa todo el ancho.
 *
 * Toda la tarjeta enlaza a la ficha (`/productos/[slug]`) con un enlace estirado: el `Link` es el
 * nombre y su `::after` cubre la tarjeta, así el lector de pantalla anuncia un solo enlace con el
 * nombre del producto y el foco de teclado se dibuja alrededor de toda la tarjeta.
 *
 * Al pasar el ratón (o al enfocar con el teclado) aparece sobre el borde inferior de la imagen un
 * botón "Añadir" (como en el diseño): con una sola presentación la añade al carrito, y con varias
 * lleva a la ficha para elegir (`ProductCardAddButton`). Va por encima del enlace que cubre la
 * tarjeta, así su clic no abre la ficha. En pantallas táctiles no se ve ni recibe toques. Un
 * producto agotado no lo lleva.
 *
 * @example
 * <ProductCard product={item} priority={index < 4} />
 */
export function ProductCard({ product, priority, className }: ProductCardProps) {
    const {
        slug,
        name,
        originName,
        image,
        minPrice,
        variantCount,
        firstVariantId,
        totalStock,
        isNew,
    } = product;
    const badge = productCardBadge({ totalStock, isNew });

    return (
        <Card
            variant="outlined"
            className={cn(
                'group relative items-center gap-5 rounded-sm bg-transparent p-6 text-center has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring sm:gap-6 sm:p-8',
                className,
            )}
        >
            <div className="flex w-full flex-1 flex-col items-center gap-2.5">
                <h3 className="flex-1 text-xl break-words sm:text-2xl">
                    <Link
                        href={`/productos/${slug}`}
                        className="outline-none after:absolute after:inset-0 after:z-10"
                    >
                        {name}
                    </Link>
                </h3>
                <p className="text-sm text-muted-foreground">{originName}</p>
                {badge === 'sold-out' && <Badge>Agotado</Badge>}
                {badge === 'new' && <Badge tone="brand">¡NUEVO!</Badge>}
            </div>

            <p className="text-lg font-medium">{productCardPrice(minPrice, variantCount)}</p>

            <div className="relative flex w-full flex-col items-center overflow-clip">
                <div className="relative aspect-square max-h-60 w-full max-w-60 sm:max-h-72 sm:max-w-72">
                    {image && (
                        <CloudinaryImage
                            src={image}
                            alt={name}
                            fill
                            priority={priority}
                            sizes={imageSizes}
                            className="object-contain"
                        />
                    )}
                </div>
                {totalStock > 0 && (
                    <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        <ProductCardAddButton
                            slug={slug}
                            name={name}
                            variantCount={variantCount}
                            firstVariantId={firstVariantId}
                            stock={totalStock}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}
