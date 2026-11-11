'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OTPInputProps {
    value: string;
    onValueChange: (value: string) => void;
    /** Número de dígitos. Por defecto, 6. */
    length?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    disabled?: boolean;
    invalid?: boolean;
    /** Texto accesible del grupo, por ejemplo "Código de verificación". */
    'aria-label'?: string;
    className?: string;
}

const cellSizes = {
    xs: 'h-9 w-7 text-sm',
    sm: 'h-11 w-9 text-base',
    md: 'h-13 w-11 text-lg',
    lg: 'h-16 w-13 text-xl',
};

/**
 * Código de un solo uso por dígitos (Figma: OTPInput / _OTPCell).
 * Salta solo a la siguiente casilla, admite pegar el código entero y borrar hacia atrás.
 *
 * @example
 * <OTPInput aria-label="Código de verificación" value={code} onValueChange={setCode} />
 */
function OTPInput({
    value,
    onValueChange,
    length = 6,
    size = 'md',
    disabled,
    invalid,
    className,
    ...props
}: OTPInputProps) {
    const refs = React.useRef<(HTMLInputElement | null)[]>([]);
    const chars = value.padEnd(length, ' ').slice(0, length).split('');

    const setAt = (i: number, ch: string) => {
        const next = chars.slice();
        next[i] = ch || ' ';
        onValueChange(next.join('').trimEnd());
    };

    return (
        <div
            role="group"
            aria-label={props['aria-label']}
            className={cn('flex gap-gap-xs', className)}
        >
            {chars.map((ch, i) => (
                <input
                    key={i}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                    value={ch.trim()}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    disabled={disabled}
                    aria-label={`Dígito ${i + 1} de ${length}`}
                    aria-invalid={invalid || undefined}
                    onChange={(e) => {
                        const digit = e.target.value.replace(/\D/g, '').slice(-1);
                        setAt(i, digit);
                        if (digit && i < length - 1) refs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !ch.trim() && i > 0)
                            refs.current[i - 1]?.focus();
                        if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
                        if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
                    }}
                    onPaste={(e) => {
                        const digits = e.clipboardData
                            .getData('text')
                            .replace(/\D/g, '')
                            .slice(0, length);
                        if (!digits) return;
                        e.preventDefault();
                        onValueChange(digits);
                        refs.current[Math.min(digits.length, length - 1)]?.focus();
                    }}
                    className={cn(
                        'rounded-sm border border-input bg-card text-center font-medium tabular-nums transition-colors hover:border-foreground/50 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted aria-invalid:border-destructive',
                        cellSizes[size],
                    )}
                />
            ))}
        </div>
    );
}

export { OTPInput };
