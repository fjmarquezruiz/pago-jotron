import { cn } from '@/lib/utils';

/**
 * Caja del detalle de un pedido en el panel (Figma: admin-order-detail): borde de 1 px, sin fondo,
 * 24 px de relleno y título de 18 px. Es distinta de la tarjeta `bg-muted` de la cuenta del cliente.
 *
 * @param props.title - Título de la caja.
 * @param props.titleId - `id` del título, para el `aria-labelledby`.
 */
export function AdminOrderBox({
    title,
    titleId,
    className,
    children,
}: {
    title: string;
    titleId: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            aria-labelledby={titleId}
            className={cn('flex flex-col gap-5 rounded-sm border border-border p-6', className)}
        >
            <h2 id={titleId} className="flex min-h-8 items-center text-lg font-medium">
                {title}
            </h2>
            {children}
        </section>
    );
}
