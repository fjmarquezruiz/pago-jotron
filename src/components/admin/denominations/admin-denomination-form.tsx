'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HouseHeart } from 'lucide-react';
import { AdminBox } from '@/components/admin/admin-box';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { Strong } from '@/components/admin/admin-dialog-frame';
import { AdminFormPage } from '@/components/admin/admin-form-page';
import { AdminSalesToggle } from '@/components/admin/admin-sales-toggle';
import { SalesBlockOrders } from '@/components/admin/sales-block-orders';
import { AdminValuesTable } from '@/components/admin/admin-values-table';
import { denominationRequest } from '@/components/admin/denominations/denomination-requests';
import { OrderHistoryPagination } from '@/components/orders/order-history-pagination';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel, FieldMessage } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import {
    ADMIN_DENOMINATIONS_PATH,
    CLASSIFICATIONS,
    denominationHref,
} from '@/lib/admin/denominations';
import { adminWineriesRangeText, wineryHref, wineryNumber } from '@/lib/admin/wineries';
import type { AdminDenomination } from '@/lib/db/admin-denominations';
import {
    denominationFormSchema,
    EMPTY_DENOMINATION_FORM,
    type DenominationFormValues,
    type DenominationInput,
} from '@/lib/validations/admin-denominations';

/** Las bodegas relacionadas de una página de la ficha (`getDenominationWineriesPage`). */
export interface DenominationRelatedWineries {
    items: readonly { id: number; name: string; city: string | null; productCount: number }[];
    total: number;
    page: number;
    totalPages: number;
    pageSize: number;
}

export interface AdminDenominationFormProps {
    /** La denominación que se edita (`getAdminDenomination`); sin ella es el alta. */
    data?: AdminDenomination;
    /** Su tabla «Bodegas relacionadas»; solo en la ficha. */
    related?: DenominationRelatedWineries;
    /** Es administrador: solo él ve el interruptor de Estado (la API también lo exige). */
    canBlock?: boolean;
}

/** Etiqueta con «Opcional» a la derecha, en `muted-foreground` (Figma: FormLabel). */
const labelClassName = 'w-full text-muted-foreground [&>span]:ml-auto';

/** Valores del formulario a partir de la fila de la BD (los `NULL` son textos vacíos). */
function toFormValues(row: AdminDenomination['denomination']): DenominationFormValues {
    return {
        name: row.name,
        foundedYear: row.foundedYear === null ? '' : String(row.foundedYear),
        classification: row.classification,
        regulatoryCouncil: row.regulatoryCouncil ?? '',
        region: row.region ?? '',
        website: row.website ?? '',
        description: row.description ?? '',
    };
}

/**
 * Formulario de alta y de ficha de una denominación de origen (Figma: denominations-create y
 * denominations-detail; CU9), sobre `AdminFormPage`. Una caja «Información básica» con los campos
 * de `guarantees_of_origin` (nombre, año de fundación, clasificación, consejo regulador, región
 * geográfica, sitio web y descripción) en dos columnas de 624 px separadas 48 px. El diseño
 * dibuja además «Variedades de uva autorizadas»: la BD no tiene esa relación y no se añade.
 *
 * En la ficha, además: el interruptor de Estado (solo administrador; pide confirmación al
 * bloquear), «Eliminar» (solo si no tiene productos) y la caja «Bodegas relacionadas» con las
 * bodegas que tienen productos de la denominación, paginada con `?pagina=`.
 *
 * @param props - La denominación (si se edita), sus bodegas y si puede bloquear ventas.
 */
