'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input, type InputProps } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

/** Prefijos más habituales para la tienda (España primero). */
const DEFAULT_PREFIXES = [
    { value: '+34', label: '🇪🇸 +34' },
    { value: '+351', label: '🇵🇹 +351' },
    { value: '+33', label: '🇫🇷 +33' },
    { value: '+49', label: '🇩🇪 +49' },
    { value: '+44', label: '🇬🇧 +44' },
];

export interface PhoneInputProps extends Omit<InputProps, 'type' | 'startIcon' | 'endIcon'> {
    prefix: string;
    onPrefixChange: (prefix: string) => void;
    prefixes?: { value: string; label: string }[];
}

/**
 * Teléfono con selector de prefijo + número (Figma: PhoneInput).
 * El `ref` y el resto de props van al campo del número (compatible con `register()`).
 *
 * @example
 * <PhoneInput prefix={prefix} onPrefixChange={setPrefix} {...register('telefono')} />
 */
const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    (
        {
            prefix,
            onPrefixChange,
            prefixes = DEFAULT_PREFIXES,
            size,
            className,
            disabled,
            ...props
        },
        ref,
    ) => (
        <div className={cn('flex w-full gap-gap-xs', className)}>
            <Select value={prefix} onValueChange={onPrefixChange} disabled={disabled}>
                <SelectTrigger
                    size={size}
                    variant="compact"
                    aria-label="Prefijo"
                    className="shrink-0"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {prefixes.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                            {p.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                ref={ref}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                size={size}
                disabled={disabled}
                {...props}
            />
        </div>
    ),
);
PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
