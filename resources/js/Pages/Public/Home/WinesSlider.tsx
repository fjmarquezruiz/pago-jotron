"use client";

import { Button } from "@/Components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/Components/ui/carousel";
import { CartActionTypes } from "@/constants";
import { useCart } from "@/contexts/cart-context";
import useMediaQuery from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { Vino } from "@/types/vino";
import { Link } from "@inertiajs/react";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import ProductCard from "../Shop/ProductCard";

interface WinesSliderProps {
    title: string;
    products: { data: Vino[] };
}

const WinesSlider = ({ title, products }: WinesSliderProps) => {
    const { dispatch } = useCart();
    const { toast } = useToast();

    const [api, setApi] = useState<any>(null);
    const isMobile = useMediaQuery("(max-width: 640px)");
    const isTablet = useMediaQuery("(max-width: 1024px)");

    // Auto-scroll functionality
    useEffect(() => {
        if (!api) return;

        const interval = setInterval(() => {
            api.scrollNext();
        }, 5000);

        return () => clearInterval(interval);
    }, [api]);

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
        <section className="container mx-auto max-w-7xl px-5 py-16 xl:px-0">
            <div className="flex flex-col gap-12">
                <div className="flex items-baseline justify-between">
                    <h2 className="heading-3xl-bold">{title}</h2>
                    <Link
                        href={route("shop")}
                        className="font-sm-semibold text-neutral-600 hover:underline"
                    >
                        View all
                    </Link>
                </div>
                <Carousel
                    setApi={setApi}
                    className="flex w-full flex-col gap-12"
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                >
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {products.data.map((product) => (
                            <CarouselItem
                                key={product.id}
                                className={`pl-2 md:pl-4 ${isMobile ? "basis-full" : isTablet ? "basis-1/2" : "basis-1/4"}`}
                            >
                                <div className="group relative">
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        handleAddToCart={handleAddToCart}
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="flex justify-end gap-4">
                        <Button
                            variant="ghost"
                            size="icon-lg"
                            onClick={() => api?.scrollPrev()}
                        >
                            <IconArrowLeft stroke={1.5} className="size-5" />
                            <span className="sr-only">Previous slide</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-lg"
                            onClick={() => api?.scrollNext()}
                        >
                            <IconArrowRight stroke={1.5} className="size-5" />
                            <span className="sr-only">Next slide</span>
                        </Button>
                    </div>
                </Carousel>
            </div>
        </section>
    );
};

export default WinesSlider;
