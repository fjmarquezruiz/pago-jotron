'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { Strong } from '@/components/admin/admin-dialog-frame';
import { AdminValuesTable } from '@/components/admin/admin-values-table';
import { denominationRequest } from '@/components/admin/denominations/denomination-requests';
import { SalesStatusBadge } from '@/components/admin/wineries/winery-status-badge';
import { toast } from '@/components/ui/toast';
import { denominationHref, denominationNumber } from '@/lib/admin/denominations';
import type { AdminDenominationsPage } from '@/lib/db/admin-denominations';

type Row = AdminDenominationsPage['items'][number];

/**
 * Tabla del listado de denominaciones (Figma: denominations-table de denominations-list): ID,
 * Nombre de la denominación, Clasificación, Región geográfica, Número de vinos, Estado y Acciones,
 * con las columnas de 110 / 372 / 130 / 372 / 140 / 120 / 100 px. El lápiz lleva a la ficha. La
 * papelera solo sale en las denominaciones sin productos y, tras confirmar, borra la fila; una con
 * productos se da de baja bloqueando sus ventas. Sobre `AdminValuesTable`.
 *
 * @param props.rows - Las denominaciones de la página (`getAdminDenominationsPage`).
 */
export function AdminDenominationsTable({ rows }: { rows: readonly Row[] }) {
    const router = useRouter();
    const [toDelete, setToDelete] = useState<Row | null>(null);
    const [busy, setBusy] = useState(false);

    async function remove(row: Row) {
        if (busy) return;
        setBusy(true);
        const outcome = await denominationRequest(`/api/admin/denominaciones/${row.id}`, 'DELETE');
        setBusy(false);
        if (outcome.kind === 'ok') toast.success('Denominación eliminada');
        else if (outcome.kind === 'rejected') toast.error(outcome.message);
        else {
            toast.error('No se ha podido eliminar la denominación. Inténtalo de nuevo.');
            return;
        }
        setToDelete(null);
        router.refresh();
    }

    return (
        <>
            <AdminValuesTable
                rows={rows}
                getRowKey={(row) => row.id}
                getRowName={(row) => row.name}
                editHref={(row) => denominationHref(row.id)}
                onDelete={setToDelete}
                canDelete={(row) => row.productCount === 0}
                columns={[
                    {
                        key: 'id',
                        header: 'ID',
                        width: 'w-27.5',
                        strong: true,
                        cell: (row) => denominationNumber(row.id),
                    },
                    {
                        key: 'name',
                        header: 'Nombre de la denominación',
                        width: 'w-93',
                        cell: (row) => row.name,
                    },
                    {
                        key: 'classification',
                        header: 'Clasificación',
                        width: 'w-32.5',
                        cell: (row) => row.classification,
                    },
                    {
                        key: 'region',
                        header: 'Región geográfica',
                        width: 'w-93',
                        cell: (row) => row.region ?? '—',
                    },
                    {
                        key: 'products',
                        header: 'Número de vinos',
                        width: 'w-35',
                        align: 'right',
                        cell: (row) => row.productCount,
                    },
                    {
                        key: 'status',
                        header: 'Estado',
                        width: 'w-30',
                        align: 'center',
                        cell: (row) => <SalesStatusBadge isBlocked={row.isBlocked} />,
                    },
                ]}
            />
            <AdminConfirmDialog
                open={toDelete !== null}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="Eliminar denominación de origen"
                confirmLabel="Eliminar"
                tone="destructive"
                busy={busy}
                onConfirm={() => toDelete && void remove(toDelete)}
            >
                <p>
                    La denominación <Strong>{toDelete?.name}</Strong> se borrará de forma
                    definitiva. No tiene productos.
                </p>
            </AdminConfirmDialog>
        </>
    );
}
