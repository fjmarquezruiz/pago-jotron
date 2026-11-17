'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { SearchInput } from '@/components/ui/search-input';
import { SEARCH_MAX_LENGTH } from '@/lib/catalog/filter-constants';

/** Lo que se espera tras dejar de escribir antes de buscar. */
const SEARCH_DEBOUNCE_MS = 400;

/** Cómo entra un cambio de la búsqueda en el historial del navegador. */
export type SearchHistoryMode = 'push' | 'replace';

interface CatalogSearchProps {
    /** Texto de la búsqueda activa en la URL. */
    q: string | undefined;
    /**
     * Aplica la búsqueda (`undefined` = quitarla). `mode` es `'replace'` cuando solo se afina una
     * búsqueda que ya estaba (la entrada del historial se reescribe) y `'push'` cuando se empieza
     * o se quita (entrada nueva).
     */
    onSearch: (q: string | undefined, mode: SearchHistoryMode) => void;
}

/**
 * Buscador del listado (Figma: Field "Buscar" con SearchInput). Busca solo, un momento después de
 * dejar de escribir, o al instante con Intro o con el botón de limpiar; así no hay una navegación
 * por cada letra. Si la búsqueda cambia desde fuera (el chip, "Borrar todo", el botón Atrás), el
 * campo la refleja.
 *
 * Historial: buscar es una sola decisión, no una por cada pausa al escribir. Empezar la búsqueda
 * y quitarla añaden una entrada (`'push'`); afinar una que ya estaba ("tin" → "tinto" → "tinto
 * roble") reescribe la suya (`'replace'`). Así Atrás vuelve al listado de antes de buscar, sin
 * recorrer los textos intermedios.
 *
 * @example
 * <CatalogSearch q={filters.q} onSearch={(q, mode) => apply(setFilter(filters, 'q', q), mode)} />
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

    const apply = useCallback(
        (text: string) => {
            // Afinar una búsqueda ya aplicada reescribe su entrada del historial; empezarla o
            // quitarla es una decisión y añade una nueva.
            const refining = applied.current !== '' && text !== '';
            applied.current = text;
            onSearch(text || undefined, refining ? 'replace' : 'push');
        },
        [onSearch],
    );

    useEffect(() => {
        const text = value.trim();
        if (text === applied.current) return;
        const timer = setTimeout(() => apply(text), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [value, apply]);

    return (
        <form
            role="search"
            onSubmit={(event) => {
                event.preventDefault();
                apply(value.trim());
            }}
        >
            <Field>
                <FieldLabel className="text-muted-foreground">Buscar</FieldLabel>
                <FieldControl>
                    <SearchInput
                        name="q"
                        autoComplete="off"
                        placeholder="Nombre o descripción"
                        maxLength={SEARCH_MAX_LENGTH}
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        onClear={() => {
                            setValue('');
                            apply('');
                        }}
                    />
                </FieldControl>
            </Field>
        </form>
    );
}
