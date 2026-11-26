import { cn } from '@/lib/utils';

/**
 * Caja de un formulario del panel (Figma: AdminBox con _AdminBoxHeader de admin-form-template):
 * borde de 1 px, sin fondo, 24 px de relleno, 20 px entre cabecera y contenido, título de 18 px en
 * una cabecera de 32 px de alto y, si hace falta, un botón a la derecha (por ejemplo «Añadir»).
 *
 * @param props.title - Título de la caja.
 * @param props.titleId - `id` del título, para el `aria-labelledby`.
 * @param props.action - Botón de la cabecera (Figma: Button xs de «Añadir presentación»).
 * @param props.className - Para colocarla en la rejilla de `AdminFormPage` (`lg:col-span-2`…).
 */
export function AdminBox({
    title,
    titleId,
    action,
    className,
    children,
}: {
    title: string;
    titleId: string;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            aria-labelledby={titleId}
            className={cn('flex flex-col gap-5 rounded-sm border border-border p-6', className)}
        >
            <div className="flex min-h-8 items-center gap-gap-md">
                <h2 id={titleId} className="min-w-0 flex-1 text-lg font-medium">
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}
