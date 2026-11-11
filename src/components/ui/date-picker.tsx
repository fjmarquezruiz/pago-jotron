'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlBase } from '@/components/ui/input';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DatePickerProps extends Pick<CalendarProps, 'min' | 'max'> {
    value?: Date;
    onValueChange: (date: Date) => void;
    placeholder?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    disabled?: boolean;
    id?: string;
    className?: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
}

const sizes = {
    xs: 'h-control-xs px-inset-sm text-xs',
    sm: 'h-control-sm px-inset-md text-sm',
    md: 'h-control-md px-inset-lg text-sm',
    lg: 'h-control-lg px-inset-xl text-base',
};

/**
 * Campo de fecha con calendario desplegable (Figma: DatePicker).
 * Para la verificación de edad (RF2), pasa `max` = hoy menos 18 años.
 *
 * @example
 * <DatePicker value={nacimiento} onValueChange={setNacimiento} max={hace18Anios} placeholder="dd/mm/aaaa" />
 */
const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
    (
        {
            value,
            onValueChange,
            min,
            max,
            placeholder = 'dd/mm/aaaa',
            size = 'md',
            disabled,
            className,
            ...aria
        },
        ref,
    ) => {
        const [open, setOpen] = React.useState(false);
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild disabled={disabled}>
                    <button
                        ref={ref}
                        type="button"
                        className={cn(
                            controlBase,
                            sizes[size],
                            'flex cursor-pointer items-center justify-between gap-gap-xs text-left data-[state=open]:border-ring',
                            !value && 'text-muted-foreground',
                            className,
                        )}
                        {...aria}
                    >
                        {value ? new Intl.DateTimeFormat('es-ES').format(value) : placeholder}
                        <CalendarDays
                            aria-hidden="true"
                            className="size-5 shrink-0 text-muted-foreground"
                        />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto max-w-none">
                    <Calendar
                        selected={value}
                        min={min}
                        max={max}
                        onSelect={(d) => {
                            onValueChange(d);
                            setOpen(false);
                        }}
                    />
                </PopoverContent>
            </Popover>
        );
    },
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
