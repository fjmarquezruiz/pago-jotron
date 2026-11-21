import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ORDER_HISTORY_PATH } from '@/lib/orders/history-view';

/**
 * Historial sin filas. Sin filtros, la cuenta aún no tiene pedidos y se ofrece ir a comprar; con
 * filtros, ninguno encaja y se ofrece quitarlos ("Borrar todo").
 *
 * @param props.filtered - `true` si hay algún filtro puesto.
 */
export function OrderHistoryEmpty({ filtered }: { filtered: boolean }) {
    return (
        <EmptyState
            titleAs="h2"
            className="min-h-0 py-inset-2xl"
            title={filtered ? 'No hay pedidos con estos filtros' : 'Todavía no tienes pedidos'}
            action={
                filtered ? (
                    <Button asChild variant="outline">
                        <Link href={ORDER_HISTORY_PATH}>Borrar todo</Link>
                    </Button>
                ) : (
                    <Button asChild variant="brand">
                        <Link href="/productos">Explora nuestros vinos</Link>
                    </Button>
                )
            }
        />
    );
}
