'use client';

import { useId } from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FilterChoice } from '@/lib/catalog/active-filters';

interface CatalogFilterSelectProps {
    /** Nombre del filtro ("Tipología"): placeholder del select y nombre accesible. */
    label: string;
    /** Valor elegido como texto, o `undefined` si el filtro no está activo. */
    value: string | undefined;
    choices: FilterChoice[];
    onChange: (value: string) => void;
    /**
     * `false` (por defecto): select compacto sin etiqueta, para la barra de filtros. `true`: select
     * a todo el ancho con la etiqueta encima, para el Drawer.
     */
    labelled?: boolean;
    /** Ancho del select compacto (Figma: 130-180 px según el filtro). */
    className?: string;
}

/**
 * Select de un filtro del listado (Figma: Select, variante compact en la barra de filtros). El
 * placeholder es el nombre del filtro y, una vez elegido, enseña el valor. Sin opciones, queda
 * desactivado: no hay nada que elegir. No hay opción para vaciarlo: se quita con su chip o con
 * "Borrar todo".
 *
 * @example
 * <CatalogFilterSelect label="Bodega" value="2" choices={choices} onChange={setBodega} />
 */
export function CatalogFilterSelect({
    label,
    value,
    choices,
    onChange,
    labelled = false,
    className,
}: CatalogFilterSelectProps) {
    const id = useId();
    const select = (
        <Select value={value ?? ''} onValueChange={onChange} disabled={choices.length === 0}>
            {labelled ? (
                <SelectTrigger id={id}>
                    <SelectValue placeholder={label} />
                </SelectTrigger>
            ) : (
                <SelectTrigger variant="compact" aria-label={label} className={className}>
                    <SelectValue placeholder={label} />
                </SelectTrigger>
            )}
            <SelectContent className="w-auto max-w-80">
                {choices.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                        {choice.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    if (!labelled) return select;
    return (
        <div className="flex flex-col gap-gap-xs">
            <Label htmlFor={id} size="sm" className="text-muted-foreground">
                {label}
            </Label>
            {select}
        </div>
    );
}
