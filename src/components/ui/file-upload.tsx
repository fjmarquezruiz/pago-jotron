'use client';

import * as React from 'react';
import { CircleCheck, CircleX, FileText, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';

export interface FileUploadProps {
    onFiles: (files: File[]) => void;
    /** Tipos admitidos, como en `<input accept>`. */
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    /** Texto de ayuda, por ejemplo "PNG o JPG hasta 5 MB". */
    hint?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    id?: string;
    className?: string;
    'aria-describedby'?: string;
    /** Texto principal de la zona (Figma: title). */
    title?: string;
    /** Texto del enlace para elegir archivos (Figma: actionText). */
    actionText?: string;
    /** Subiendo: spinner y "Subiendo archivo…" (Figma: state=loading). */
    loading?: boolean;
    /** Mensaje de error dentro de la zona, en rojo (Figma: state=error). */
    error?: string;
    /** Archivo ya subido: la zona lo muestra en lugar del texto (Figma: state=success). */
    file?: { name: string; size: number };
    /** Quita el archivo subido. Necesario si pasas `file`. */
    onRemove?: () => void;
}

const zoneHeights = { xs: 'min-h-24', sm: 'min-h-32', md: 'min-h-40', lg: 'min-h-48' };

/**
 * Zona para arrastrar o elegir archivos (Figma: FileUpload). Es un `label` que abre
 * el selector, así funciona con teclado y lector de pantalla además de arrastrando.
 *
 * @example
 * <FileUpload accept="image/*" multiple hint="PNG o JPG hasta 5 MB" onFiles={subir} />
 */
function FileUpload({
    onFiles,
    accept,
    multiple,
    disabled,
    invalid,
    hint,
    size = 'md',
    id,
    className,
    title = 'Arrastra los archivos aquí',
    actionText = 'elígelos en tu equipo',
    loading = false,
    error,
    file,
    onRemove,
    ...aria
}: FileUploadProps) {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const [dragging, setDragging] = React.useState(false);
    if (file) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-gap-xs rounded-sm border border-input bg-card p-inset-lg text-center',
                    zoneHeights[size],
                    className,
                )}
            >
                <FileText aria-hidden="true" className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium break-all">{file.name}</span>
                <span className="flex items-center gap-gap-xs text-sm text-muted-foreground">
                    {formatBytes(file.size)}
                    {onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="cursor-pointer text-link underline underline-offset-4"
                        >
                            Quitar
                        </button>
                    )}
                </span>
            </div>
        );
    }
    const blocked = disabled || loading;
    return (
        <label
            htmlFor={inputId}
            onDragOver={(e) => {
                e.preventDefault();
                if (!blocked) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (!blocked) onFiles(Array.from(e.dataTransfer.files));
            }}
            className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-gap-xs rounded-sm border border-dashed border-input bg-card p-inset-lg text-center transition-colors hover:border-foreground/50 has-focus-visible:border-ring has-focus-visible:ring-1 has-focus-visible:ring-ring',
                zoneHeights[size],
                dragging && 'border-brand bg-brand-subtle',
                (invalid || error) && 'border-destructive',
                loading && 'cursor-progress',
                disabled && 'cursor-not-allowed border-transparent bg-muted opacity-60',
                className,
            )}
        >
            {loading ? (
                <Spinner size="md" variant="brand" label="Subiendo archivo" />
            ) : (
                <Upload aria-hidden="true" className="size-6 text-muted-foreground" />
            )}
            <span
                className={cn('text-sm font-medium', error && 'text-destructive')}
                role={error ? 'alert' : undefined}
                aria-live={loading ? 'polite' : undefined}
            >
                {loading ? 'Subiendo archivo…' : (error ?? title)}
            </span>
            {!loading && !error && (
                <span className="text-sm text-muted-foreground">
                    o <span className="text-link underline underline-offset-4">{actionText}</span>
                </span>
            )}
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            <input
                id={inputId}
                type="file"
                className="sr-only"
                accept={accept}
                multiple={multiple}
                disabled={blocked}
                aria-invalid={invalid || !!error || undefined}
                onChange={(e) => {
                    onFiles(Array.from(e.target.files ?? []));
                    e.target.value = '';
                }}
                {...aria}
            />
        </label>
    );
}

export interface FileItemProps {
    name: string;
    /** Tamaño en bytes. */
    size: number;
    status?: 'default' | 'uploading' | 'success' | 'error';
    /** Progreso de 0 a 100 mientras sube. */
    progress?: number;
    error?: string;
    onRemove?: () => void;
    className?: string;
}

/** Formatea bytes como KB o MB con coma decimal. */
function formatBytes(bytes: number): string {
    const fmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
    return bytes < 1024 * 1024
        ? `${fmt.format(bytes / 1024)} KB`
        : `${fmt.format(bytes / 1024 / 1024)} MB`;
}

/**
 * Fila de un archivo subido (Figma: FileItem): nombre, tamaño, estado, progreso y quitar.
 *
 * @example
 * <FileItem name="etiqueta.png" size={240000} status="uploading" progress={40} onRemove={quitar} />
 */
function FileItem({
    name,
    size,
    status = 'default',
    progress,
    error,
    onRemove,
    className,
}: FileItemProps) {
    const statusText = {
        default: formatBytes(size),
        uploading: `${formatBytes(size)} · Subiendo…`,
        success: `${formatBytes(size)} · Subido`,
        error: error ?? 'No se ha podido subir',
    }[status];
    return (
        <div
            className={cn(
                'flex items-center gap-gap-sm rounded-sm border bg-card px-inset-md py-inset-sm',
                status === 'error' && 'border-destructive',
                className,
            )}
        >
            {status === 'success' ? (
                <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-success" />
            ) : status === 'error' ? (
                <CircleX aria-hidden="true" className="size-5 shrink-0 text-destructive" />
            ) : (
                <FileText aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-gap-2xs">
                <span className="truncate text-sm font-medium">{name}</span>
                <span
                    className={cn(
                        'text-xs',
                        status === 'error' ? 'text-destructive' : 'text-muted-foreground',
                    )}
                >
                    {statusText}
                </span>
                {status === 'uploading' && (
                    <Progress value={progress} size="sm" aria-label={`Subiendo ${name}`} />
                )}
            </div>
            {onRemove && (
                <IconButton
                    aria-label={`Quitar ${name}`}
                    variant="ghost"
                    size="xs"
                    onClick={onRemove}
                >
                    <X />
                </IconButton>
            )}
        </div>
    );
}

export { FileUpload, FileItem };
