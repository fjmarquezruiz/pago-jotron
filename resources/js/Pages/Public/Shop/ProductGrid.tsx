"use client";

import { CloudinaryImage } from "@/Components/CloudinaryImage";
import { Button } from "@/Components/ui/button";
import { CartActionTypes } from "@/constants";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Vino } from "@/types/vino";
import { IconArrowRight } from "@tabler/icons-react";
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
                type: CartActionTypes.ADD_ITEM,
                item: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    description: product.description || "",
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

    return (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
                <div key={product.id} className="relative flex flex-col gap-2">
                    <div className="group relative aspect-square w-full overflow-hidden rounded bg-neutral-50">
                        <CloudinaryImage
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            className="h-full w-full object-cover object-center"
                        />
                        <div className="absolute bottom-0 left-0 right-0 w-full p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <Button
                                onClick={() => handleAddToCart(product)}
                                // className="mt-4 w-full bg-green-600 hover:bg-green-700"
                                className="w-full"
                                variant="primary"
                                size="sm"
                            >
                                Quick Add{" "}
                                <IconArrowRight
                                    stroke={1.5}
                                    className="size-5"
                                />
                            </Button>
                        </div>
                    </div>
                    <h3 className="font-lg-bold text-gray-900">
                        {product.name}
                    </h3>
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
            ))}
        </div>
    );
}
