'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Wine } from 'lucide-react';
import { AdminBox } from '@/components/admin/admin-box';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { Strong } from '@/components/admin/admin-dialog-frame';
import { AdminFormPage } from '@/components/admin/admin-form-page';
import { AdminSalesToggle } from '@/components/admin/admin-sales-toggle';
import { SalesBlockOrders } from '@/components/admin/sales-block-orders';
import { AdminValuesTable } from '@/components/admin/admin-values-table';
import { SalesStatusBadge } from '@/components/admin/wineries/winery-status-badge';
import { wineryRequest } from '@/components/admin/wineries/winery-requests';
import { PHONE_PREFIX_WIDTH, SPAIN_PREFIX } from '@/components/shop/contact-form';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldControl,
    FieldDescription,
    FieldLabel,
    FieldMessage,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
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
    ADMIN_WINERIES_PATH,
    SPANISH_PROVINCES,
    WINERY_DEFAULT_COUNTRY,
} from '@/lib/admin/wineries';
import type { AdminWinery } from '@/lib/db/admin-wineries';
import {
    EMPTY_WINERY_FORM,
    wineryFormSchema,
    type WineryFormValues,
    type WineryInput,
} from '@/lib/validations/admin-wineries';

export interface AdminWineryFormProps {
    /** La bodega que se edita (`getAdminWinery`); sin ella es el alta. */
    data?: AdminWinery;
    /** Es administrador: solo él ve el interruptor de Estado (la API también lo exige). */
    canBlock?: boolean;
}

/** Etiqueta con «Opcional» a la derecha, en `muted-foreground` (Figma: FormLabel). */
const labelClassName = 'w-full text-muted-foreground [&>span]:ml-auto';

/** Ruta de creación de un producto (la pantalla es de la sección de productos). */
const NEW_PRODUCT_HREF = '/admin/productos/nuevo';

/** Valores del formulario a partir de la fila de la BD (los `NULL` son textos vacíos). */
function toFormValues(winery: AdminWinery['winery']): WineryFormValues {
    return {
        name: winery.name,
        description: winery.description ?? '',
        address: winery.address ?? '',
        city: winery.city ?? '',
        province: winery.province ?? '',
        country: winery.country,
        phone: (winery.phone ?? '').replace(/^\+34/, ''),
        email: winery.email ?? '',
        website: winery.website ?? '',
    };
}

/** Teléfono en grupos de tres (`952 000 000`) para el texto de ayuda; lo que no es un dígito se ignora. */
function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').replace(/^(34|0034)(?=\d{9}$)/, '');
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ');
}

