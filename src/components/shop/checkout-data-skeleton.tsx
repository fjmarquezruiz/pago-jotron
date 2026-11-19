import { CheckoutSteps } from '@/components/shop/checkout-steps';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Esqueleto de la página "Datos" mientras se recuperan el carrito y las elecciones del checkout y
 * se cargan la cuenta y las líneas: los pasos, el título, los dos bloques del formulario y el
 * resumen, con las medidas de Figma (452 y 412 px de alto; el resumen como el del carrito) para
 * que no haya salto al llegar los datos.
 *
 * @example
 * if (!ready) return <CheckoutDataSkeleton />;
 */
export function CheckoutDataSkeleton() {
    return (
        <div aria-busy="true" className="flex flex-col gap-12">
            <h1 className="sr-only">Datos</h1>
            <span role="status" className="sr-only">
                Cargando tus datos…
            </span>
            <CheckoutSteps current={1} />
            <Skeleton className="h-10 w-72" />
            <div className="grid gap-x-16 gap-y-12 xl:grid-cols-3">
                <div className="flex flex-col gap-12 xl:col-span-2">
                    <Skeleton className="h-113 rounded-sm max-sm:h-160" />
                    <Skeleton className="h-103 rounded-sm" />
                </div>
                <Skeleton className="h-177 max-w-120 rounded-sm max-xl:h-96" />
            </div>
        </div>
    );
}
