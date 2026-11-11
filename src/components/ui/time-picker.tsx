'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface TimePickerProps {
    value?: string;
    onValueChange: (value: string) => void;
    /** Hora de inicio en formato HH:MM. Por defecto, 09:00. */
    from?: string;
    /** Hora final incluida. Por defecto, 20:00. */
    to?: string;
    /** Minutos entre opciones. Por defecto, 30. */
    step?: number;
    placeholder?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    disabled?: boolean;
    id?: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
}

/** Pasa "HH:MM" a minutos desde medianoche. */
const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

/**
 * Selector de hora (Figma: TimePicker / _TimeList), por ejemplo para reservar una visita.
 * Genera las horas entre `from` y `to` cada `step` minutos.
 *
 * @example
 * <TimePicker value={hora} onValueChange={setHora} from="10:00" to="18:00" step={60} />
 */
function TimePicker({
    value,
    onValueChange,
    from = '09:00',
    to = '20:00',
    step = 30,
    placeholder = 'hh:mm',
    size,
    disabled,
    ...aria
}: TimePickerProps) {
    const times: string[] = [];
    for (let t = toMinutes(from); t <= toMinutes(to); t += step) {
        times.push(
            `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`,
        );
    }
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger size={size} {...aria}>
                <span className="flex items-center gap-gap-xs">
                    <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
                    <SelectValue placeholder={placeholder} />
                </span>
            </SelectTrigger>
            <SelectContent className="max-h-60">
                {times.map((t) => (
                    <SelectItem key={t} value={t}>
                        {t}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export { TimePicker };
