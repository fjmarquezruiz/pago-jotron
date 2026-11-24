import {
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';

/** Texto en negrita dentro de la frase de un modal. */
export const Strong = ({ children }: { children: React.ReactNode }) => (
    <span className="font-semibold">{children}</span>
);

/**
 * Cabecera, cuerpo y pie de los modales del panel (Figma: admin-order-status-modal y
 * admin-order-cancel-modal): 480 px, título de 18 px, cerrar de 36 px a 24 px del borde, cuerpo de
 * 14 px con 24 px de relleno y pie con 24 px abajo.
 */
export function DialogFrame({
    title,
    busy = false,
    children,
    footer,
}: {
    title: string;
    /** Mientras se guarda no se puede cerrar con la X. */
    busy?: boolean;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    return (
        <AlertDialogContent className="max-w-120 gap-0 overflow-clip rounded-sm p-0">
            <AlertDialogHeader className="relative flex-row items-center gap-gap-md border-b py-inset-lg pr-16 pl-inset-xl">
                <AlertDialogTitle className="text-lg font-medium">{title}</AlertDialogTitle>
                <AlertDialogCancel
                    aria-label="Cerrar"
                    disabled={busy}
                    className="absolute top-4 right-6 size-control-sm border-0 p-0 text-foreground"
                >
                    <X aria-hidden="true" className="size-4" />
                </AlertDialogCancel>
            </AlertDialogHeader>
            <div className="flex flex-col gap-gap-lg p-inset-xl text-sm text-foreground">
                {children}
            </div>
            <AlertDialogFooter className="flex-row justify-end gap-gap-md border-t px-inset-xl pt-inset-lg pb-inset-xl">
                {footer}
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}
