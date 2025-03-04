"use client";

import { CloudinaryImage } from "@/Components/CloudinaryImage";
import { Button } from "@/Components/ui/button";
import { CartActionTypes } from "@/constants";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { PageProps } from "@/types";
import { Vino } from "@/types/vino";
import { Head } from "@inertiajs/react";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import HeroSection from "../Layout/HeroSection";

interface DetailProps extends PageProps {
    vino?: Vino;
    id: number;
}

const Detail = ({ auth, vino, id }: PageProps<DetailProps>) => {
    const [quantity, setQuantity] = useState(1);
    const { dispatch } = useCart();
    const { toast } = useToast();

    if (!vino) {
        return (
            <main className="container mx-auto px-5 py-12">
                <div className="flex items-center justify-center">
                    <p className="text-lg">Loading wine details...</p>
                </div>
            </main>
        );
    }

    const handleUpdateQuantity = (newQuantity: number) => {
        if (newQuantity < 1) return;
        setQuantity(newQuantity);
    };

    const handleAddToCart = () => {
        dispatch({
            type: CartActionTypes.ADD_ITEM,
            item: {
                id: vino.id,
                name: vino.name,
                price: vino.price,
                quantity: quantity,
                description: vino.description || "",
                imageUrl: vino.image_url || "",
                region: vino.denominacion?.name || "",
            },
        });

        toast({
            title: "Added to cart",
            description: `${vino.name} has been added to your cart.`,
        });
    };

    return (
        <>
            <Head title={vino.name} />
            <HeroSection
                auth={auth}
                section="Detail"
                title={vino.name}
                mode="dark"
            />

            <main className="container mx-auto px-5 py-12">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-2">
                    {/* Left Column - Details */}
                    <div className="flex flex-col gap-14">
                        <h2 className="heading-8xl-bold">{vino.name}</h2>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="flex flex-col gap-0.5">
                                <p className="font-xs-bold uppercase text-neutral-800">
                                    Year
                                </p>
                                <p className="font-base-regular text-neutral-900">
                                    {vino.vintage_year}
                                </p>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <p className="font-xs-bold uppercase text-neutral-800">
                                    Origin
                                </p>
                                <p className="font-base-regular text-neutral-900">
                                    {vino.denominacion?.name}
                                </p>
                            </div>
                            <div className="flex flex-col gap-0 text-right">
                                <p className="heading-6xl-bold whitespace-nowrap text-neutral-900">
                                    {parseFloat(vino.price).toFixed(2)} &euro;
                                </p>
                                <p className="text-xs-semibold text-neutral-400">
                                    IVA included
                                </p>
                            </div>
                        </div>

                        {/* Add to Cart Section */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center rounded border border-neutral-200">
                                <Button
                                    variant="ghost"
                                    size="icon-lg"
                                    onClick={() =>
                                        handleUpdateQuantity(quantity - 1)
                                    }
                                >
                                    <IconMinus
                                        stroke={1.5}
                                        className="size-5"
                                    />
                                </Button>
                                <span className="font-base-normal min-w-28 flex-1 text-center">
                                    {quantity}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-lg"
                                    onClick={() =>
                                        handleUpdateQuantity(quantity + 1)
                                    }
                                >
                                    <IconPlus stroke={1.5} className="size-5" />
                                </Button>
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleAddToCart}
                            >
                                Add to cart
                            </Button>
                        </div>

                        {/* Product Details */}
                        <div className="flex flex-col gap-6">
                            <h2 className="heading-xl-bold">Product details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="font-sm-semibold text-neutral-900">
                                        Region
                                    </span>
                                    <span className="font-sm-normal text-neutral-600">
                                        {vino.denominacion?.name || "Unknown"}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="font-sm-semibold text-neutral-900">
                                        Category
                                    </span>
                                    <span className="font-sm-normal text-neutral-600">
                                        {vino.categoria?.name || "Unknown"}
                                    </span>
                                </div>
                                {/* Add other wine details as available in your Vino type */}
                            </div>
                        </div>

                        {/* Description */}
                        {vino.description && (
                            <div className="flex flex-col gap-4">
                                <h2 className="heading-xl-bold">Description</h2>
                                <p className="font-base-normal text-neutral-600">
                                    {vino.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Image */}
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-50">
                        <CloudinaryImage
                            src={vino.image_url || "/placeholder.svg"}
                            alt={vino.name}
                            className="h-full w-full object-contain"
                        />
                    </div>
                </div>
            </main>
        </>
    );
};

export default Detail;
