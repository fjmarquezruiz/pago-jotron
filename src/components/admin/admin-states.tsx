'use client';

import { useRouter } from 'next/navigation';
import { Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StateBoxProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    actions?: React.ReactNode;
}

/**
 * Caja de estado de una lista del panel (Figma: admin-list-empty y admin-list-error): borde de 1 px,
 * al menos 640 px de alto, icono en un círculo de 80 px, título de 20 px, texto de 14 px y acciones.
 * No es el `EmptyState` del sistema de diseño (titular de 30 px en la fuente de titulares): el
 * panel usa su propio tamaño.
 */
function StateBox({ icon, title, description, actions }: StateBoxProps) {
    return (
        <div className="flex min-h-160 w-full flex-col items-center justify-center gap-6 rounded-sm border border-border p-6">
            <div className="flex w-full max-w-160 flex-col items-center justify-center gap-8">
                <div
                    aria-hidden="true"
                    className="flex size-20 items-center justify-center rounded-full bg-muted text-foreground [&_svg]:size-8"
                >
                    {icon ?? <Wine />}
                </div>
                <div className="flex w-full flex-col items-center justify-center gap-3 text-center">
                    <p className="w-full text-xl font-medium">{title}</p>
                    <p className="w-full text-sm text-muted-foreground">{description}</p>
                </div>
                {actions && (
                    <div className="flex w-full items-center justify-center gap-4">{actions}</div>
                )}
            </div>
        </div>
    );
}

/**
 * Lista sin datos (Figma: admin-list-empty): explica qué falta y ofrece crear el primero.
 *
 * @param props.title - Por ejemplo «No hay productos en tu catálogo».
 * @param props.description - Por ejemplo «Empieza a crear tu catálogo añadiendo tu primer producto.».
 * @param props.action - El botón que sale del vacío (`<Button><Plus />Añade tu primer producto</Button>`).
 * @param props.icon - Icono de Lucide; por defecto la copa.
 */
export function AdminEmptyState({
    title,
    description,
    action,
    icon,
}: {
    title: string;
    description: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return <StateBox icon={icon} title={title} description={description} actions={action} />;
}

/**
 * Lista que no se pudo cargar (Figma: admin-list-error). «Reintentar» vuelve a pedir la página
 * (`router.refresh()`) salvo que se pase `onRetry`. Sin «Contactar con soporte»: no hay página de
 * soporte a la que llevar.
 *
 * @param props.title - Por ejemplo «No se puede cargar el catálogo».
 * @param props.description - Texto de apoyo; por defecto el de Figma.
 * @param props.onRetry - Qué hace «Reintentar».
 */
export function AdminErrorState({
    title,
    description = 'Se ha producido un problema al conectar con el servidor de la base de datos. Comprueba tu conexión o contacta con un administrador.',
    onRetry,
}: {
    title: string;
    description?: string;
    onRetry?: () => void;
}) {
    const router = useRouter();
    return (
        <StateBox
            title={title}
            description={description}
            actions={
                <Button size="md" onClick={onRetry ?? (() => router.refresh())}>
                    Reintentar
                </Button>
            }
        />
    );
}