/** Estado vacío de «Vinos relacionados» (Figma: empty-state de wineries-detail-empty). */
function RelatedEmpty() {
    return (
        <div className="flex min-h-64 w-full flex-col items-center justify-center gap-6 rounded-sm border border-border p-6 text-center">
            <div className="flex w-full max-w-160 flex-col items-center gap-5">
                <div
                    aria-hidden="true"
                    className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground [&_svg]:size-5"
                >
                    <Wine />
                </div>
                <div className="flex w-full flex-col items-center gap-1">
                    <p className="w-full text-sm font-medium">Todavía no hay productos</p>
                    <p className="w-full text-xs text-muted-foreground">
                        Esta bodega todavía no tiene productos en el catálogo.
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Formulario de alta y de ficha de una bodega (Figma: wineries-create, admin-entity-detail y
 * wineries-detail-empty; CU9), sobre `AdminFormPage`. Una caja «Información básica» con los campos
 * de `wineries` (nombre, dirección, correo, ciudad, provincia, país, teléfono, sitio web y
 * descripción; todos opcionales menos el nombre) en dos columnas de 624 px separadas 48 px.
 *
 * En la ficha, además: el interruptor de Estado (solo administrador; pide confirmación al
 * bloquear), «Eliminar» (solo si no tiene productos) y la caja «Vinos relacionados del catálogo».
 * RHF + Zod (`wineryFormSchema`, el mismo que valida la API); un 400 o un 409 de la API se pintan
 * bajo el campo. Al guardar el alta vuelve al listado; al guardar la ficha se recarga.
 *
 * @param props - La bodega (si se edita) y si puede bloquear ventas.
 */
export function AdminWineryForm({ data, canBlock = false }: AdminWineryFormProps) {
    const router = useRouter();
    const winery = data?.winery;
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        watch,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<WineryFormValues, unknown, WineryInput>({
        resolver: zodResolver(wineryFormSchema),
        defaultValues: winery ? toFormValues(winery) : EMPTY_WINERY_FORM,
    });

    const phone = watch('phone');

    async function save(values: WineryInput) {
        const outcome = winery
            ? await wineryRequest(`/api/admin/bodegas/${winery.id}`, 'PATCH', values)
            : await wineryRequest('/api/admin/bodegas', 'POST', values);
        if (outcome.kind === 'error') {
            toast.error('No se ha podido guardar la bodega. Inténtalo de nuevo.');
            return;
        }
        if (outcome.kind === 'rejected') {
            if (outcome.errors) {
                for (const [field, messages] of Object.entries(outcome.errors))
                    setError(field as FieldPath<WineryFormValues>, { message: messages[0] });
            } else if (outcome.status === 409) setError('name', { message: outcome.message });
            else toast.error(outcome.message);
            return;
        }
        toast.success(winery ? 'Bodega guardada' : 'Bodega creada');
        if (winery) {
            reset(toFormValues({ ...winery, ...values } as AdminWinery['winery']));
            router.refresh();
        } else {
            router.push(ADMIN_WINERIES_PATH);
            router.refresh();
        }
    }

    /** Pide el cambio de estado de venta; `true` si se guardó. */
    async function setBlocked(isBlocked: boolean): Promise<boolean> {
        if (!winery) return false;
        const outcome = await wineryRequest(`/api/admin/bodegas/${winery.id}/ventas`, 'PATCH', {
            isBlocked,
        });
        if (outcome.kind === 'ok') {
            toast.success(isBlocked ? 'Ventas bloqueadas' : 'Bodega a la venta');
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
        if (!winery || deleting) return;
        setDeleting(true);
        const outcome = await wineryRequest(`/api/admin/bodegas/${winery.id}`, 'DELETE');
        setDeleting(false);
        if (outcome.kind === 'ok') {
            toast.success('Bodega eliminada');
            router.push(ADMIN_WINERIES_PATH);
            router.refresh();
            return;
        }
        setConfirmingDelete(false);
        toast.error(
            outcome.kind === 'rejected'
                ? outcome.message
                : 'No se ha podido eliminar la bodega. Inténtalo de nuevo.',
        );
    }

    const title = winery ? winery.name : 'Añadir una nueva bodega';
    const canDelete = Boolean(winery) && data?.productCount === 0;
    const provinces = [
        ...SPANISH_PROVINCES,
        ...(winery?.province && !SPANISH_PROVINCES.includes(winery.province)
            ? [winery.province]
            : []),
    ];
    const countries = [
        WINERY_DEFAULT_COUNTRY,
        ...(winery && winery.country !== WINERY_DEFAULT_COUNTRY ? [winery.country] : []),
    ];

    return (
        <>
            <AdminFormPage
                formId="winery-form"
                breadcrumb={[{ label: 'Bodegas', href: ADMIN_WINERIES_PATH }, { label: title }]}
                title={title}
                onSubmit={(event) => void handleSubmit(save)(event)}
                cancelHref={ADMIN_WINERIES_PATH}
                saveDisabled={Boolean(winery) && !isDirty}
                saving={isSubmitting}
                status={
                    winery && canBlock ? (
                        <AdminSalesToggle
                            isBlocked={winery.isBlocked}
                            noun="bodega"
                            article="La"
                            name={winery.name}
                            onChange={setBlocked}
                            blockTitle="¿Bloquear ventas de la bodega?"
                            blockConfirmLabel="Bloquear ventas"
                            blockBody={
                                <p>
                                    Vas a bloquear las ventas de <Strong>{winery.name}</Strong>. Sus
                                    productos dejarán de estar a la venta en la tienda de inmediato.
                                </p>
                            }
                            blockExtra={
                                <SalesBlockOrders
                                    url={`/api/admin/bodegas/${winery.id}/ventas`}
                                    scope="winery"
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
                    titleId="winery-basics"
                    className="lg:col-span-2"
                >
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                        <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-3">
                            <Field size="sm" invalid={!!errors.name} className="sm:col-span-3">
                                <FieldLabel>Nombre de la bodega</FieldLabel>
                                <FieldControl>
                                    <Input
                                        size="sm"
                                        autoComplete="off"
                                        placeholder="p. ej., Bodega Sierra Norte"
                                        {...register('name')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.name?.message}</FieldMessage>
                            </Field>
                            <Field size="sm" invalid={!!errors.city}>
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Ciudad
                                </FieldLabel>
                                <FieldControl>
                                    <Input
                                        size="sm"
                                        autoComplete="off"
                                        placeholder="p. ej., Ronda"
                                        {...register('city')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.city?.message}</FieldMessage>
                            </Field>
                            <Field size="sm" invalid={!!errors.province}>
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Provincia
                                </FieldLabel>
                                <Controller
                                    control={control}
                                    name="province"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || undefined}
                                            onValueChange={field.onChange}
                                        >
                                            <FieldControl>
                                                <SelectTrigger
                                                    size="sm"
                                                    onClear={
                                                        field.value
                                                            ? () => field.onChange('')
                                                            : undefined
                                                    }
                                                >
                                                    <SelectValue placeholder="Seleccionar provincia" />
                                                </SelectTrigger>
                                            </FieldControl>
                                            <SelectContent>
                                                {provinces.map((name) => (
                                                    <SelectItem key={name} value={name}>
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <FieldMessage>{errors.province?.message}</FieldMessage>
                            </Field>
                            <Field size="sm" invalid={!!errors.country}>
                                <FieldLabel>País</FieldLabel>
                                <Controller
                                    control={control}
                                    name="country"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value ?? undefined}
                                            onValueChange={field.onChange}
                                        >
                                            <FieldControl>
                                                <SelectTrigger size="sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FieldControl>
                                            <SelectContent>
                                                {countries.map((name) => (
                                                    <SelectItem key={name} value={name}>
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <FieldMessage>{errors.country?.message}</FieldMessage>
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
                                        placeholder="Resume la historia de la bodega, las uvas autóctonas que cultiva y la altitud de sus viñedos..."
                                        {...register('description')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.description?.message}</FieldMessage>
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-4">
                            <Field size="sm" invalid={!!errors.address} className="sm:col-span-4">
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Dirección
                                </FieldLabel>
                                <FieldControl>
                                    <Input
                                        size="sm"
                                        autoComplete="off"
                                        placeholder="p. ej., Carretera de los Montes de Málaga s/n"
                                        {...register('address')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.address?.message}</FieldMessage>
                            </Field>
                            <Field size="sm" invalid={!!errors.email} className="sm:col-span-4">
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Correo electrónico
                                </FieldLabel>
                                <FieldControl>
                                    <Input
                                        size="sm"
                                        type="email"
                                        autoComplete="off"
                                        placeholder="p. ej., contacto@pagodejotron.es"
                                        {...register('email')}
                                    />
                                </FieldControl>
                                <FieldMessage>{errors.email?.message}</FieldMessage>
                            </Field>
                            <Field size="sm" invalid={!!errors.phone} className="sm:col-span-2">
                                <FieldLabel indicator="optional" className={labelClassName}>
                                    Teléfono
                                </FieldLabel>
                                <FieldControl>
                                    <PhoneInput
                                        size="sm"
                                        prefix="+34"
                                        onPrefixChange={() => {}}
                                        prefixes={SPAIN_PREFIX}
                                        className={PHONE_PREFIX_WIDTH}
                                        placeholder="000-000-000"
                                        {...register('phone')}
                                    />
                                </FieldControl>
                                <FieldDescription>
                                    Se guarda con el prefijo: +34 {formatPhone(phone ?? '')}
                                </FieldDescription>
                                <FieldMessage>{errors.phone?.message}</FieldMessage>
                            </Field>
                            <Field size="sm" invalid={!!errors.website} className="sm:col-span-4">
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
                        </div>
                    </div>
                </AdminBox>
                {data && (
                    <AdminBox
                        title={`Vinos relacionados del catálogo (${data.productCount})`}
                        titleId="winery-products"
                        className="lg:col-span-2"
                        action={
                            <Button asChild variant="default" size="xs">
                                <Link href={NEW_PRODUCT_HREF}>
                                    <Plus aria-hidden="true" />
                                    Añadir producto
                                </Link>
                            </Button>
                        }
                    >
                        {data.productCount === 0 ? (
                            <RelatedEmpty />
                        ) : (
                            <AdminValuesTable
                                rows={data.products}
                                getRowKey={(row) => row.id}
                                getRowName={(row) => row.name}
                                editHref={(row) => `/admin/productos/${row.id}`}
                                columns={[
                                    { key: 'name', header: 'Producto', cell: (row) => row.name },
                                    {
                                        key: 'status',
                                        header: 'Estado',
                                        width: 'w-30',
                                        align: 'center',
                                        cell: (row) => (
                                            <SalesStatusBadge isBlocked={row.isBlocked} />
                                        ),
                                    },
                                ]}
                            />
                        )}
                    </AdminBox>
                )}
            </AdminFormPage>
            <AdminConfirmDialog
                open={confirmingDelete}
                onOpenChange={setConfirmingDelete}
                title="Eliminar bodega"
                confirmLabel="Eliminar"
                tone="destructive"
                busy={deleting}
                onConfirm={() => void remove()}
            >
                <p>
                    La bodega <Strong>{winery?.name}</Strong> se borrará de forma definitiva. No
                    tiene productos.
                </p>
            </AdminConfirmDialog>
        </>
    );
}
