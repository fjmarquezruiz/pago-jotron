import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CloudinaryImage } from '@/components/ui/cloudinary-image';
import { productCardBadge, productCardPrice } from '@/lib/catalog/product-card';
import type { CatalogItem } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

/** Lo que la tarjeta necesita de un producto del listado (`CatalogItem`). */
export type ProductCardProduct = Pick<
    CatalogItem,
    'slug' | 'name' | 'originName' | 'image' | 'minPrice' | 'variantCount' | 'totalStock' | 'isNew'
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
 * Al pasar el ratón aparece sobre el borde inferior de la imagen un botón "Añadir" (como en el
 * diseño). Está deshabilitado y es solo decorativo: la tarjeta no sabe qué presentación elegir (un
 * producto puede tener varias, con su precio y su stock) y el carrito trabaja con presentaciones, así
 * que se añade desde la ficha. Va en un contenedor `aria-hidden` y sin eventos de puntero para que
 * no se anuncie un botón que no se puede usar ni intercepte el clic del enlace. Un producto
 * agotado no lo lleva.
 *
 * @example
 * <ProductCard product={item} priority={index < 4} />
 */
export function ProductCard({ product, priority, className }: ProductCardProps) {
    const { slug, name, originName, image, minPrice, variantCount, totalStock, isNew } = product;
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
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 bottom-0 left-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                    >
                        {/* TODO: activarlo cuando se decida cómo elegir la presentación desde la tarjeta (el carrito se llena desde la ficha). */}
                        <Button variant="brand" size="lg" className="w-full" tabIndex={-1} disabled>
                            Añadir
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
