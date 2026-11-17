'use client';

import { useEffect, useRef, useState } from 'react';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { SearchInput } from '@/components/ui/search-input';
import { SEARCH_MAX_LENGTH } from '@/lib/catalog/filter-constants';

/** Lo que se espera tras dejar de escribir antes de buscar. */
const SEARCH_DEBOUNCE_MS = 400;

interface CatalogSearchProps {
    /** Texto de la búsqueda activa en la URL. */
    q: string | undefined;
    /** Aplica la búsqueda (`undefined` = quitarla). */
    onSearch: (q: string | undefined) => void;
}

/**
 * Buscador del listado (Figma: Field "Buscar" con SearchInput). Busca solo, un momento después de
 * dejar de escribir, o al instante con Intro o con el botón de limpiar; así no hay una navegación
 * por cada letra. Si la búsqueda cambia desde fuera (el chip, "Borrar todo", el botón Atrás), el
 * campo la refleja.
 *
 * @example
 * <CatalogSearch q={filters.q} onSearch={(q) => apply(setFilter(filters, 'q', q))} />
 */
export function CatalogSearch({ q, onSearch }: CatalogSearchProps) {
    const [value, setValue] = useState(q ?? '');
    // Último texto que ya está en la URL (o en camino): distingue un cambio de fuera de lo que
    // acabamos de aplicar nosotros, que no hay que volver a copiar al campo.
    const applied = useRef(q ?? '');

    useEffect(() => {
        const fromUrl = q ?? '';
        if (fromUrl === applied.current) return;
        applied.current = fromUrl;
        setValue(fromUrl);
    }, [q]);

    useEffect(() => {
        const text = value.trim();
        if (text === applied.current) return;
        const timer = setTimeout(() => {
            applied.current = text;
            onSearch(text || undefined);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [value, onSearch]);

    const search = (text: string) => {
        applied.current = text;
        onSearch(text || undefined);
    };

    return (
        <form
            role="search"
            onSubmit={(event) => {
                event.preventDefault();
                search(value.trim());
            }}
        >
            <Field>
                <FieldLabel className="text-muted-foreground">Buscar</FieldLabel>
                <FieldControl>
                    <SearchInput
                        name="q"
                        autoComplete="off"
                        placeholder="Buscar por"
                        maxLength={SEARCH_MAX_LENGTH}
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        onClear={() => {
                            setValue('');
                            search('');
                        }}
                    />
                </FieldControl>
            </Field>
        </form>
    );
}
