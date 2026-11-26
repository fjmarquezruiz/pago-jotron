'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Strong } from '@/components/admin/admin-dialog-frame';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { AdminValuesTable } from '@/components/admin/admin-values-table';
import { SalesStatusBadge } from '@/components/admin/wineries/winery-status-badge';
import { wineryRequest } from '@/components/admin/wineries/winery-requests';
import { toast } from '@/components/ui/toast';
import { wineryHref, wineryNumber } from '@/lib/admin/wineries';
import type { AdminWineriesPage } from '@/lib/db/admin-wineries';

type Row = AdminWineriesPage['items'][number];

/**
 * Tabla del listado de bodegas (Figma: wineries-table de wineries-list): ID, Bodega, Región,
 * Número de vinos, Estado y Acciones, con las columnas de 110 / resto / 240 / 140 / 120 / 100 px.
 * El lápiz lleva a la ficha. La papelera solo sale en las bodegas sin productos y, tras confirmar,
 * borra la fila; una con productos se da de baja bloqueando sus ventas, no borrándola. Sobre
 * `AdminValuesTable`.
 *
 * @param props.rows - Las bodegas de la página (`getAdminWineriesPage`).
 */
export function AdminWineriesTable({ rows }: { rows: readonly Row[] }) {
    const router = useRouter();
    const [toDelete, setToDelete] = useState<Row | null>(null);
    const [busy, setBusy] = useState(false);

    async function remove(row: Row) {
        if (busy) return;
        setBusy(true);
        const outcome = await wineryRequest(`/api/admin/bodegas/${row.id}`, 'DELETE');
        setBusy(false);
        if (outcome.kind === 'ok') toast.success('Bodega eliminada');
        else if (outcome.kind === 'rejected') toast.error(outcome.message);
        else {
            toast.error('No se ha podido eliminar la bodega. Inténtalo de nuevo.');
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
                editHref={(row) => wineryHref(row.id)}
                onDelete={setToDelete}
                canDelete={(row) => row.productCount === 0}
                columns={[
                    {
                        key: 'id',
                        header: 'ID',
                        width: 'w-27.5',
                        strong: true,
                        cell: (row) => wineryNumber(row.id),
                    },
                    { key: 'name', header: 'Bodega', cell: (row) => row.name },
                    {
                        key: 'city',
                        header: 'Región',
                        width: 'w-60',
                        cell: (row) => row.city ?? '—',
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
                title="Eliminar bodega"
                confirmLabel="Eliminar"
                tone="destructive"
                busy={busy}
                onConfirm={() => toDelete && void remove(toDelete)}
            >
                <p>
                    La bodega <Strong>{toDelete?.name}</Strong> se borrará de forma definitiva. No
                    tiene productos.
                </p>
            </AdminConfirmDialog>
        </>
    );
}
