import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { cn, formatEuros } from '@/lib/utils';

interface ProductCardProps {
    /** Nombre del producto. */
    name: string;
    /** Denominación de origen que se muestra bajo el nombre. */
    region: string;
    /** Precio en euros, como número o como el texto con el que Drizzle devuelve un `decimal`. */
    price: number | string;
    /** Ruta de la imagen (cuadrada). */
    image: string;
    /** Texto alternativo de la imagen. */
    alt: string;
    className?: string;
}

/**
 * Tarjeta de producto del catálogo (Figma: ProductCard): nombre, D.O., precio e imagen cuadrada
 * abajo, todo centrado. El nombre ocupa el alto sobrante para que las tarjetas de una misma fila
 * midan lo mismo aunque un nombre ocupe más líneas.
 *
 * Todavía no es un enlace: aún no hay consulta real que dé el slug de la ficha.
 *
 * @example
 * <ProductCard name="Payoya Negra" region="Sierras de Málaga" price={23.5} image="/images/placeholders/payoya-negra.png" alt="Payoya Negra" />
 */
export function ProductCard({ name, region, price, image, alt, className }: ProductCardProps) {
    // TODO: enlazar a /productos/[slug] cuando haya consulta real
    return (
        <Card
            variant="outlined"
            className={cn(
                'items-center gap-5 rounded-sm bg-transparent p-6 text-center lg:gap-6 lg:p-8',
                className,
            )}
        >
            <div className="flex w-full flex-1 flex-col items-center gap-2.5">
                <h3 className="text-xl lg:text-2xl">{name}</h3>
                <p className="text-sm text-muted-foreground">{region}</p>
            </div>
            <p className="text-lg font-medium">{formatEuros(price)}</p>
            <div className="flex w-full flex-col items-center overflow-clip">
                <div className="relative aspect-square w-full max-w-60 lg:max-w-72">
                    <Image
                        src={image}
                        alt={alt}
                        fill
                        sizes="(min-width: 1024px) 288px, 240px"
                        className="object-cover"
                    />
                </div>
            </div>
        </Card>
    );
}
