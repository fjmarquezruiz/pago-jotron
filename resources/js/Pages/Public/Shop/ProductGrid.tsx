"use client";

import { Button } from "@/Components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Vino } from "@/types/vino";
import { useCallback } from "react";

interface ProductGridProps {
    products: Vino[];
}

export function ProductGrid({ products }: ProductGridProps) {
    const { dispatch } = useCart();
    const { toast } = useToast();

    const handleAddToCart = useCallback(
        (product: Vino) => {
            dispatch({
                type: "ADD_ITEM",
                item: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    // quantity: 1,
                    imageUrl: product.image_url || "",
                    region: product.denominacion?.name || "",
                },
            });
            toast({
                title: "Added to cart",
                description: `${product.name} has been added to your cart.`,
            });
        },
        [dispatch, toast],
    );

    const handleImageError = (
        event: React.SyntheticEvent<HTMLImageElement>,
    ) => {
        const imgElement = event.currentTarget;
        imgElement.onerror = null; // Prevent infinite loop
        imgElement.src =
            "https://res.cloudinary.com/dtw0se3wn/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1735228980/cld-sample-3.jpg"; // Set the placeholder image
    };

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
                <div key={product.id} className="group relative">
                    <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg">
                        <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            width={300}
                            height={400}
                            className="h-full w-full object-cover object-center"
                            onError={handleImageError}
                        />
                    </div>
                    <div className="mt-4 flex justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">
                                {product.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {product.denominacion?.name || "Unknown region"}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                {product.categoria?.name || "Unknown category"}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                                {product.price} &euro;
                                {/* {product.price.toFixed(2)} € */}
                            </p>
                            {/* {product.originalPrice &&
                                product.originalPrice > product.price && (
                                    <p className="text-sm text-gray-500 line-through">
                                        {product.originalPrice.toFixed(2)} €
                                    </p>
                                )} */}
                        </div>
                    </div>
                    <Button
                        onClick={() => handleAddToCart(product)}
                        className="mt-4 w-full bg-green-600 hover:bg-green-700"
                    >
                        Quick Add
                    </Button>
                </div>
            ))}
        </div>
    );
}
