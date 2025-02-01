"use client";

import { Button } from "@/Components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
// import Image from "next/image";
import { useCallback } from "react";

interface Product {
    id: number;
    name: string;
    price: number;
    originalPrice: number;
    region: string;
    imageUrl: string;
}

interface ProductGridProps {
    products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
    const { dispatch } = useCart();
    const { toast } = useToast();

    const handleAddToCart = useCallback(
        (product: Product) => {
            dispatch({
                type: "ADD_ITEM",
                item: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    region: product.region,
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
                <div key={product.id} className="group relative">
                    <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg">
                        {/* <Image
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            width={300}
                            height={400}
                            className="h-full w-full object-cover object-center"
                        /> */}
                        <img
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            width={300}
                            height={400}
                            className="h-full w-full object-cover object-center"
                        />
                    </div>
                    <div className="mt-4 flex justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">
                                {product.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {product.region}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                                {product.price.toFixed(2)} €
                            </p>
                            {product.originalPrice > product.price && (
                                <p className="text-sm text-gray-500 line-through">
                                    {product.originalPrice.toFixed(2)} €
                                </p>
                            )}
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
