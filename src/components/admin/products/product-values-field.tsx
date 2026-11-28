'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel, FieldMessage } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tag } from '@/components/ui/tag';
import { cn } from '@/lib/utils';

export interface ProductValuesFieldProps {
    /** Rótulo del campo («Categorías», «Etiquetas de cata»). */
    label: string;
    /** Texto del botón («Añadir categoría»). */
    addLabel: string;
    /** Nombre accesible del botón y del buscador («categoría», «etiqueta de cata»). */
    noun: string;
    /** Valores que ya existen en la BD, para elegir entre ellos. */
    options: readonly string[];
    /** Nombres elegidos para el producto. */
    value: string[];
    onChange: (value: string[]) => void;
    /** Longitud máxima de un valor nuevo (la de la columna `name`). */
    maxLength: number;
    /** Error del conjunto o de un valor. */
    error?: string;
    className?: string;
}

/** Compara nombres como los compara la BD: sin mayúsculas ni espacios de más. */
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Valores asociados de un producto que se eligen entre los existentes o se crean al momento
 * (Figma: «Categorías» y «Etiquetas de cata» de admin-product-edit): una fila de pastillas (`Tag`)
 * quitables con un botón de añadir (`Button` xxs). El botón abre un panel con un buscador, los
 * valores que faltan y, si lo escrito no existe, «Crear «…»». Los valores viajan por su nombre:
 * el servidor crea los que aún no existen al guardar el producto.
 *
 * @example
 * <ProductValuesField label="Categorías" addLabel="Añadir categoría" noun="categoría"
 *     options={options.categories} value={field.value} onChange={field.onChange} maxLength={100} />
 */
export function ProductValuesField({
    label,
    addLabel,
    noun,
    options,
    value,
    onChange,
    maxLength,
    error,
    className,
}: ProductValuesFieldProps) {
    const searchId = useId();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const typed = query.trim();
    const available = options.filter(
        (option) =>
            !value.some((item) => same(item, option)) &&
            option.toLowerCase().includes(typed.toLowerCase()),
    );
    const canCreate =
        typed !== '' &&
        !options.some((option) => same(option, typed)) &&
        !value.some((item) => same(item, typed));

    function add(name: string) {
        onChange([...value, name]);
        setQuery('');
        setOpen(false);
    }

    return (
        <Field className={className} invalid={Boolean(error)}>
            <FieldLabel indicator="optional" className="w-full [&>span]:ml-auto">
                {label}
            </FieldLabel>
            <FieldControl>
                <div className="flex flex-wrap items-center gap-x-gap-xs gap-y-1">
                    {value.map((name) => (
                        <Tag key={name} onRemove={() => onChange(value.filter((v) => v !== name))}>
                            {name}
                        </Tag>
                    ))}
                    <Popover
                        open={open}
                        onOpenChange={(next) => {
                            setOpen(next);
                            if (!next) setQuery('');
                        }}
                    >
                        <PopoverTrigger asChild>
                            <Button type="button" size="xxs" aria-label={`Añadir ${noun}`}>
                                <Plus className="size-3" aria-hidden="true" />
                                {addLabel}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="flex flex-col gap-gap-xs">
                            <label htmlFor={searchId} className="sr-only">
                                Buscar o crear {noun}
                            </label>
                            <Input
                                id={searchId}
                                size="xs"
                                value={query}
                                maxLength={maxLength}
                                placeholder={`Buscar o crear ${noun}`}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key !== 'Enter') return;
                                    event.preventDefault();
                                    if (canCreate) add(typed);
                                    else if (available.length === 1 && available[0] !== undefined)
                                        add(available[0]);
                                }}
                            />
                            <ul className="flex max-h-56 flex-col overflow-y-auto">
                                {available.map((option) => (
                                    <li key={option}>
                                        <button
                                            type="button"
                                            onClick={() => add(option)}
                                            className={cn(
                                                'w-full cursor-pointer rounded-sm px-inset-sm py-inset-xs text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                            )}
                                        >
                                            {option}
                                        </button>
                                    </li>
                                ))}
                                {canCreate && (
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => add(typed)}
                                            className="w-full cursor-pointer rounded-sm px-inset-sm py-inset-xs text-left text-sm text-brand hover:bg-brand-subtle focus-visible:bg-brand-subtle focus-visible:outline-none"
                                        >
                                            Crear «{typed}»
                                        </button>
                                    </li>
                                )}
                                {available.length === 0 && !canCreate && (
                                    <li className="px-inset-sm py-inset-xs text-sm text-muted-foreground">
                                        No hay más valores
                                    </li>
                                )}
                            </ul>
                        </PopoverContent>
                    </Popover>
                </div>
            </FieldControl>
            <FieldMessage>{error}</FieldMessage>
        </Field>
    );
}
