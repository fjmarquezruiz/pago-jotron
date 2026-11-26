'use client';

import { useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import { AdminEmptyState } from '@/components/admin/admin-states';
import { AdminValuesTable } from '@/components/admin/admin-values-table';
import { ShippingTypeFormDialog } from '@/components/admin/shipping/shipping-type-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    shippingDeliveryText,
    shippingPriceText,
    shippingStatusLabel,
    shippingTypeNumber,
} from '@/lib/admin/shipping-types';
import type { AdminShippingTypeRow } from '@/lib/db/admin-shipping';

/** Qué modal está abierto: el de alta (`{}`) o el de edición de un tipo. */
type Dialog = { shippingType?: AdminShippingTypeRow };

/**
 * Contenido del listado de tipos de envío (Figma: admin-shipping-types-list; CU13): el botón
 * «Nuevo tipo de envío» y la tabla (ID, nombre, plazo, precio, estado y lápiz). Sin papelera (nunca
 * se borran), sin filtros, búsqueda ni paginación: son pocos. Desactivar un tipo se hace desde el
 * interruptor del modal de edición. Con la tabla vacía, el estado vacío común del panel.
 *
 * @param props.rows - Todos los tipos de envío.
 */
export function ShippingTypesView({ rows }: { rows: AdminShippingTypeRow[] }) {
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const close = () => setDialog(null);

    const modal = dialog && (
        <ShippingTypeFormDialog shippingType={dialog.shippingType} onClose={close} />
    );

    if (rows.length === 0)
        return (
            <>
                <AdminEmptyState
                    icon={<Truck />}
                    title="Todavía no hay tipos de envío"
                    description="Añade el primer tipo de envío para que los clientes puedan elegirlo en el checkout."
                    action={
                        <Button size="md" onClick={() => setDialog({})}>
                            <Plus />
                            Añadir el primer tipo de envío
                        </Button>
                    }
                />
                {modal}
            </>
        );

    return (
        <>
            <div className="flex items-center justify-end">
                <Button variant="default" size="xs" onClick={() => setDialog({})}>
                    Nuevo tipo de envío
                </Button>
            </div>
            <AdminValuesTable
                rows={rows}
                getRowKey={(type) => type.id}
                getRowName={(type) => type.name}
                onEdit={(type) => setDialog({ shippingType: type })}
                actionsWidth="w-35"
                columns={[
                    {
                        key: 'id',
                        header: 'ID',
                        width: 'w-35',
                        strong: true,
                        cell: (type) => shippingTypeNumber(type.id),
                    },
                    { key: 'name', header: 'Nombre', cell: (type) => type.name },
                    {
                        key: 'delivery',
                        header: 'Plazo de entrega',
                        width: 'w-70',
                        cell: (type) =>
                            shippingDeliveryText(type.minDeliveryDays, type.maxDeliveryDays),
                    },
                    {
                        key: 'price',
                        header: 'Precio',
                        width: 'w-35',
                        align: 'right',
                        cell: (type) => shippingPriceText(type.cost),
                    },
                    {
                        key: 'status',
                        header: 'Estado',
                        width: 'w-40',
                        align: 'center',
                        cell: (type) => (
                            <Badge tone={type.isBlocked ? 'neutral' : 'success'} variant="subtle">
                                {shippingStatusLabel(type.isBlocked)}
                            </Badge>
                        ),
                    },
                ]}
            />
            {modal}
        </>
    );
}
