"use client";

import { CartActionTypes } from "@/constants";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Vino } from "@/types/vino";
import { useCallback } from "react";
import ProductCard from "./ProductCard";

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
                    quantity: 1,
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
                <ProductCard
                    key={product.id}
                    product={product}
                    handleAddToCart={handleAddToCart}
                />
            ))}
        </div>
    );
}
