'use client';

import Link from 'next/link';
import { AdminPage, type AdminCrumb } from '@/components/admin/admin-page';
import { Button } from '@/components/ui/button';

export interface AdminFormPageProps {
    /** Migas tras «Pago de Jotrón»; la última (la página) sin `href`. */
    breadcrumb: AdminCrumb[];
    /** Título de la página: «Añadir un nuevo producto» o el nombre de lo que se edita. */
    title: string;
    /** Frase bajo el título, si el diseño la lleva. */
    description?: string;
    /** `id` del `<form>`: los botones de las dos barras (fuera del formulario) lo envían con él. */
    formId: string;
    /** Se llama al enviar; el formulario ya hizo `preventDefault`. Normalmente `handleSubmit(...)` de RHF. */
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    /** Adónde vuelve «Cancelar» (el listado). */
    cancelHref: string;
    /** Sin cambios que guardar: «Guardar» sale desactivado, como en admin-form-template. */
    saveDisabled?: boolean;
    /** Guardando: «Guardar» muestra el spinner y las dos barras no se pueden volver a enviar. */
    saving?: boolean;
    /** Texto del botón principal; por defecto «Guardar». */
    saveLabel?: string;
    /** Estado de venta junto al título, solo en la barra de arriba (`AdminSalesToggle`). */
    status?: React.ReactNode;
    /** Botones antes de «Cancelar» en las dos barras (Figma: «Eliminar», solo si se puede borrar). */
    extraActions?: React.ReactNode;
    /** Las `AdminBox` del formulario. */
    children: React.ReactNode;
}

/**
 * Plantilla de formulario del panel (Figma: admin-form-template y admin-product-edit): migas,
 * cabecera con título de 24 px, el estado de venta (opcional) y los botones «Cancelar» y «Guardar»
 * de 32 px; debajo, las cajas en una rejilla de dos columnas con 48 px de separación (una sola
 * columna por debajo de `lg`); y al final una línea y la misma barra de botones, sin título ni
 * estado.
 *
 * Es solo la plantilla: no sabe de campos. Cada sección pone su `useForm` y pasa `formId` y
 * `onSubmit`.
 *
 * @example
 * <AdminFormPage formId="winery-form" onSubmit={handleSubmit(save)} cancelHref="/admin/bodegas"
 *     breadcrumb={[{ label: 'Bodegas', href: '/admin/bodegas' }, { label: 'Nueva bodega' }]}
 *     title="Nueva bodega" saveDisabled={!isDirty} saving={isSubmitting}>
 *     <AdminBox title="Información básica" titleId="basics" className="lg:col-span-2">…</AdminBox>
 * </AdminFormPage>
 */
export function AdminFormPage({
    breadcrumb,
    title,
    description,
    formId,
    onSubmit,
    cancelHref,
    saveDisabled = false,
    saving = false,
    saveLabel = 'Guardar',
    status,
    extraActions,
    children,
}: AdminFormPageProps) {
    const buttons = (
        <>
            {extraActions}
            <Button asChild variant="outline" size="xs">
                <Link href={cancelHref}>Cancelar</Link>
            </Button>
            <Button
                type="submit"
                form={formId}
                variant="brand"
                size="xs"
                disabled={saveDisabled}
                loading={saving}
            >
                {saveLabel}
            </Button>
        </>
    );
    return (
        <AdminPage
            breadcrumb={breadcrumb}
            title={title}
            description={description}
            actions={
                <>
                    {status && <div className="mr-3">{status}</div>}
                    {buttons}
                </>
            }
        >
            <form
                id={formId}
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit(event);
                }}
                className="flex flex-col gap-8"
            >
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">{children}</div>
                <hr className="border-border" />
                <div className="flex min-h-control-md items-center justify-end gap-gap-sm">
                    {buttons}
                </div>
            </form>
        </AdminPage>
    );
}
