import { Badge } from '@/components/ui/badge';
import { AdminValuesTable } from '@/components/admin/admin-values-table';
import {
    ADMIN_PRODUCTS_PATH,
    lowestPrice,
    presentationSummary,
    productNumber,
    productStockState,
    totalStock,
} from '@/lib/admin/products';
import { typologyTone } from '@/lib/catalog/typology-tone';
import type { AdminProductRow } from '@/lib/db/admin-products';
import { formatEuros } from '@/lib/utils';

/**
 * Tabla del listado de productos (Figma: «admin-list-template», la tabla de catálogo): ID,
 * Nombre, Presentación (en lugar del SKU, que no existe en la BD), Tipo, Denominación, Precio,
 * Existencias, Estado y Acciones. Sobre `AdminValuesTable`: el lápiz lleva al formulario; no hay
 * papelera, porque un producto no se borra, se bloquean sus ventas con el interruptor de Estado.
 *
 * Sin la columna Categoría del diseño (es del punto 3b). El precio es el de la presentación más
 * barata y las existencias, la suma de todas.
 *
 * @param props.rows - Los productos de la página (`getAdminProductsPage`).
 */
export function AdminProductsTable({ rows }: { rows: readonly AdminProductRow[] }) {
    return (
        <AdminValuesTable
            rows={rows}
            getRowKey={(row) => row.id}
            getRowName={(row) => row.name}
            editHref={(row) => `${ADMIN_PRODUCTS_PATH}/${row.id}`}
            columns={[
                {
                    key: 'id',
                    header: 'ID',
                    width: 'w-24',
                    strong: true,
                    cell: (row) => productNumber(row.id),
                },
                {
                    key: 'name',
                    header: 'Nombre',
                    cell: (row) => (row.vintage ? `${row.name} (${row.vintage})` : row.name),
                },
                {
                    key: 'presentation',
                    header: 'Presentación',
                    width: 'w-36',
                    cell: (row) => {
                        const summary = presentationSummary(row.variants);
                        return summary ? (
                            <span className="inline-flex items-center gap-gap-xs">
                                {summary.label}
                                {summary.more > 0 && (
                                    <Badge variant="outline" tone="neutral">
                                        +{summary.more}
                                    </Badge>
                                )}
                            </span>
                        ) : (
                            '—'
                        );
                    },
                },
                {
                    key: 'type',
                    header: 'Tipo',
                    width: 'w-32',
                    align: 'center',
                    cell: (row) => <Badge tone={typologyTone(row.typology)}>{row.typology}</Badge>,
                },
                {
                    key: 'guarantee',
                    header: 'Denominación',
                    width: 'w-36',
                    cell: (row) => row.guaranteeOfOrigin,
                },
                {
                    key: 'price',
                    header: 'Precio',
                    width: 'w-22',
                    align: 'right',
                    cell: (row) => {
                        const price = lowestPrice(row.variants);
                        return price === null ? '—' : formatEuros(price);
                    },
                },
                {
                    key: 'stock',
                    header: 'Existencias',
                    width: 'w-25',
                    align: 'right',
                    cell: (row) => totalStock(row.variants),
                },
                {
                    key: 'status',
                    header: 'Estado',
                    width: 'w-28',
                    align: 'center',
                    cell: (row) => {
                        const state = productStockState(row.isBlocked, row.variants);
                        return <Badge tone={state.tone}>{state.label}</Badge>;
                    },
                },
            ]}
        />
    );
}
