'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminBox } from '@/components/admin/admin-box';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { Strong } from '@/components/admin/admin-dialog-frame';
import { AdminFormPage } from '@/components/admin/admin-form-page';
import { AdminValuesTable } from '@/components/admin/admin-values-table';
import { GrapeFields } from '@/components/admin/grapes/grape-fields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { salesStatusLabel } from '@/lib/admin/catalog';
import { ADMIN_GRAPES_PATH, canDeleteGrape } from '@/lib/admin/grapes';
import { valueRequest } from '@/lib/admin/value-request';
import type { AdminGrapeRow, GrapeWine } from '@/lib/db/admin-grapes';
import { grapeSchema, type GrapeInput } from '@/lib/validations/admin-grapes';

/**
 * Ficha de una variedad de uva (Figma: grape-variety-detail; CU9): la plantilla de formulario del
 * panel con «Información básica» (nombre y color, los únicos campos de `grapes`), «Eliminar» solo si
 * ningún producto la usa, y la tabla de los vinos que la usan. Guarda con `PATCH /api/admin/uvas/[id]`
 * y refresca.
 *
 * Del diseño quedan fuera los campos que la BD no guarda (sinónimos, perfil de color, maduración,
 * descripción, clima y D.O. que la autorizan) y, de la tabla, el precio y las existencias, que son
 * de cada presentación.
 *
 * @param props.grape - La uva con el número de vinos que la usan.
 * @param props.wines - Los productos que la usan.
 */
export function GrapeDetail({ grape, wines }: { grape: AdminGrapeRow; wines: GrapeWine[] }) {
    const router = useRouter();
    const formId = useId();
    const [saving, setSaving] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const {
        register,
        control,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isDirty },
    } = useForm<GrapeInput>({
        resolver: zodResolver(grapeSchema),
        defaultValues: { name: grape.name, color: grape.color },
    });
    const deletable = canDeleteGrape(grape.wineCount);

    const save = async (values: GrapeInput) => {
        if (saving) return;
        setSaving(true);
        const outcome = await valueRequest(`/api/admin/uvas/${grape.id}`, 'PATCH', values);
        setSaving(false);
        if (outcome.kind === 'ok') {
            toast.success('Variedad actualizada');
            reset(values);
            router.refresh();
        } else if (outcome.kind === 'rejected' && outcome.status === 409) {
            setError('name', { message: outcome.message });
        } else if (outcome.kind === 'rejected') {
            toast.error(outcome.message);
        } else {
            toast.error('No se ha podido guardar la variedad. Inténtalo de nuevo.');
        }
    };

    const remove = async () => {
        if (saving) return;
        setSaving(true);
        const outcome = await valueRequest(`/api/admin/uvas/${grape.id}`, 'DELETE');
        setSaving(false);
        if (outcome.kind === 'error') {
            toast.error('No se ha podido eliminar la variedad. Inténtalo de nuevo.');
            return;
        }
        setConfirming(false);
        if (outcome.kind === 'rejected') {
            toast.error(outcome.message);
            router.refresh();
            return;
        }
        toast.success('Variedad eliminada');
        router.push(ADMIN_GRAPES_PATH);
        router.refresh();
    };

    return (
        <>
            <AdminFormPage
                breadcrumb={[
                    { label: 'Variedades de uva', href: ADMIN_GRAPES_PATH },
                    { label: grape.name },
                ]}
                title={grape.name}
                formId={formId}
                onSubmit={handleSubmit(save)}
                cancelHref={ADMIN_GRAPES_PATH}
                saveDisabled={!isDirty}
                saving={saving}
                extraActions={
                    deletable && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="xs"
                            onClick={() => setConfirming(true)}
                        >
                            Eliminar
                        </Button>
                    )
                }
            >
                <AdminBox
                    title="Información básica"
                    titleId="grape-basics"
                    className="lg:col-span-2"
                >
                    <div className="grid grid-cols-1 gap-gap-md md:grid-cols-3">
                        <GrapeFields register={register} control={control} errors={errors} />
                    </div>
                </AdminBox>
                <AdminBox
                    title={`Vinos que utilizan esta variedad (${wines.length})`}
                    titleId="grape-wines"
                    className="lg:col-span-2"
                >
                    {wines.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Ningún producto usa todavía esta variedad.
                        </p>
                    ) : (
                        <AdminValuesTable
                            rows={wines}
                            getRowKey={(wine) => wine.id}
                            getRowName={(wine) => wine.name}
                            columns={[
                                { key: 'name', header: 'Vino', cell: (wine) => wine.name },
                                { key: 'winery', header: 'Bodega', cell: (wine) => wine.winery },
                                {
                                    key: 'typology',
                                    header: 'Tipo',
                                    cell: (wine) => wine.typology,
                                },
                                {
                                    key: 'status',
                                    header: 'Estado',
                                    cell: (wine) => (
                                        <Badge tone={wine.isBlocked ? 'destructive' : 'success'}>
                                            {salesStatusLabel(wine.isBlocked)}
                                        </Badge>
                                    ),
                                },
                            ]}
                        />
                    )}
                </AdminBox>
            </AdminFormPage>
            <AdminConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title="Eliminar variedad de uva"
                confirmLabel="Eliminar"
                busy={saving}
                onConfirm={() => void remove()}
            >
                <p>
                    La variedad <Strong>{grape.name}</Strong> se eliminará del catálogo.
                </p>
                <p>
                    Ningún producto la usa, así que no cambia ninguna ficha. Esta acción no se puede
                    deshacer.
                </p>
            </AdminConfirmDialog>
        </>
    );
}
