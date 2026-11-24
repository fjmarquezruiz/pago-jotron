'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { DialogFrame, Strong } from '@/components/admin/admin-dialog-frame';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { otherRoles, selfChangeWarning } from '@/lib/admin/users';
import type { Role } from '@/types/auth';
import { changeAccessRequest } from './change-access-request';

export interface AdminUserActionsProps {
    userId: number;
    /** Nombre y apellidos, o el correo. */
    name: string;
    role: Role;
    isActive: boolean;
    /** Es el único administrador activo: cambiarle el rol o desactivarlo dejaría la tienda sin ninguno. */
    isLastAdmin: boolean;
    /** Es la cuenta de quien mira la ficha: al desactivarla o degradarla pierde el acceso al panel. */
    isSelf: boolean;
}

type Dialog =
    | { kind: 'role'; to: Role }
    | { kind: 'disable' }
    | { kind: 'last-admin'; of: 'role' | 'disable' };

/**
 * Botones de la ficha de un usuario (CU12): "Cambiar rol" (un menú con los otros roles; al elegir uno
 * sale el modal de confirmación), "Desactivar" (con su modal) o "Reactivar" (directo, sin modal:
 * es reversible y no tiene riesgo). Si la cuenta es la del último administrador, en vez de
 * confirmar se enseña el aviso "Siempre debe quedar al menos un administrador" (Figma:
 * admin-modal-last-admin); el servidor lo vuelve a comprobar y su 409 abre el mismo aviso.
 *
 * @param props - La cuenta y si es el último administrador.
 */
export function AdminUserActions({
    userId,
    name,
    role,
    isActive,
    isLastAdmin,
    isSelf,
}: AdminUserActionsProps) {
    const router = useRouter();
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [busy, setBusy] = useState(false);

    async function run(
        change: { role?: Role; isActive?: boolean },
        success: string,
        of: 'role' | 'disable',
    ) {
        if (busy) return;
        setBusy(true);
        const outcome = await changeAccessRequest(userId, change);
        setBusy(false);
        if (outcome.kind === 'last_admin') {
            setDialog({ kind: 'last-admin', of });
            return;
        }
        if (outcome.kind === 'error') {
            toast.error('No se ha podido guardar el cambio. Inténtalo de nuevo.');
            return;
        }
        setDialog(null);
        if (outcome.kind === 'rejected') toast.error(outcome.message);
        else toast.success(success);
        router.refresh();
    }

    // Aviso en vez de confirmación cuando ya se sabe que no se puede.
    const start = (next: Dialog) =>
        setDialog(
            isLastAdmin && next.kind !== 'last-admin'
                ? { kind: 'last-admin', of: next.kind === 'role' ? 'role' : 'disable' }
                : next,
        );

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="xs">
                        Cambiar rol
                        <ChevronDown aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {otherRoles(role).map((to) => (
                        <DropdownMenuItem key={to} onSelect={() => start({ kind: 'role', to })}>
                            {to}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {isActive ? (
                <Button variant="destructive" size="xs" onClick={() => start({ kind: 'disable' })}>
                    Desactivar
                </Button>
            ) : (
                <Button
                    variant="outline"
                    size="xs"
                    disabled={busy}
                    onClick={() => void run({ isActive: true }, 'Cuenta reactivada', 'disable')}
                >
                    Reactivar
                </Button>
            )}

            <AlertDialog
                open={dialog?.kind === 'role'}
                onOpenChange={(next) => !busy && !next && setDialog(null)}
            >
                {dialog?.kind === 'role' && (
                    <DialogFrame
                        title="¿Cambiar el rol?"
                        busy={busy}
                        footer={
                            <>
                                <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={busy}
                                    onClick={(event) => {
                                        // Radix cierra el diálogo al pulsar la acción: se cierra solo cuando acaba.
                                        event.preventDefault();
                                        void run({ role: dialog.to }, 'Rol actualizado', 'role');
                                    }}
                                    className={buttonVariants({ variant: 'default' })}
                                >
                                    Guardar rol
                                </AlertDialogAction>
                            </>
                        }
                    >
                        <AlertDialogDescription asChild>
                            <div className="flex flex-col gap-gap-lg text-sm text-foreground">
                                <p>
                                    <Strong>{name}</Strong> pasará de {role} a{' '}
                                    <Strong>{dialog.to}</Strong>.
                                </p>
                                {isSelf && selfChangeWarning(dialog.to) && (
                                    <p>{selfChangeWarning(dialog.to)}</p>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </DialogFrame>
                )}
            </AlertDialog>

            <AlertDialog
                open={dialog?.kind === 'disable'}
                onOpenChange={(next) => !busy && !next && setDialog(null)}
            >
                {dialog?.kind === 'disable' && (
                    <DialogFrame
                        title="¿Desactivar usuario?"
                        busy={busy}
                        footer={
                            <>
                                <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={busy}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        void run(
                                            { isActive: false },
                                            'Cuenta desactivada',
                                            'disable',
                                        );
                                    }}
                                    className={buttonVariants({ variant: 'destructive' })}
                                >
                                    Desactivar usuario
                                </AlertDialogAction>
                            </>
                        }
                    >
                        <AlertDialogDescription asChild>
                            <div className="flex flex-col gap-gap-lg text-sm text-foreground">
                                <p>
                                    ¿Seguro que quieres desactivar la cuenta de{' '}
                                    <span className="font-bold">{name}</span>? Esta persona ya no
                                    podrá iniciar sesión ni realizar pedidos.
                                </p>
                                <p>
                                    Esta acción se puede revertir: puedes volver a activar la cuenta
                                    cuando quieras.
                                </p>
                                {isSelf && <p>{selfChangeWarning('disable')}</p>}
                            </div>
                        </AlertDialogDescription>
                    </DialogFrame>
                )}
            </AlertDialog>

            <AlertDialog
                open={dialog?.kind === 'last-admin'}
                onOpenChange={(next) => !next && setDialog(null)}
            >
                {dialog?.kind === 'last-admin' && (
                    <DialogFrame
                        title={
                            dialog.of === 'role'
                                ? 'No se puede cambiar el rol'
                                : 'No se puede desactivar'
                        }
                        footer={
                            <AlertDialogCancel className={buttonVariants({ variant: 'default' })}>
                                Entendido
                            </AlertDialogCancel>
                        }
                    >
                        <AlertDialogDescription className="text-sm text-foreground">
                            Siempre debe quedar al menos un administrador. Da el rol de
                            administrador a otra persona antes de{' '}
                            {dialog.of === 'role' ? 'cambiar el tuyo' : 'desactivar tu cuenta'}.
                        </AlertDialogDescription>
                    </DialogFrame>
                )}
            </AlertDialog>
        </>
    );
}
