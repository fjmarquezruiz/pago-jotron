import * as React from 'react';
import { cn } from '@/lib/utils';

interface CheckoutSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
    /** Título del bloque, por ejemplo "Información de contacto". */
    title: React.ReactNode;
    /** Id del título: lo usa `aria-labelledby` de la sección. Si no se pasa, se genera uno. */
    titleId?: string;
}

/**
 * Bloque de formulario del checkout (Figma: sumary-blocks): borde de 1 px `border`, `rounded-sm`,
 * relleno de 40 px y 32 px entre sus partes, con el título en `h2` `text-xl` medium. No es una
 * `Card` (lleva `rounded-xl` y sombra): este bloque es plano.
 *
 * Es una `section` etiquetada por su título, así que los lectores de pantalla la anuncian como región.
 *
 * @example
 * <CheckoutSection title="Información de contacto">
 *     <div className="grid gap-6 sm:grid-cols-2">…campos…</div>
 * </CheckoutSection>
 */
export function CheckoutSection({
    title,
    titleId,
    className,
    children,
    ...props
}: CheckoutSectionProps) {
    const generated = React.useId();
    const id = titleId ?? generated;
    return (
        <section
            aria-labelledby={id}
            className={cn(
                'flex flex-col gap-8 rounded-sm border border-border p-10 max-sm:p-6',
                className,
            )}
            {...props}
        >
            <h2 id={id} className="text-xl font-medium">
                {title}
            </h2>
            {children}
        </section>
    );
}
