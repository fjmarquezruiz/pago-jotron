'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';

export interface SearchInputProps extends Omit<InputProps, 'type' | 'startIcon' | 'endIcon'> {
    /** Se llama al pulsar el botón de limpiar. Si no se pasa, el botón no aparece. */
    onClear?: () => void;
}

/**
 * Campo de búsqueda con lupa y botón de limpiar (Figma: SearchInput).
 * Envuélvelo en un `<form role="search">` cuando busque en toda la tienda.
 *
 * @example
 * <SearchInput aria-label="Buscar vinos" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} />
 */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ onClear, value, ...props }, ref) => {
        const hasValue = value !== undefined && value !== '';
        return (
            <Input
                ref={ref}
                type="search"
                value={value}
                startIcon={<Search />}
                endIcon={
                    onClear && hasValue ? (
                        <button
                            type="button"
                            onClick={onClear}
                            aria-label="Limpiar búsqueda"
                            className="inline-flex cursor-pointer items-center justify-center rounded-sm p-0.5 hover:bg-accent hover:text-foreground"
                        >
                            <X />
                        </button>
                    ) : undefined
                }
                className="[&_input::-webkit-search-cancel-button]:appearance-none"
                {...props}
            />
        );
    },
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
