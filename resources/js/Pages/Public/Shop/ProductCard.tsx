import { CloudinaryImage } from "@/Components/CloudinaryImage";
import { Button } from "@/Components/ui/button";
import { Vino } from "@/types/vino";
import { Link } from "@inertiajs/react";
import { IconArrowRight } from "@tabler/icons-react";

const ProductCard = ({
    product,
    handleAddToCart,
}: {
    product: Vino;
    handleAddToCart: (product: Vino) => void;
}) => {
    return (
        <div key={product.id} className="relative flex flex-col gap-2">
            <Link
                href={route("shop.detail", {
                    id: product.id,
                })}
                className="group relative aspect-square w-full overflow-hidden rounded bg-neutral-50"
            >
                <CloudinaryImage
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover object-center"
                />
                <div className="absolute bottom-0 left-0 right-0 w-full p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product);
                        }}
                        className="w-full"
                        variant="primary"
                        size="sm"
                    >
                        Quick Add{" "}
                        <IconArrowRight stroke={1.5} className="size-5" />
                    </Button>
                </div>
            </Link>
            <Link
                href={route("shop.detail", {
                    id: product.id,
                })}
            >
                <h3 className="font-lg-bold text-gray-900">{product.name}</h3>
            </Link>
            <div className="flex flex-col gap-1">
                <p className="font-base-bold text-gray-900">
                    {parseFloat(product.price).toFixed(2)} &euro;
                </p>

                <div className="flex gap-2">
                    <span className="font-xs-bold uppercase text-neutral-500">
                        {product.denominacion?.name || "Unknown region"}
                    </span>
                    <span className="font-xs-bold text-gray-500">
                        {product.categoria?.name || "Unknown category"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
