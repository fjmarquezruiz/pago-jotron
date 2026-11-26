'use client';

import { useEffect, useId, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminBox } from '@/components/admin/admin-box';
import { AdminFormPage } from '@/components/admin/admin-form-page';
import { AdminSalesToggle } from '@/components/admin/admin-sales-toggle';
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
import { ADMIN_PRODUCTS_PATH, defaultCapacityUnit, taxText } from '@/lib/admin/products';
import type { AdminProduct, AdminProductOptions } from '@/lib/db/admin-products';
import { productFormSchema, type ProductFormValues } from '@/lib/validations/admin-products';
import {
    emptyProductForm,
    inputToNumber,
    numberToInput,
    productToFormValues,
} from './product-form-values';
import { ProductGrapesField } from './product-grapes-field';
import { ProductImageField } from './product-image-field';
import { saveProductRequest, setProductBlockedRequest } from './product-requests';
import { ProductVariantsBox } from './product-variants-box';

/** Relleno de los controles de 36 px del diseño (12 px a cada lado). */
const CONTROL = 'px-inset-sm';

/** El «Opcional» de la etiqueta va pegado a la derecha del campo (Figma: FormLabel). */
const OPTIONAL_LABEL = 'w-full [&>span]:ml-auto';

/** Texto de «sin elegir» de los selectores (Figma: «Seleccionar una opción»). */
const CHOOSE = 'Seleccionar una opción';

export interface ProductFormProps {
    /** Bodegas, D.O., tipologías y uvas entre las que se elige. */
    options: AdminProductOptions;
    /** El producto que se edita; ausente para crear uno nuevo. */
    product?: AdminProduct;
}

/**
 * Formulario de producto, único para crear y editar y para vino y pasas (Figma: admin-product-edit
 * y catalogue-create - pasas), solo con lo del punto 3a: información básica (nombre, bodega,
 * tipología con su IVA de solo lectura, uvas con %, denominación de origen, añada), descripción,
 * imagen y presentaciones con stock. Las notas de cata, etiquetas, categorías, maridaje, pasos,
 * ficha técnica y datos clave son del punto 3b.
 *
 * React Hook Form con `productFormSchema` (el mismo esquema que valida la API). Al guardar se pide
 * `POST`/`PATCH /api/admin/productos` y se refresca la página (`router.refresh()`); si el stock
 * cambió mientras se editaba (409) se avisa y se recargan los datos. Al editar, el interruptor de
 * Estado bloquea o reabre las ventas por su cuenta, sin pasar por «Guardar».
 *
 * @example
 * <ProductForm options={await getAdminProductOptions()} />
 * <ProductForm options={options} product={await getAdminProduct(id)} />
 */
