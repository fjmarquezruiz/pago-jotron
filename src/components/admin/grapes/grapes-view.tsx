'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Grape, Plus } from 'lucide-react';
import { Strong } from '@/components/admin/admin-dialog-frame';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { AdminEmptyState } from '@/components/admin/admin-states';
import { AdminValuesTable } from '@/components/admin/admin-values-table';
import { GrapeFilters } from '@/components/admin/grapes/grape-filters';
import { GrapeFormDialog } from '@/components/admin/grapes/grape-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
    ADMIN_GRAPES_PATH,
    canDeleteGrape,
    grapeColorTone,
    grapeNumber,
    type AdminGrapeFilters,
} from '@/lib/admin/grapes';
import { valueRequest } from '@/lib/admin/value-request';
import type { AdminGrapeRow } from '@/lib/db/admin-grapes';

type Dialog = { kind: 'form'; grape?: AdminGrapeRow } | { kind: 'delete'; grape: AdminGrapeRow };

/**
 * Contenido del listado de variedades de uva (Figma: grape-varieties-list y grape-varieties-empty;
 * CU9): la barra de filtros, la tabla (ID, nombre, color y número de vinos) con el lápiz que abre el
 * modal de edición y la papelera solo en las uvas que ningún producto usa, y el pie. Con la tabla
 * vacía, el estado vacío con «Añadir la primera variedad». Los modales de alta, edición y baja viven
 * aquí.
 *
 * Sin la columna «D.O. que la autorizan» del diseño: la BD no guarda qué D.O. autorizan cada uva.
 *
 * @param props.rows - Las uvas de la página.
 * @param props.filters - Filtros vigentes, ya saneados.
 * @param props.overall - Uvas que hay sin filtrar (0 = estado vacío).
 * @param props.footer - Pie de la tabla (rango y paginación), que pinta el servidor.
 */
export function GrapesView({
    rows,
    filters,
    overall,
    footer,
}: {
    rows: AdminGrapeRow[];
    filters: AdminGrapeFilters;
    overall: number;
    footer: React.ReactNode;
}) {
    const router = useRouter();
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [busy, setBusy] = useState(false);
    const close = () => setDialog(null);

    const remove = async (grape: AdminGrapeRow) => {
        if (busy) return;
        setBusy(true);
        const outcome = await valueRequest(`/api/admin/uvas/${grape.id}`, 'DELETE');
        setBusy(false);
        if (outcome.kind === 'error') {
            toast.error('No se ha podido eliminar la variedad. Inténtalo de nuevo.');
            return;
        }
        close();
        if (outcome.kind === 'rejected') toast.error(outcome.message);
        else toast.success('Variedad eliminada');
        router.refresh();
    };

    const dialogs = (
        <>
            {dialog?.kind === 'form' && <GrapeFormDialog grape={dialog.grape} onClose={close} />}
            <AdminConfirmDialog
                open={dialog?.kind === 'delete'}
                onOpenChange={(open) => !open && close()}
                title="Eliminar variedad de uva"
                confirmLabel="Eliminar"
                busy={busy}
                onConfirm={() => dialog?.kind === 'delete' && void remove(dialog.grape)}
            >
                <p>
                    La variedad{' '}
                    <Strong>{dialog?.kind === 'delete' ? dialog.grape.name : ''}</Strong> se
                    eliminará del catálogo.
                </p>
                <p>
                    Ningún producto la usa, así que no cambia ninguna ficha. Esta acción no se puede
                    deshacer.
                </p>
            </AdminConfirmDialog>
        </>
    );

    if (overall === 0)
        return (
            <>
                <AdminEmptyState
                    icon={<Grape />}
                    title="Todavía no hay variedades de uva"
                    description="Empieza a crear tu base de datos de variedades añadiendo la primera variedad de uva para vincularla a tus viñedos."
                    action={
                        <Button size="md" onClick={() => setDialog({ kind: 'form' })}>
                            <Plus />
                            Añadir la primera variedad
                        </Button>
                    }
                />
                {dialogs}
            </>
        );

    return (
        <>
            <GrapeFilters filters={filters} onCreate={() => setDialog({ kind: 'form' })} />
            {rows.length === 0 ? (
                <AdminEmptyState
                    icon={<Grape />}
                    title="Ninguna variedad coincide con los filtros"
                    description="Prueba con otros filtros o límpialos para ver todas las variedades de uva."
                    action={
                        <Button asChild variant="outline" size="md">
                            <Link href={ADMIN_GRAPES_PATH}>Limpiar todo</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="flex flex-col gap-gap-md">
                    <AdminValuesTable
                        rows={rows}
                        getRowKey={(grape) => grape.id}
                        getRowName={(grape) => grape.name}
                        onEdit={(grape) => setDialog({ kind: 'form', grape })}
                        onDelete={(grape) => setDialog({ kind: 'delete', grape })}
                        canDelete={(grape) => canDeleteGrape(grape.wineCount)}
                        columns={[
                            {
                                key: 'id',
                                header: 'ID',
                                width: 'w-27.5',
                                strong: true,
                                cell: (grape) => grapeNumber(grape.id),
                            },
                            {
                                key: 'name',
                                header: 'Nombre de la variedad',
                                cell: (grape) => (
                                    <Link
                                        href={`${ADMIN_GRAPES_PATH}/${grape.id}`}
                                        className="hover:underline"
                                    >
                                        {grape.name}
                                    </Link>
                                ),
                            },
                            {
                                key: 'color',
                                header: 'Color',
                                width: 'w-30',
                                align: 'center',
                                cell: (grape) => (
                                    <Badge tone={grapeColorTone(grape.color)}>{grape.color}</Badge>
                                ),
                            },
                            {
                                key: 'wines',
                                header: 'Número de vinos',
                                width: 'w-35',
                                align: 'right',
                                cell: (grape) => grape.wineCount,
                            },
                        ]}
                    />
                    {footer}
                </div>
            )}
            {dialogs}
        </>
    );
}
