'use client';

import { useId } from 'react';
import {
    Controller,
    useFormState,
    type Control,
    type FieldErrors,
    type FieldValues,
    type Path,
} from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

/** Campos del formulario que rellenan los tres desplegables. */
type BirthFields = { birthDay: string; birthMonth: string; birthYear: string };

const MONTHS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const NAMES = ['birthDay', 'birthMonth', 'birthYear'] as const;

export interface BirthDateSelectsProps<T extends FieldValues & BirthFields> {
    /** `control` de React Hook Form de un formulario con `birthDay`, `birthMonth` y `birthYear`. */
    control: Control<T>;
    /** Muestra "Día", "Mes" y "Año" encima de cada desplegable. Sin ello, usan `aria-label`. */
    showLabels?: boolean;
}

/**
 * Día, mes y año de la fecha de nacimiento (Figma: day, month y year dropdown). Los comparten el
 * registro y la verificación de edad. Los valores son texto: día `1`-`31`, mes `1`-`12` y año.
 *
 * @example
 * <BirthDateSelects control={control} showLabels />
 */
export function BirthDateSelects<T extends FieldValues & BirthFields>({
    control,
    showLabels = false,
}: BirthDateSelectsProps<T>) {
    const baseId = useId();
    const { errors } = useFormState({ control, name: NAMES as unknown as Path<T>[] });
    const fieldErrors = errors as FieldErrors<BirthFields>;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 101 }, (_, i) => String(currentYear - i));

    const fields = [
        { name: 'birthDay', label: 'Día', placeholder: 'DD', options: DAYS },
        {
            name: 'birthMonth',
            label: 'Mes',
            placeholder: 'MM',
            options: MONTHS.map((_, i) => String(i + 1)),
        },
        { name: 'birthYear', label: 'Año', placeholder: 'AAAA', options: years },
    ] as const;

    return (
        <div className="grid grid-cols-3 gap-x-6">
            {fields.map(({ name, label, placeholder, options }) => (
                <div key={name} className="flex min-w-0 flex-col gap-2">
                    {showLabels && (
                        <Label htmlFor={`${baseId}-${name}`} className="text-muted-foreground">
                            {label}
                        </Label>
                    )}
                    <Controller
                        control={control}
                        name={name as Path<T>}
                        render={({ field }) => (
                            <Select
                                value={(field.value as string) || undefined}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger
                                    id={`${baseId}-${name}`}
                                    ref={field.ref}
                                    onBlur={field.onBlur}
                                    aria-label={showLabels ? undefined : label}
                                    aria-invalid={!!fieldErrors[name] || undefined}
                                    className="data-placeholder:text-foreground [&_svg]:text-foreground"
                                >
                                    <SelectValue placeholder={placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {name === 'birthMonth'
                                                ? MONTHS[Number(value) - 1]
                                                : value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            ))}
        </div>
    );
}