export function ProductForm({ options, product }: ProductFormProps) {
    const router = useRouter();
    const formId = useId();
    const defaults = useMemo(
        () => (product ? productToFormValues(product) : emptyProductForm()),
        [product],
    );
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: defaults,
    });
    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty, isSubmitting },
    } = form;

    // Tras guardar o recargar por un conflicto, la página llega con datos nuevos: el formulario parte de ellos.
    useEffect(() => reset(defaults), [defaults, reset]);

    const typology = options.typologies.find((item) => item.id === watch('typologyId'));
    const name = watch('name');

    async function save(values: ProductFormValues) {
        const outcome = await saveProductRequest(product?.id, values);
        if (outcome.kind === 'saved') {
            toast.success(product ? 'Producto guardado' : 'Producto creado');
            if (outcome.id !== undefined) router.push(`${ADMIN_PRODUCTS_PATH}/${outcome.id}`);
            router.refresh();
        } else if (outcome.kind === 'stock_conflict') {
            toast.error(outcome.message);
            router.refresh();
        } else if (outcome.kind === 'rejected') {
            toast.error(outcome.message);
        } else {
            toast.error('No se ha podido guardar el producto. Inténtalo de nuevo.');
        }
    }

    async function setBlocked(isBlocked: boolean): Promise<boolean> {
        if (!product) return false;
        const saved = await setProductBlockedRequest(product.id, isBlocked);
        if (saved) {
            toast.success(isBlocked ? 'Ventas bloqueadas' : 'Producto a la venta');
            router.refresh();
        } else {
            toast.error('No se ha podido cambiar el estado. Inténtalo de nuevo.');
        }
        return saved;
    }

    const title = product ? product.name : 'Añadir un nuevo producto';

    return (
        <AdminFormPage
            formId={formId}
            onSubmit={() => void handleSubmit(save)()}
            cancelHref={ADMIN_PRODUCTS_PATH}
            breadcrumb={[
                { label: 'Catálogo', href: ADMIN_PRODUCTS_PATH },
                { label: product ? product.name : 'Nuevo producto' },
            ]}
            title={title}
            saveDisabled={product ? !isDirty : false}
            saving={isSubmitting}
            status={
                product && (
                    <AdminSalesToggle
                        isBlocked={product.isBlocked}
                        noun="producto"
                        article="El"
                        name={product.name}
                        context={`de ${product.wineryName}`}
                        onChange={setBlocked}
                    />
                )
            }
        >
            <AdminBox title="Información básica" titleId="basicos" className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                    <div className="grid grid-cols-4 content-start gap-4">
                        <Field className="col-span-4" invalid={Boolean(errors.name)}>
                            <FieldLabel>Nombre del producto</FieldLabel>
                            <FieldControl>
                                <Input size="sm" className={CONTROL} {...register('name')} />
                            </FieldControl>
                            <FieldMessage>{errors.name?.message}</FieldMessage>
                        </Field>

                        <Field
                            className="col-span-4 sm:col-span-3"
                            invalid={Boolean(errors.wineryId)}
                        >
                            <FieldLabel>Bodega</FieldLabel>
                            <Controller
                                control={control}
                                name="wineryId"
                                render={({ field }) => (
                                    <Select
                                        value={field.value ? String(field.value) : ''}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                    >
                                        <FieldControl>
                                            <SelectTrigger size="sm" className={CONTROL}>
                                                <SelectValue placeholder={CHOOSE} />
                                            </SelectTrigger>
                                        </FieldControl>
                                        <SelectContent>
                                            {options.wineries.map((winery) => (
                                                <SelectItem
                                                    key={winery.id}
                                                    value={String(winery.id)}
                                                >
                                                    {winery.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <FieldMessage>{errors.wineryId?.message}</FieldMessage>
                        </Field>

                        <Field
                            className="col-span-4 sm:col-span-1"
                            invalid={Boolean(errors.typologyId)}
                        >
                            <FieldLabel>Tipología</FieldLabel>
                            <Controller
                                control={control}
                                name="typologyId"
                                render={({ field }) => (
                                    <Select
                                        value={field.value ? String(field.value) : ''}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                    >
                                        <FieldControl>
                                            <SelectTrigger size="sm" className={CONTROL}>
                                                <SelectValue placeholder={CHOOSE} />
                                            </SelectTrigger>
                                        </FieldControl>
                                        <SelectContent>
                                            {options.typologies.map((item) => (
                                                <SelectItem key={item.id} value={String(item.id)}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <FieldMessage>{errors.typologyId?.message}</FieldMessage>
                            <p className="text-xs text-muted-foreground">
                                {taxText(typology?.taxRate)}
                            </p>
                        </Field>

                        <div className="col-span-4">
                            <Controller
                                control={control}
                                name="grapes"
                                render={({ field }) => (
                                    <ProductGrapesField
                                        options={options.grapes}
                                        value={field.value}
                                        onChange={field.onChange}
                                        errors={field.value.map(
                                            (_, index) =>
                                                errors.grapes?.[index]?.percentage?.message ??
                                                errors.grapes?.[index]?.grapeId?.message,
                                        )}
                                        groupError={
                                            errors.grapes?.message ?? errors.grapes?.root?.message
                                        }
                                    />
                                )}
                            />
                        </div>

                        <Field
                            className="col-span-4 sm:col-span-2"
                            invalid={Boolean(errors.guaranteeOfOriginId)}
                        >
                            <FieldLabel>Denominación de origen</FieldLabel>
                            <Controller
                                control={control}
                                name="guaranteeOfOriginId"
                                render={({ field }) => (
                                    <Select
                                        value={field.value ? String(field.value) : ''}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                    >
                                        <FieldControl>
                                            <SelectTrigger size="sm" className={CONTROL}>
                                                <SelectValue placeholder={CHOOSE} />
                                            </SelectTrigger>
                                        </FieldControl>
                                        <SelectContent>
                                            {options.guarantees.map((item) => (
                                                <SelectItem key={item.id} value={String(item.id)}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <FieldMessage>{errors.guaranteeOfOriginId?.message}</FieldMessage>
                        </Field>

                        <Field
                            className="col-span-4 sm:col-span-1"
                            invalid={Boolean(errors.vintage)}
                        >
                            <FieldLabel indicator="optional" className={OPTIONAL_LABEL}>
                                Añada
                            </FieldLabel>
                            <Controller
                                control={control}
                                name="vintage"
                                render={({ field }) => (
                                    <FieldControl>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            size="sm"
                                            className={CONTROL}
                                            value={numberToInput(field.value)}
                                            onChange={(event) => {
                                                const value = inputToNumber(event.target.value);
                                                field.onChange(Number.isNaN(value) ? null : value);
                                            }}
                                            onBlur={field.onBlur}
                                        />
                                    </FieldControl>
                                )}
                            />
                            <FieldMessage>{errors.vintage?.message}</FieldMessage>
                        </Field>
                    </div>

                    <div className="flex flex-col content-start gap-4">
                        <Field invalid={Boolean(errors.description)}>
                            <FieldLabel indicator="optional" className={OPTIONAL_LABEL}>
                                Descripción
                            </FieldLabel>
                            <FieldControl>
                                <Textarea
                                    size="sm"
                                    className="min-h-25"
                                    {...register('description')}
                                />
                            </FieldControl>
                            <FieldMessage>{errors.description?.message}</FieldMessage>
                        </Field>
                        <Controller
                            control={control}
                            name="image"
                            render={({ field }) => (
                                <ProductImageField
                                    value={field.value}
                                    onChange={(value) =>
                                        form.setValue('image', value, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })
                                    }
                                    alt={name}
                                />
                            )}
                        />
                    </div>
                </div>
            </AdminBox>

            <ProductVariantsBox
                form={form}
                defaultUnit={defaultCapacityUnit(typology?.productType)}
            />
        </AdminFormPage>
    );
}
