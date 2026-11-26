'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldControl, FieldLabel, FieldMessage } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tag } from '@/components/ui/tag';
import { inputToNumber, numberToInput } from './product-form-values';

export interface ProductGrapesFieldProps {
    /** Todas las variedades que se pueden añadir. */
    options: readonly { id: number; name: string }[];
    /** Uvas del producto con su porcentaje. */
    value: { grapeId: number; percentage: number }[];
    onChange: (value: { grapeId: number; percentage: number }[]) => void;
    /** Mensaje de error de cada uva (`errors.grapes[i].percentage`) por posición. */
    errors?: (string | undefined)[];
    /** Error del conjunto (la suma pasa de 100 %). */
    groupError?: string;
}

/**
 * Uvas del producto con su porcentaje (Figma: «variedades-porcentaje» de admin-product-edit): una
 * fila de pastillas (`Tag`) quitables con el botón «Añadir variedad» (un menú con las variedades
 * que faltan) y, debajo, un campo «Variedad (%)» por cada una, en tres columnas. La suma puede
 * ser como máximo 100 %; lo valida el esquema Zod y el error sale bajo el campo.
 */
export function ProductGrapesField({
    options,
    value,
    onChange,
    errors = [],
    groupError,
}: ProductGrapesFieldProps) {
    const nameOf = (id: number) => options.find((option) => option.id === id)?.name ?? `#${id}`;
    const available = options.filter(
        (option) => !value.some((grape) => grape.grapeId === option.id),
    );
    return (
        <div className="flex flex-col gap-3">
            <Field invalid={Boolean(groupError)}>
                <FieldLabel>Variedad de uva</FieldLabel>
                <FieldControl>
                    <div className="flex flex-wrap items-center gap-x-gap-xs gap-y-1">
                        {value.map((grape) => (
                            <Tag
                                key={grape.grapeId}
                                onRemove={() =>
                                    onChange(value.filter((item) => item.grapeId !== grape.grapeId))
                                }
                            >
                                {nameOf(grape.grapeId)}
                            </Tag>
                        ))}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    size="xxs"
                                    disabled={available.length === 0}
                                    aria-label="Añadir variedad de uva"
                                >
                                    <Plus className="size-3" aria-hidden="true" />
                                    Añadir variedad
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                                {available.map((option) => (
                                    <DropdownMenuItem
                                        key={option.id}
                                        onSelect={() =>
                                            onChange([
                                                ...value,
                                                { grapeId: option.id, percentage: Number.NaN },
                                            ])
                                        }
                                    >
                                        {option.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </FieldControl>
                <FieldMessage>{groupError}</FieldMessage>
            </Field>
            {value.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {value.map((grape, index) => (
                        <Field key={grape.grapeId} invalid={Boolean(errors[index])}>
                            <FieldLabel>{nameOf(grape.grapeId)} (%)</FieldLabel>
                            <FieldControl>
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    size="sm"
                                    className="px-inset-sm"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    value={numberToInput(grape.percentage)}
                                    onChange={(event) =>
                                        onChange(
                                            value.map((item) =>
                                                item.grapeId === grape.grapeId
                                                    ? {
                                                          ...item,
                                                          percentage: inputToNumber(
                                                              event.target.value,
                                                          ),
                                                      }
                                                    : item,
                                            ),
                                        )
                                    }
                                />
                            </FieldControl>
                            <FieldMessage>{errors[index]}</FieldMessage>
                        </Field>
                    ))}
                </div>
            )}
        </div>
    );
}
