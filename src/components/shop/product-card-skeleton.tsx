import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Esqueleto de una `ProductCard` mientras llegan los productos. Misma caja, relleno, huecos y
 * tamaño de imagen que la tarjeta real (compacta bajo 640 px y grande desde 640 px) para que la
 * rejilla no se mueva al cargar. No se anuncia a los lectores de pantalla: lo anuncia la región
 * que lo contiene.
 *
 * @example
 * <ProductCardSkeleton />
 */
export function ProductCardSkeleton() {
    return (
        <Card
            variant="outlined"
            aria-hidden="true"
            className="w-full items-center gap-5 rounded-sm bg-transparent p-6 sm:gap-6 sm:p-8"
        >
            <div className="flex w-full flex-1 flex-col items-center gap-2.5">
                <Skeleton className="h-7 w-4/5 sm:h-8" />
                <Skeleton variant="text" className="h-5 w-1/2" />
            </div>
            <Skeleton className="h-7 w-24" />
            <Skeleton className="aspect-square max-h-60 w-full max-w-60 sm:max-h-72 sm:max-w-72" />
        </Card>
    );
}
