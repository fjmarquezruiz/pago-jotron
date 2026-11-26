'use client';

import { Controller, useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { AdminBox } from '@/components/admin/admin-box';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelperText } from '@/components/ui/helper-text';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ProductFormValues } from '@/lib/validations/admin-products';
import { inputToNumber, numberToInput, emptyVariant } from './product-form-values';

export interface ProductVariantsBoxProps {
    form: UseFormReturn<ProductFormValues>;
    /** Unidad con la que se propone una presentación nueva (según la tipología). */
    defaultUnit: 'ml' | 'g';
}

/**
 * Caja «Presentaciones y stock» (Figma: AdminBox con la tabla `presentaciones-table`): cabecera de
 * 18 px con el botón «Añadir presentación» (xs) y una tabla de 12 px con Formato, Capacidad, Precio,
 * Existencias, Estado y Acciones; debajo, la nota de 12 px. Las filas son un `useFieldArray` y cada
 * celda es editable (en el diseño el lápiz abre la edición; aquí se edita en la propia fila).
 *
 * - **Formato + capacidad** no se repiten (índice único de la BD): el esquema lo valida.
 * - **Capacidad** se guarda en ml o g, con la unidad al lado; la tienda la muestra en cl o kg.
 * - **Estado:** una presentación guardada no se borra (la referencian los pedidos): se da de baja
 *   con el interruptor (`is_blocked`). Solo las que aún no se han guardado tienen papelera.
 * - **Existencias:** el valor leído viaja en `loadedStock` (control optimista, ver `updateProduct`).
 */
export function ProductVariantsBox({ form, defaultUnit }: ProductVariantsBoxProps) {
    const {
        control,
        register,
        formState: { errors },
    } = form;
    const { fields, append, remove } = useFieldArray({ control, name: 'variants' });
    const variants = useWatch({ control, name: 'variants' });

    const rowErrors = (errors.variants ?? []) as NonNullable<typeof errors.variants>;
    const messages = Array.from(
        new Set(
            [
                errors.variants?.message,
                errors.variants?.root?.message,
                ...Object.values(rowErrors).flatMap((row) =>
                    row && typeof row === 'object'
                        ? Object.values(row).map((cell) => (cell as { message?: string })?.message)
                        : [],
                ),
            ].filter((message): message is string => Boolean(message)),
        ),
    );

    return (
        <AdminBox
            title="Presentaciones y stock"
            titleId="presentaciones"
            className="lg:col-span-2"
            action={
                <Button type="button" size="xs" onClick={() => append(emptyVariant(defaultUnit))}>
                    <Plus className="size-3.5" aria-hidden="true" />
                    Añadir presentación
                </Button>
            }
        >
            <Table size="xs" className="min-w-190">
                <TableHeader>
                    <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead>Formato</TableHead>
                        <TableHead align="right">Capacidad</TableHead>
                        <TableHead align="right">Precio (€)</TableHead>
                        <TableHead align="right">Existencias</TableHead>
                        <TableHead align="center">Estado</TableHead>
                        <TableHead align="right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.map((field, index) => {
                        const row = variants?.[index];
                        const rowError = errors.variants?.[index];
                        const isNew = row?.variantId === undefined;
                        return (
                            <TableRow key={field.id}>
                                <TableCell>
                                    <Input
                                        size="xs"
                                        aria-label={`Formato de la presentación ${index + 1}`}
                                        aria-invalid={Boolean(rowError?.format)}
                                        {...register(`variants.${index}.format`)}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <div className="flex items-center justify-end gap-gap-xs">
                                        <Controller
                                            control={control}
                                            name={`variants.${index}.capacity`}
                                            render={({ field: capacity }) => (
                                                <Input
                                                    type="number"
                                                    size="xs"
                                                    min={1}
                                                    step={1}
                                                    className="w-20 text-right"
                                                    aria-label={`Capacidad de la presentación ${index + 1}`}
                                                    aria-invalid={Boolean(rowError?.capacity)}
                                                    value={numberToInput(capacity.value)}
                                                    onChange={(event) =>
                                                        capacity.onChange(
                                                            inputToNumber(event.target.value),
                                                        )
                                                    }
                                                    onBlur={capacity.onBlur}
                                                />
                                            )}
                                        />
                                        <Controller
                                            control={control}
                                            name={`variants.${index}.capacityUnit`}
                                            render={({ field: unit }) => (
                                                <div className="w-20">
                                                    <Select
                                                        value={unit.value}
                                                        onValueChange={unit.onChange}
                                                    >
                                                        <SelectTrigger
                                                            size="xs"
                                                            aria-label={`Unidad de la presentación ${index + 1}`}
                                                        >
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ml">ml</SelectItem>
                                                            <SelectItem value="g">g</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell align="right">
                                    <Controller
                                        control={control}
                                        name={`variants.${index}.price`}
                                        render={({ field: price }) => (
                                            <Input
                                                type="number"
                                                size="xs"
                                                min={0}
                                                step="0.01"
                                                className="ml-auto w-24 text-right"
                                                aria-label={`Precio de la presentación ${index + 1}`}
                                                aria-invalid={Boolean(rowError?.price)}
                                                value={numberToInput(price.value)}
                                                onChange={(event) =>
                                                    price.onChange(
                                                        inputToNumber(event.target.value),
                                                    )
                                                }
                                                onBlur={price.onBlur}
                                            />
                                        )}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Controller
                                        control={control}
                                        name={`variants.${index}.stock`}
                                        render={({ field: stock }) => (
                                            <Input
                                                type="number"
                                                size="xs"
                                                min={0}
                                                step={1}
                                                className="ml-auto w-24 text-right"
                                                aria-label={`Existencias de la presentación ${index + 1}`}
                                                aria-invalid={Boolean(rowError?.stock)}
                                                value={numberToInput(stock.value)}
                                                onChange={(event) =>
                                                    stock.onChange(
                                                        inputToNumber(event.target.value),
                                                    )
                                                }
                                                onBlur={stock.onBlur}
                                            />
                                        )}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <div className="flex items-center justify-center gap-gap-xs">
                                        <Controller
                                            control={control}
                                            name={`variants.${index}.isBlocked`}
                                            render={({ field: blocked }) => (
                                                <Switch
                                                    size="sm"
                                                    variant="outline"
                                                    aria-label={`A la venta: presentación ${index + 1}`}
                                                    checked={!blocked.value}
                                                    onCheckedChange={(onSale) =>
                                                        blocked.onChange(!onSale)
                                                    }
                                                />
                                            )}
                                        />
                                        {row?.isBlocked ? (
                                            <Badge tone="neutral">Bloqueada</Badge>
                                        ) : row?.stock === 0 ? (
                                            <Badge tone="destructive">Agotado</Badge>
                                        ) : (
                                            <Badge tone="success">En venta</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell align="right">
                                    {isNew && fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            aria-label={`Quitar la presentación ${index + 1}`}
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            {messages.map((message) => (
                <HelperText key={message} type="error" showIcon role="alert" size="xs">
                    {message}
                </HelperText>
            ))}
            <p className="text-xs text-muted-foreground">
                Cada presentación tiene su precio y su stock. Si el stock llega a 0, la tienda la
                muestra como agotada. La capacidad se guarda en ml o g y se muestra en cl o kg.
            </p>
        </AdminBox>
    );
}
