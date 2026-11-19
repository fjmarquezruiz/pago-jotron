import { CheckoutSteps } from '@/components/shop/checkout-steps';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Esqueleto de la página Confirmar mientras llega el pedido (o, en el rechazo, el carrito y la
 * cuenta): los pasos, el título y la tarjeta de resultado y el resumen con sus medidas reales
 * (Figma: 2/3 + 1/3, 972 px de alto en escritorio), para que no haya salto al llegar los datos.
 *
 * @example
 * if (state.status === 'loading') return <ConfirmationSkeleton />;
 */
export function ConfirmationSkeleton() {
    return (
        <div aria-busy="true" className="flex flex-col gap-12">
            <span role="status" className="sr-only">
                Cargando tu pedido…
            </span>
            <CheckoutSteps current={3} />
            <h1 className="min-h-12 font-display text-4xl">Confirmar</h1>
            <div className="grid gap-x-16 gap-y-12 xl:grid-cols-3">
                <Skeleton className="h-96 rounded-sm xl:col-span-2 xl:h-243" />
                <Skeleton className="h-243 rounded-sm max-xl:h-96" />
            </div>
        </div>
    );
}
