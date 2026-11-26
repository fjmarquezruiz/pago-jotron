'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CloudinaryImage } from '@/components/ui/cloudinary-image';
import { FileUpload } from '@/components/ui/file-upload';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { uploadProductImage } from './product-requests';

export interface ProductImageFieldProps {
    /** `public_id` de la imagen en Cloudinary (`products.image`), o `null` si no hay. */
    value: string | null;
    onChange: (value: string | null) => void;
    /** Texto alternativo de la imagen: el nombre del producto. */
    alt: string;
}

/**
 * Imagen del producto (Figma: «Imagen del producto» de admin-product-edit): una caja con borde de
 * 1 px y 24 px de relleno con la imagen de 213 × 320 px, debajo el nombre del archivo y «Limpiar».
 * Sin imagen se ofrece la zona de subida (`FileUpload`). La subida es firmada: el servidor firma y
 * el navegador sube el archivo directamente a Cloudinary (`uploadProductImage`); aquí solo se
 * guarda el `public_id` que devuelve, que se envía con el resto del formulario al guardar.
 */
export function ProductImageField({ value, onChange, alt }: ProductImageFieldProps) {
    const id = useId();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string>();

    async function upload([file]: File[]) {
        if (!file) return;
        setError(undefined);
        setUploading(true);
        const outcome = await uploadProductImage(file);
        setUploading(false);
        if (outcome.kind === 'uploaded') onChange(outcome.publicId);
        else if (outcome.kind === 'rejected') setError(outcome.message);
        else toast.error('No se ha podido subir la imagen. Inténtalo de nuevo.');
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-gap-xs">
                <Label htmlFor={value ? undefined : id} className="flex-1">
                    Imagen del producto
                </Label>
                <span className="text-xs text-muted-foreground">Opcional</span>
            </div>
            {value ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-input bg-card p-6">
                    <div className="relative h-80 w-53.25">
                        <CloudinaryImage
                            src={value}
                            alt={alt ? `Imagen de ${alt}` : 'Imagen del producto'}
                            fill
                            sizes="214px"
                            className="object-cover"
                        />
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-xs text-muted-foreground">
                            {value.split('/').pop()}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="xxs"
                            onClick={() => onChange(null)}
                        >
                            Limpiar
                        </Button>
                    </div>
                </div>
            ) : (
                <FileUpload
                    id={id}
                    accept="image/jpeg,image/png,image/webp"
                    hint="JPG, PNG o WebP de hasta 5 MB"
                    loading={uploading}
                    error={error}
                    onFiles={(files) => void upload(files)}
                />
            )}
        </div>
    );
}
