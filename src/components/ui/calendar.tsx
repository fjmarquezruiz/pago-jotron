'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/button';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const monthName = (m: number) =>
    new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2000, m, 1));

/** Compara dos fechas por día, ignorando la hora. */
function sameDay(a?: Date, b?: Date): boolean {
    return (
        !!a &&
        !!b &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/** Quita la hora de una fecha para comparar por días. */
function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface CalendarProps {
    selected?: Date;
    onSelect: (date: Date) => void;
    /** Primer día elegible (incluido). */
    min?: Date;
    /** Último día elegible (incluido). Para la fecha de nacimiento: hoy menos 18 años. */
    max?: Date;
    className?: string;
}

/**
 * Rejilla mensual (Figma: _Calendar / _CalendarDay). Semana de lunes a domingo,
 * selectores de mes y año para saltar rápido (útil en la fecha de nacimiento) y
 * navegación con flechas del teclado.
 *
 * @example
 * <Calendar selected={fecha} onSelect={setFecha} max={hace18Anios} />
 */
function Calendar({ selected, onSelect, min, max, className }: CalendarProps) {
    const today = new Date();
    const initial = selected ?? (max && max < today ? max : today);
    const [view, setView] = React.useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
    const [focused, setFocused] = React.useState<Date>(selected ?? initial);
    const gridRef = React.useRef<HTMLDivElement>(null);

    const year = view.getFullYear();
    const month = view.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - offset + i));

    const isDisabled = (d: Date) =>
        (min && d < startOfDay(min)) || (max && d > startOfDay(max)) || false;
    const minYear = min?.getFullYear() ?? today.getFullYear() - 100;
    const maxYear = max?.getFullYear() ?? today.getFullYear() + 5;
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

    const moveFocus = (d: Date) => {
        setFocused(d);
        if (d.getMonth() !== month || d.getFullYear() !== year)
            setView(new Date(d.getFullYear(), d.getMonth(), 1));
        requestAnimationFrame(() =>
            gridRef.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus(),
        );
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
        if (delta === undefined) return;
        e.preventDefault();
        moveFocus(new Date(focused.getFullYear(), focused.getMonth(), focused.getDate() + delta));
    };

    const selectClass =
        'h-control-xs cursor-pointer rounded-sm border border-input bg-card px-inset-xs text-sm capitalize hover:border-foreground/50';

    return (
        <div className={cn('flex w-72 flex-col gap-gap-sm', className)}>
            <div className="flex items-center justify-between gap-gap-xs">
                <IconButton
                    aria-label="Mes anterior"
                    variant="ghost"
                    size="xs"
                    onClick={() => setView(new Date(year, month - 1, 1))}
                >
                    <ChevronLeft />
                </IconButton>
                <div className="flex gap-gap-2xs">
                    <select
                        aria-label="Mes"
                        className={selectClass}
                        value={month}
                        onChange={(e) => setView(new Date(year, Number(e.target.value), 1))}
                    >
                        {Array.from({ length: 12 }, (_, m) => (
                            <option key={m} value={m}>
                                {monthName(m)}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="Año"
                        className={selectClass}
                        value={year}
                        onChange={(e) => setView(new Date(Number(e.target.value), month, 1))}
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
                <IconButton
                    aria-label="Mes siguiente"
                    variant="ghost"
                    size="xs"
                    onClick={() => setView(new Date(year, month + 1, 1))}
                >
                    <ChevronRight />
                </IconButton>
            </div>
            <div
                role="grid"
                ref={gridRef}
                onKeyDown={onKeyDown}
                className="grid grid-cols-7 gap-0.5"
            >
                {WEEKDAYS.map((w, i) => (
                    <abbr
                        key={w}
                        title={WEEKDAYS_LONG[i]}
                        className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground no-underline"
                    >
                        {w}
                    </abbr>
                ))}
                {days.map((d) => {
                    const outside = d.getMonth() !== month;
                    const isSel = sameDay(d, selected);
                    const isToday = sameDay(d, today);
                    const disabled = isDisabled(d);
                    return (
                        <button
                            key={d.toISOString()}
                            type="button"
                            role="gridcell"
                            tabIndex={sameDay(d, focused) ? 0 : -1}
                            disabled={disabled}
                            aria-selected={isSel}
                            aria-current={isToday ? 'date' : undefined}
                            aria-label={new Intl.DateTimeFormat('es-ES', {
                                dateStyle: 'full',
                            }).format(d)}
                            onClick={() => {
                                setFocused(d);
                                onSelect(d);
                            }}
                            className={cn(
                                'flex size-10 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground/50 disabled:hover:bg-transparent',
                                outside && 'font-normal text-muted-foreground',
                                isToday && !isSel && 'border border-ring',
                                isSel && 'bg-brand text-brand-foreground hover:bg-brand/90',
                            )}
                        >
                            {d.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export { Calendar, sameDay };
