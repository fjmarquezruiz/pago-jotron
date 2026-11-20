import { CheckoutSteps } from '@/components/shop/checkout-steps';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Esqueleto del carrito mientras se recupera de `localStorage` y se piden sus líneas al servidor:
 * los pasos, el título, tres filas de la tabla y el resumen, con las medidas de la página real
 * para que no haya salto al llegar los datos.
 *
 * @example
 * if (!hydrated) return <CartSkeleton />;
 */
export function CartSkeleton() {
    return (
        <div aria-busy="true" className="flex flex-col gap-12">
            <h1 className="sr-only">Tu carrito</h1>
            <span role="status" className="sr-only">
                Cargando tu carrito…
            </span>
            <CheckoutSteps />
            <Skeleton className="h-10 w-72" />
            <div className="grid gap-x-16 gap-y-12 xl:grid-cols-3">
                <div className="flex flex-col xl:col-span-2">
                    <Skeleton className="h-10 w-full rounded-none" />
                    {[0, 1, 2].map((row) => (
                        <div
                            key={row}
                            className="flex items-center gap-8 border-b p-8 max-xl:gap-4 max-xl:p-4"
                        >
                            <Skeleton className="size-20 shrink-0 rounded-sm" />
                            <div className="flex flex-1 flex-col gap-2">
                                <Skeleton variant="text" className="w-2/3" />
                                <Skeleton variant="text" className="w-1/2" />
                            </div>
                            <Skeleton className="h-12 w-34 max-xl:hidden" />
                            <Skeleton className="h-6 w-20 max-xl:hidden" />
                        </div>
                    ))}
                </div>
                <Skeleton className="h-177 max-w-120 rounded-sm max-xl:h-96" />
            </div>
        </div>
    );
}
