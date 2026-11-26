'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchInput } from '@/components/ui/search-input';

/** Un chip de «Filtros activos:». */
export interface AdminFilterChip {
    label: string;
    /** `solid` para los filtros (por defecto); `outline` para la búsqueda de texto. */
    variant?: 'solid' | 'outline';
}

export interface AdminListFiltersProps {
    /** Chips de los filtros vigentes, tal como se leen de la URL (Figma: «Estado: todos»). */
    chips: AdminFilterChip[];
    /** Adónde lleva «Limpiar todo» (el listado sin parámetros). */
    clearHref: string;
    /** Texto buscado ahora (de la URL), o `undefined`. */
    query?: string;
    /** Busca: quien llama navega con la URL nueva y la página 1. Se llama con `''` al vaciar el campo. */
    onSearch: (text: string) => void;
    /** `aria-label` del campo de búsqueda: «Buscar bodegas». */
    searchLabel: string;
    /** Marcador del campo; Figma: «Buscar...». */
    searchPlaceholder?: string;
    /**
     * Contenido del popover «Filtrar» (los campos y su botón «Aplicar»); `close` lo cierra. Sin
     * esto no se pinta el botón «Filtrar».
     */
    filterPanel?: (close: () => void) => React.ReactNode;
    /** Se llama al abrir el popover, para que los campos partan de lo que dice la URL. */
    onFilterOpen?: () => void;
    /** Botón de crear a la derecha («Nueva bodega»); recibe el tamaño de la barra. */
    action?: (size: 'xs' | 'sm') => React.ReactNode;
}

/**
 * Barra de filtros de los listados del catálogo (Figma: FilterBar de wineries-list-search-open):
 * a la izquierda «Filtros activos:» con un chip por filtro y «Limpiar todo»; a la derecha «Filtrar»
 * (popover), la búsqueda y el botón de crear. La búsqueda empieza como una lupa y, al pulsarla, se
 * abre un campo de 176 px en su hueco; con ella abierta toda la barra pasa de la escala `xs` (32 px,
 * texto de 12 px) a la `sm` (36 px, texto de 14 px). No sabe de URLs ni de campos: es el modelo de
 * `AdminUsersFilters`, hecho genérico.
 *
 * @example
 * <AdminListFilters chips={[{ label: 'Estado: todos' }]} clearHref="/admin/bodegas"
 *     query={q} onSearch={(text) => router.push(href({ q: text }))} searchLabel="Buscar bodegas"
 *     action={(size) => <Button asChild variant="default" size={size}><Link href="/admin/bodegas/nueva">Nueva bodega</Link></Button>} />
 */
export function AdminListFilters({
    chips,
    clearHref,
    query,
    onSearch,
    searchLabel,
    searchPlaceholder = 'Buscar...',
    filterPanel,
    onFilterOpen,
    action,
}: AdminListFiltersProps) {
    const [open, setOpen] = useState(false);
    const [searching, setSearching] = useState(Boolean(query));
    const [text, setText] = useState(query ?? '');
    const size = searching ? 'sm' : 'xs';
    const textSize = searching ? 'text-sm' : 'text-xs';

    const search = (value: string) => onSearch(value.trim());

    return (
        <div className="flex flex-wrap items-center justify-between gap-x-gap-md gap-y-gap-xs">
            <div className="flex flex-wrap items-center gap-gap-sm">
                <p className={`${textSize} text-muted-foreground`}>Filtros activos:</p>
                {chips.map(({ label, variant = 'solid' }) => (
                    <Badge
                        key={label}
                        variant={variant}
                        tone={variant === 'outline' ? 'neutral' : undefined}
                        className="max-w-none"
                    >
                        {label}
                    </Badge>
                ))}
                <Link
                    href={clearHref}
                    className={`inline-flex min-h-6 items-center border-b border-foreground ${textSize} font-medium`}
                >
                    Limpiar todo
                </Link>
            </div>
            <div className="flex items-center gap-gap-sm">
                {filterPanel && (
                    <Popover
                        open={open}
                        onOpenChange={(next) => {
                            if (next) onFilterOpen?.();
                            setOpen(next);
                        }}
                    >
                        <PopoverTrigger asChild>
                            <Button variant="outline" size={size}>
                                Filtrar
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-90">
                            {filterPanel(() => setOpen(false))}
                        </PopoverContent>
                    </Popover>
                )}
                {searching ? (
                    <form
                        role="search"
                        className="w-44"
                        onSubmit={(event) => {
                            event.preventDefault();
                            search(text);
                        }}
                    >
                        <SearchInput
                            aria-label={searchLabel}
                            placeholder={searchPlaceholder}
                            size="sm"
                            autoFocus={!query}
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            onClear={() => {
                                setText('');
                                if (query) search('');
                            }}
                        />
                    </form>
                ) : (
                    <IconButton
                        aria-label={searchLabel}
                        variant="outline"
                        size="xs"
                        onClick={() => setSearching(true)}
                    >
                        <Search className="size-3.5" />
                    </IconButton>
                )}
                {action?.(size)}
            </div>
        </div>
    );
}
