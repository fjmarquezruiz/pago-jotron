'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Wine } from 'lucide-react';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { Strong } from '@/components/admin/admin-dialog-frame';
import { AdminEmptyState } from '@/components/admin/admin-states';
import { AdminValuesTable } from '@/components/admin/admin-values-table';
import { TypologyFilters } from '@/components/admin/typologies/typology-filters';
import { TypologyFormDialog } from '@/components/admin/typologies/typology-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
    ADMIN_TYPOLOGIES_PATH,
    canDeleteTypology,
    formatTaxRate,
    typologyNumber,
    type AdminTypologyFilters,
} from '@/lib/admin/typologies';
import { valueRequest } from '@/lib/admin/value-request';
import type { AdminTypologyRow } from '@/lib/db/admin-typologies';

type Dialog =
    { kind: 'form'; typology?: AdminTypologyRow } | { kind: 'delete'; typology: AdminTypologyRow };

/**
 * Contenido del listado de tipologías (Figma: typologies-list; CU9): la barra de filtros, la tabla
 * (ID, nombre, tipo de producto, nº de productos, orden en filtros e IVA) con el lápiz que abre el
 * modal de edición y la papelera solo en las tipologías que ningún producto usa, y el pie. Los
 * modales de alta, edición y baja viven aquí.
 *
 * El diseño no tiene estado vacío ni modal propios: se usan el estado vacío común del panel y el
 * marco del modal de uvas.
 *
 * @param props.rows - Las tipologías, ya filtradas.
 * @param props.filters - Filtros vigentes, ya saneados.
 * @param props.overall - Tipologías que hay sin filtrar (0 = estado vacío).
 * @param props.summary - Pie de la tabla (`adminTypologiesRangeText`).
 */
export function TypologiesView({
    rows,
    filters,
    overall,
    summary,
}: {
    rows: AdminTypologyRow[];
    filters: AdminTypologyFilters;
    overall: number;
    summary: string;
}) {
    const router = useRouter();
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [busy, setBusy] = useState(false);
    const close = () => setDialog(null);

    const remove = async (typology: AdminTypologyRow) => {
        if (busy) return;
        setBusy(true);
        const outcome = await valueRequest(`/api/admin/tipologias/${typology.id}`, 'DELETE');
        setBusy(false);
        if (outcome.kind === 'error') {
            toast.error('No se ha podido eliminar la tipología. Inténtalo de nuevo.');
            return;
        }
        close();
        if (outcome.kind === 'rejected') toast.error(outcome.message);
        else toast.success('Tipología eliminada');
        router.refresh();
    };

    const editing = dialog?.kind === 'form' ? dialog.typology : undefined;
    const dialogs = (
        <>
            {dialog?.kind === 'form' && (
                <TypologyFormDialog
                    typology={
                        editing && {
                            id: editing.id,
                            name: editing.name,
                            productType: editing.productType,
                            filterOrder: editing.filterOrder,
                            taxRate: Number(editing.taxRate),
                        }
                    }
                    onClose={close}
                />
            )}
            <AdminConfirmDialog
                open={dialog?.kind === 'delete'}
                onOpenChange={(open) => !open && close()}
                title="Eliminar tipología"
                confirmLabel="Eliminar"
                busy={busy}
                onConfirm={() => dialog?.kind === 'delete' && void remove(dialog.typology)}
            >
                <p>
                    La tipología{' '}
                    <Strong>{dialog?.kind === 'delete' ? dialog.typology.name : ''}</Strong> se
                    eliminará del catálogo y de los filtros de la tienda.
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
                    icon={<Wine />}
                    title="Todavía no hay tipologías"
                    description="Empieza añadiendo la primera tipología para poder clasificar tus productos y aplicarles su IVA."
                    action={
                        <Button size="md" onClick={() => setDialog({ kind: 'form' })}>
                            <Plus />
                            Añadir la primera tipología
                        </Button>
                    }
                />
                {dialogs}
            </>
        );

    return (
        <>
            <TypologyFilters filters={filters} onCreate={() => setDialog({ kind: 'form' })} />
            {rows.length === 0 ? (
                <AdminEmptyState
                    icon={<Wine />}
                    title="Ninguna tipología coincide con los filtros"
                    description="Prueba con otros filtros o límpialos para ver todas las tipologías."
                    action={
                        <Button asChild variant="outline" size="md">
                            <Link href={ADMIN_TYPOLOGIES_PATH}>Limpiar todo</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="flex flex-col gap-gap-md">
                    <AdminValuesTable
                        rows={rows}
                        getRowKey={(typology) => typology.id}
                        getRowName={(typology) => typology.name}
                        onEdit={(typology) => setDialog({ kind: 'form', typology })}
                        onDelete={(typology) => setDialog({ kind: 'delete', typology })}
                        canDelete={(typology) => canDeleteTypology(typology.productCount)}
                        columns={[
                            {
                                key: 'id',
                                header: 'ID',
                                width: 'w-27.5',
                                strong: true,
                                cell: (typology) => typologyNumber(typology.id),
                            },
                            {
                                key: 'name',
                                header: 'Nombre de la tipología',
                                cell: (typology) => typology.name,
                            },
                            {
                                key: 'type',
                                header: 'Tipo de producto',
                                width: 'w-40',
                                align: 'center',
                                cell: (typology) => (
                                    <Badge variant="outline" tone="neutral">
                                        {typology.productType}
                                    </Badge>
                                ),
                            },
                            {
                                key: 'products',
                                header: 'Nº de productos',
                                width: 'w-35',
                                align: 'right',
                                cell: (typology) => typology.productCount,
                            },
                            {
                                key: 'order',
                                header: 'Orden en filtros',
                                width: 'w-35',
                                align: 'right',
                                cell: (typology) => typology.filterOrder,
                            },
                            {
                                key: 'tax',
                                header: 'IVA',
                                width: 'w-25',
                                align: 'right',
                                cell: (typology) => formatTaxRate(typology.taxRate),
                            },
                        ]}
                    />
                    <p className="flex min-h-control-xs items-center text-xs text-muted-foreground">
                        {summary}
                    </p>
                </div>
            )}
            {dialogs}
        </>
    );
}
