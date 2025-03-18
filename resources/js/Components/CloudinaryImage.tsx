import { getCloudinaryUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CloudinaryImageProps
    extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackImage?: string;
    transformations?: string;
}

export function CloudinaryImage({
    src,
    alt,
    className,
    fallbackImage = `/v1735228980/cld-sample-3.jpg`,
    // fallbackImage = `${CLOUDINARY_BASE_URL}/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1735228980/cld-sample-3.jpg`,
    transformations = "c_fill,g_auto,f_auto,f_webp",
    ...props
}: CloudinaryImageProps) {
    const [imgSrc, setImgSrc] = useState(
        src.startsWith("http")
            ? src
            : getCloudinaryUrl(`${transformations}/${src}`),
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

    // Function to generate srcSet for responsive images
    const generateSrcSet = () => {
        const SIZES = [320, 480, 800, 1200]; // Define your desired sizes
        return SIZES.map(
            (size) =>
                `${getCloudinaryUrl(`w_${size},${transformations}/${src}`)} ${size}w`,
        ).join(", ");
    };

    return (
        <div className={cn("relative", className)}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                </div>
            )}
            {/* <img
                src={imgSrc}
                alt={alt}
                className={cn(
                    "h-full w-full object-cover transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    hasError ? "grayscale" : "",
                )}
                onError={handleError}
                onLoad={handleLoad}
                {...props}
            /> */}

            <img
                src={imgSrc}
                alt={alt}
                className={cn(
                    "h-full w-full object-cover transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    hasError ? "grayscale" : "",
                )}
                onError={handleError}
                onLoad={handleLoad}
                srcSet={generateSrcSet()} // Add srcSet for responsive images
                sizes="(max-width: 320px) 280px, (max-width: 480px) 440px, (max-width: 800px) 760px, 1200px" // Define sizes for different breakpoints
                {...props}
            />

            {/* <picture>
                <source
                    srcSet={generateSrcSet()} // Responsive images for different sizes
                    type="image/webp" // WebP format
                />
                <source
                    srcSet={generateSrcSet()} // Fallback for other formats
                    type="image/png" // PNG format
                />
                <source
                    srcSet={generateSrcSet()} // Fallback for other formats
                    type="image/jpeg" // JPEG format
                />
                <img
                    src={imgSrc}
                    alt={alt}
                    className={cn(
                        "h-full w-full object-cover transition-opacity duration-300",
                        isLoading ? "opacity-0" : "opacity-100",
                        hasError ? "grayscale" : "",
                    )}
                    onError={handleError}
                    onLoad={handleLoad}
                    {...props}
                />
            </picture> */}
        </div>
    );
}
