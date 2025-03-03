import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getCloudinaryUrl } from "@/lib/cloudinary";

interface CloudinaryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackImage?: string;
    transformations?: string;
}

export function CloudinaryImage({
    src,
    alt,
    className,
    fallbackImage = "https://res.cloudinary.com/dtw0se3wn/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1735228980/cld-sample-3.jpg",
    transformations = "c_fill,g_auto",
    ...props
}: CloudinaryImageProps) {
    const [imgSrc, setImgSrc] = useState(
        src.startsWith('http') ? src : getCloudinaryUrl(`${transformations}/${src}`)
    );
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src);
        setIsLoading(true);
        setHasError(false);
    }, [src]);

    const handleError = () => {
        if (imgSrc !== fallbackImage) {
            setHasError(true);
            setImgSrc(fallbackImage);
        }
        setIsLoading(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    return (
        <div className={cn("relative", className)}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                </div>
            )}
            <img
                src={imgSrc}
                alt={alt}
                className={cn(
                    "object-cover transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    hasError ? "grayscale" : ""
                )}
                onError={handleError}
                onLoad={handleLoad}
                {...props}
            />
        </div>
    );
} 