import { Badge } from '@/components/ui/badge';
import { salesStatusLabel } from '@/lib/admin/catalog';

/**
 * Estado de venta de una fila de catálogo en las tablas (Figma: Estado de wineries-list): verde
 * suave si está a la venta y neutro suave si tiene las ventas bloqueadas. La etiqueta es la del
 * interruptor (`salesStatusLabel`): el diseño dice «Activo / Inactivo», el plan lo cambia por lo
 * que de verdad guarda `is_blocked`.
 *
 * @param props.isBlocked - `is_blocked` de la fila.
 */
export function SalesStatusBadge({ isBlocked }: { isBlocked: boolean }) {
    return (
        <Badge tone={isBlocked ? 'neutral' : 'success'} variant="subtle">
            {salesStatusLabel(isBlocked)}
        </Badge>
    );
}
