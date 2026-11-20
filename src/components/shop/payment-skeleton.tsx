import { CheckoutSteps } from '@/components/shop/checkout-steps';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Esqueleto de Pago mientras se recuperan las elecciones del checkout, el carrito y las
 * direcciones (y mientras se redirige si falta algo, para que no haya parpadeo): los pasos, el
 * título, el selector de método, dos bloques y el resumen, con las medidas de la página real.
 *
 * @example
 * if (!ready) return <PaymentSkeleton />;
 */
export function PaymentSkeleton() {
    return (
        <div aria-busy="true" className="flex flex-col gap-12">
            <h1 className="sr-only">Pago</h1>
            <span role="status" className="sr-only">
                Cargando el pago…
            </span>
            <CheckoutSteps current={2} />
            <Skeleton className="h-10 w-40" />
            <div className="grid gap-x-16 gap-y-12 xl:grid-cols-3">
                <div className="flex flex-col gap-12 xl:col-span-2">
                    <div className="flex gap-4">
                        <Skeleton className="h-12 w-44 rounded-sm" />
                        <Skeleton className="h-12 w-56 rounded-sm" />
                    </div>
                    <Skeleton className="h-74 rounded-sm" />
                    <Skeleton className="h-103 rounded-sm" />
                </div>
                <Skeleton className="h-177 max-w-120 rounded-sm max-xl:h-96" />
            </div>
        </div>
    );
}
