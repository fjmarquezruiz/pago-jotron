"use client";

import { CloudinaryImage } from "@/Components/CloudinaryImage";
import { Button } from "@/Components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/Components/ui/carousel";
import { CartActionTypes, CLOUDINARY_BASE_URL } from "@/constants";
import { useCart } from "@/contexts/cart-context";
import useMediaQuery from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { Vino } from "@/types/vino";
import { Link } from "@inertiajs/react";
import {
    IconArrowLeft,
    IconArrowRight,
    IconArrowUpRight,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

interface Card {
    id: number;
    name: string;
    image: string;
}

interface ProductsSliderProps {
    // products: { data: Vino[] };
    products: { data: Card[] };
}

const ProductSlider = ({ products }: ProductsSliderProps) => {
    const { dispatch } = useCart();
    const { toast } = useToast();

    const [api, setApi] = useState<any>(null);
    const isMobile = useMediaQuery("(max-width: 640px)");
    const isTablet = useMediaQuery("(max-width: 1024px)");

    // const BACKGROUND_IMAGE = `${CLOUDINARY_BASE_URL}/v1735228979/samples/coffee.jpg`;
    const BACKGROUND_IMAGE = `${CLOUDINARY_BASE_URL}/v1742150446/bg-red-wines_dkxasj.png`;

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
                    <h2 className="heading-3xl-bold">Our products</h2>
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
                                <Link
                                    href={route("shop")}
                                    className="heading-2xl-medium relative block aspect-[3/4] overflow-hidden rounded text-white"
                                >
                                    <CloudinaryImage
                                        src={
                                            `${product.image}` ||
                                            "/placeholder.svg"
                                        }
                                        alt={product.name}
                                        className="absolute h-full w-full bg-red-100 object-cover object-center"
                                    />
                                    <div
                                        className="group absolute flex h-full w-full items-end gap-2 p-6"
                                        style={{
                                            background:
                                                "linear-gradient(180deg, rgba(23, 23, 23, 0) 0%, rgba(23, 23, 23, 0) 50%, rgba(23, 23, 23, 0.3) 100%)",
                                        }}
                                    >
                                        {product.name}{" "}
                                        <IconArrowUpRight
                                            stroke={1.5}
                                            className="hidden size-6 transition-opacity group-hover:block"
                                        />
                                    </div>
                                </Link>
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

export default ProductSlider;
