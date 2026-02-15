import { CLOUDINARY_BASE_URL } from "@/constants";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CloudinaryImageProps
    extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackImage?: string;
    transformations?: string;
}

export function CloudinaryImage({
    src = "",
    alt = "Image",
    className,
    fallbackImage = "/v1735228980/cld-sample-3.jpg",
    transformations = "c_fill,g_auto,f_auto,f_webp",
    ...props
}: CloudinaryImageProps) {
    const getFormattedSrc = (url: string) => {
        if (!url) return fallbackImage;

        // Si es una URL absoluta (http/https), devolverla tal cual
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }

        if (url.startsWith(CLOUDINARY_BASE_URL)) {
            // Extraer la parte después de "/upload/"
            const path = url.replace(CLOUDINARY_BASE_URL, "");
            return getCloudinaryUrl(`${transformations}/${path}`);
        }

        return getCloudinaryUrl(`${transformations}/${url}`);
    };

    const [hasError, setHasError] = useState(false);
    const imgSrc = hasError ? fallbackImage : getFormattedSrc(src);

    const handleError = () => setHasError(true);

    const generateSrcSet = () => {
        if (!src || hasError) return "";

        // Si es una URL absoluta, no generamos srcset de Cloudinary
        if (src.startsWith("http://") || src.startsWith("https://")) {
            return "";
        }

        const SIZES = [320, 480, 800, 1200];

        const path = src.startsWith(CLOUDINARY_BASE_URL)
            ? src.replace(CLOUDINARY_BASE_URL, "")
            : src;

        return SIZES.map(
            (size) =>
                `${getCloudinaryUrl(`w_${size},${transformations}/${path}`)} ${size}w`,
        ).join(", ");
    };

    return (
        <div className={cn("relative", className)}>
            <img
                src={imgSrc}
                alt={alt}
                className={cn(
                    "h-full w-full object-cover transition-opacity duration-300",
                    hasError ? "grayscale" : "",
                )}
                onError={handleError}
                srcSet={generateSrcSet()}
                sizes="(max-width: 320px) 280px, (max-width: 480px) 440px, (max-width: 800px) 760px, 1200px"
                {...props}
            />
        </div>
    );
}
