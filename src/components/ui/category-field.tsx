'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlBase } from '@/components/ui/input';

export interface CategoryFieldProps {
    value: string[];
    onValueChange: (value: string[]) => void;
    placeholder?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    disabled?: boolean;
    id?: string;
    className?: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
}

const heights = {
    xs: 'min-h-control-xs px-inset-sm text-xs',
    sm: 'min-h-control-sm px-inset-md text-sm',
    md: 'min-h-control-md px-inset-lg text-sm',
    lg: 'min-h-control-lg px-inset-xl text-base',
};

/**
 * Campo para añadir categorías como pills (Figma: CategoryField).
 * Enter o coma añaden; Retroceso con el campo vacío quita la última.
 *
 * @example
 * <CategoryField value={tags} onValueChange={setTags} placeholder="Añade una etiqueta" />
 */
const CategoryField = React.forwardRef<HTMLInputElement, CategoryFieldProps>(
    ({ value, onValueChange, placeholder, size = 'md', disabled, className, ...rest }, ref) => {
        const [draft, setDraft] = React.useState('');
        const add = () => {
            const v = draft.trim();
            if (v && !value.includes(v)) onValueChange([...value, v]);
            setDraft('');
        };
        return (
            <div
                className={cn(
                    controlBase,
                    heights[size],
                    'flex flex-wrap items-center gap-gap-2xs py-1 has-focus-visible:border-ring has-focus-visible:ring-1 has-focus-visible:ring-ring has-aria-invalid:border-destructive',
                    disabled && 'border-transparent bg-muted',
                    className,
                )}
            >
                {value.map((v) => (
                    <span
                        key={v}
                        className="inline-flex h-control-xxs items-center gap-1 rounded-full border border-brand/40 bg-brand-subtle px-inset-xs text-xs font-medium text-brand"
                    >
                        {v}
                        <button
                            type="button"
                            disabled={disabled}
                            aria-label={`Quitar ${v}`}
                            onClick={() => onValueChange(value.filter((x) => x !== v))}
                            className="cursor-pointer rounded-full p-0.5 hover:bg-foreground/10"
                        >
                            <X className="size-3" aria-hidden="true" />
                        </button>
                    </span>
                ))}
                <input
                    ref={ref}
                    value={draft}
                    disabled={disabled}
                    placeholder={value.length ? undefined : placeholder}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={add}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            add();
                        } else if (e.key === 'Backspace' && !draft && value.length) {
                            onValueChange(value.slice(0, -1));
                        }
                    }}
                    className="min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    {...rest}
                />
            </div>
        );
    },
);
CategoryField.displayName = 'CategoryField';

export { CategoryField };