export function AdminDenominationForm({
    data,
    related,
    canBlock = false,
}: AdminDenominationFormProps) {
    const router = useRouter();
    const denomination = data?.denomination;
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<DenominationFormValues, unknown, DenominationInput>({
        resolver: zodResolver(denominationFormSchema),
        defaultValues: denomination ? toFormValues(denomination) : EMPTY_DENOMINATION_FORM,
    });

    async function save(values: DenominationInput) {
        const outcome = denomination
            ? await denominationRequest(
                  `/api/admin/denominaciones/${denomination.id}`,
                  'PATCH',
                  values,
              )
            : await denominationRequest('/api/admin/denominaciones', 'POST', values);
        if (outcome.kind === 'error') {
            toast.error('No se ha podido guardar la denominación. Inténtalo de nuevo.');
            return;
        }
        if (outcome.kind === 'rejected') {
            if (outcome.errors) {
                for (const [field, messages] of Object.entries(outcome.errors))
                    setError(field as FieldPath<DenominationFormValues>, { message: messages[0] });
            } else if (outcome.status === 409) setError('name', { message: outcome.message });
            else toast.error(outcome.message);
            return;
        }
        toast.success(denomination ? 'Denominación guardada' : 'Denominación creada');
        if (denomination) {
            reset(
                toFormValues({
                    ...denomination,
                    ...values,
                } as AdminDenomination['denomination']),
            );
            router.refresh();
        } else {
            router.push(ADMIN_DENOMINATIONS_PATH);
            router.refresh();
        }
    }

    /** Pide el cambio de estado de venta; `true` si se guardó. */
    async function setBlocked(isBlocked: boolean): Promise<boolean> {
        if (!denomination) return false;
        const outcome = await denominationRequest(
            `/api/admin/denominaciones/${denomination.id}/ventas`,
            'PATCH',
            { isBlocked },
        );
        if (outcome.kind === 'ok') {
            toast.success(isBlocked ? 'Ventas bloqueadas' : 'Denominación a la venta');
            router.refresh();
            return true;
        }
        toast.error(
            outcome.kind === 'rejected'
                ? outcome.message
                : 'No se ha podido guardar el cambio. Inténtalo de nuevo.',
        );
        return false;
    }

    async function remove() {
        if (!denomination || deleting) return;
        setDeleting(true);
        const outcome = await denominationRequest(
            `/api/admin/denominaciones/${denomination.id}`,
            'DELETE',
        );
        setDeleting(false);
        if (outcome.kind === 'ok') {
            toast.success('Denominación eliminada');
            router.push(ADMIN_DENOMINATIONS_PATH);
            router.refresh();
            return;
        }
        setConfirmingDelete(false);
        toast.error(
            outcome.kind === 'rejected'
                ? outcome.message
                : 'No se ha podido eliminar la denominación. Inténtalo de nuevo.',
        );
    }

    const title = denomination ? denomination.name : 'Añadir una nueva denominación';
    const canDelete = Boolean(denomination) && data?.productCount === 0;

    return (
        <>
            <AdminFormPage
                formId="denomination-form"
                breadcrumb={[
                    { label: 'Denominaciones de origen', href: ADMIN_DENOMINATIONS_PATH },
                    { label: title },
                ]}
                title={title}
                onSubmit={(event) => void handleSubmit(save)(event)}
                cancelHref={ADMIN_DENOMINATIONS_PATH}
                saveDisabled={Boolean(denomination) && !isDirty}
                saving={isSubmitting}
                status={
                    denomination && canBlock ? (
                        <AdminSalesToggle
                            isBlocked={denomination.isBlocked}
                            noun="denominación de origen"
                            article="La"
                            name={denomination.name}
                            onChange={setBlocked}
                            blockTitle="¿Bloquear las ventas de la denominación?"
                            blockConfirmLabel="Bloquear ventas"
                            blockBody={
                                <>
                                    <p>
                                        Vas a bloquear las ventas de la{' '}
                                        <Strong>D.O. {denomination.name}</Strong>. Sus vinos y pasas
                                        dejarán de venderse en la tienda de inmediato.
                                    </p>
                                    <p>
                                        Las bodegas no se bloquean: sus productos de otras
                                        denominaciones se siguen vendiendo.
                                    </p>
                                </>
                            }
                            blockExtra={
                                <SalesBlockOrders
                                    url={`/api/admin/denominaciones/${denomination.id}/ventas`}
                                    scope="denomination"
                                />
                            }
                        />
                    ) : undefined
                }
                extraActions={
                    canDelete ? (
                        <Button
                            type="button"
                            variant="destructive"
                            size="xs"
                            onClick={() => setConfirmingDelete(true)}
                        >
                            Eliminar
                        </Button>
                    ) : undefined
                }
            >
                <AdminBox
                    title="Información básica"
                    titleId="denomination-basics"
                    className="lg:col-span-2"
                >
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                        <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-3">
                            <Field size="sm" invalid={!!errors.name} className="sm:col-span-2">
                                <FieldLabel>Nombre de la denominación</FieldLabel>
                                <FieldControl>
                                    <Input
                                        size="sm"
                                        autoComplete="off"
                                        placeholder="p. ej., Sierras de Málaga"
                                        {...register('name')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.name?.message}</FieldMessage>
                            </Field>
                            <Field size="sm" invalid={!!errors.foundedYear}>
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Año de fundación
                                </FieldLabel>
                                <FieldControl>
                                    <Input
                                        size="sm"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        placeholder="p. ej., 1982"
                                        {...register('foundedYear')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.foundedYear?.message}</FieldMessage>
                            </Field>
                            <Field
                                size="sm"
                                invalid={!!errors.regulatoryCouncil}
                                className="sm:col-span-2"
                            >
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Consejo regulador
                                </FieldLabel>
                                <FieldControl>
                                    <Input
                                        size="sm"
                                        autoComplete="off"
                                        placeholder="Nombre del consejo regulador..."
                                        {...register('regulatoryCouncil')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.regulatoryCouncil?.message}</FieldMessage>
                            </Field>
                            <Field size="sm" invalid={!!errors.region}>
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Región geográfica
                                </FieldLabel>
                                <FieldControl>
                                    <Input
                                        size="sm"
                                        autoComplete="off"
                                        placeholder="p. ej., Montes de Málaga"
                                        {...register('region')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.region?.message}</FieldMessage>
                            </Field>
                            <Field size="sm" invalid={!!errors.website} className="sm:col-span-3">
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Sitio web
                                </FieldLabel>
                                <FieldControl>
                                    <Input
                                        size="sm"
                                        type="url"
                                        autoComplete="off"
                                        placeholder="https://..."
                                        {...register('website')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.website?.message}</FieldMessage>
                            </Field>
                            <Field
                                size="sm"
                                invalid={!!errors.description}
                                className="sm:col-span-3"
                            >
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Descripción
                                </FieldLabel>
                                <FieldControl>
                                    <Textarea
                                        size="sm"
                                        className="min-h-25"
                                        placeholder="Describe las características de la denominación, sus microclimas, la estructura singular de sus suelos y su terruño vitícola..."
                                        {...register('description')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.description?.message}</FieldMessage>
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-4">
                            <Field
                                size="sm"
                                invalid={!!errors.classification}
                                className="sm:col-span-2"
                            >
                                <FieldLabel>Clasificación / Tipo</FieldLabel>
                                <Controller
                                    control={control}
                                    name="classification"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || undefined}
                                            onValueChange={field.onChange}
                                        >
                                            <FieldControl>
                                                <SelectTrigger size="sm">
                                                    <SelectValue placeholder="Seleccionar clasificación / tipo" />
                                                </SelectTrigger>
                                            </FieldControl>
                                            <SelectContent>
                                                {CLASSIFICATIONS.map(({ value, label }) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <FieldMessage>{errors.classification?.message}</FieldMessage>
                            </Field>
                        </div>
                    </div>
                </AdminBox>
                {data && related && (
                    <AdminBox
                        title={`Bodegas relacionadas (${related.total})`}
                        titleId="denomination-wineries"
                        className="lg:col-span-2"
                    >
                        {related.total === 0 ? (
                            <div className="flex min-h-64 w-full flex-col items-center justify-center gap-6 rounded-sm border border-border p-6 text-center">
                                <div className="flex w-full max-w-160 flex-col items-center gap-5">
                                    <div
                                        aria-hidden="true"
                                        className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground [&_svg]:size-5"
                                    >
                                        <HouseHeart />
                                    </div>
                                    <div className="flex w-full flex-col items-center gap-1">
                                        <p className="w-full text-sm font-medium">
                                            Todavía no hay bodegas
                                        </p>
                                        <p className="w-full text-xs text-muted-foreground">
                                            Ninguna bodega tiene productos de esta denominación.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-gap-md">
                                <AdminValuesTable
                                    rows={related.items}
                                    getRowKey={(row) => row.id}
                                    getRowName={(row) => row.name}
                                    editHref={(row) => wineryHref(row.id)}
                                    columns={[
                                        {
                                            key: 'id',
                                            header: 'ID',
                                            width: 'w-27.5',
                                            strong: true,
                                            cell: (row) => wineryNumber(row.id),
                                        },
                                        {
                                            key: 'name',
                                            header: 'Nombre de la bodega',
                                            cell: (row) => (
                                                <Link
                                                    href={wineryHref(row.id)}
                                                    className="underline underline-offset-4"
                                                >
                                                    {row.name}
                                                </Link>
                                            ),
                                        },
                                        {
                                            key: 'city',
                                            header: 'Región',
                                            width: 'w-118.25',
                                            cell: (row) => row.city ?? '—',
                                        },
                                        {
                                            key: 'products',
                                            header: 'Número de vinos',
                                            width: 'w-35',
                                            align: 'right',
                                            cell: (row) => row.productCount,
                                        },
                                    ]}
                                />
                                <OrderHistoryPagination
                                    summary={adminWineriesRangeText({
                                        page: related.page,
                                        pageSize: related.pageSize,
                                        shown: related.items.length,
                                        total: related.total,
                                        overall: related.total,
                                        filtered: false,
                                    })}
                                    page={related.page}
                                    totalPages={related.totalPages}
                                    filters={{}}
                                    hrefFor={(target) =>
                                        target > 1
                                            ? `${denominationHref(denomination!.id)}?pagina=${target}`
                                            : denominationHref(denomination!.id)
                                    }
                                />
                            </div>
                        )}
                    </AdminBox>
                )}
            </AdminFormPage>
            <AdminConfirmDialog
                open={confirmingDelete}
                onOpenChange={setConfirmingDelete}
                title="Eliminar denominación de origen"
                confirmLabel="Eliminar"
                tone="destructive"
                busy={deleting}
                onConfirm={() => void remove()}
            >
                <p>
                    La denominación <Strong>{denomination?.name}</Strong> se borrará de forma
                    definitiva. No tiene productos.
                </p>
            </AdminConfirmDialog>
        </>
    );
}
