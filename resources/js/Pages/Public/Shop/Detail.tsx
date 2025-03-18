"use client";

import { CloudinaryImage } from "@/Components/CloudinaryImage";
import { Button } from "@/Components/ui/button";
import { CartActionTypes, CLOUDINARY_BASE_URL } from "@/constants";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { PageProps } from "@/types";
import { Vino } from "@/types/vino";
import { Head, Link } from "@inertiajs/react";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import HeroSection from "../Layout/HeroSection";
import { RelatedProductsSlider } from "./RelatedProductsSlider";

interface DetailProps extends PageProps {
    vino?: Vino;
    id: number;
    relatedProducts: Vino[];
}

const Detail = ({ auth, vino, relatedProducts }: PageProps<DetailProps>) => {
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

    const vinoDetails = [
        {
            label: "Year",
            value: vino.vintage_year || "Unknown",
        },
        {
            label: "Type",
            value: vino.categoria?.name || "Unknown",
        },
        {
            label: "Region",
            value: vino.denominacion?.name || "Unknown",
        },
        {
            label: "Winery",
            value: vino.bodega?.name || "Unknown",
        },
        {
            label: "Grapes varieties",
            value:
                vino.uvas
                    ?.map((uva) => `${uva.pivot.percent}% ${uva.name}`)
                    .join(", ") || "Unknown",
        },
        {
            label: "Alcohol",
            value: `${vino.alcohol}%`,
        },
        {
            label: "Size",
            value: `${vino.capacity} cl`,
        },
        {
            label: "Serving temperature",
            value: `${vino.minimum_temperature} - ${vino.maximum_temperature}°C`,
        },
        {
            label: "Food pairing",
            value: vino.food_pairing || "Unknown",
        },
    ];

    const vinoTastingNotes = [
        {
            label: "Aromas",
            value: vino.aromas || "Unknown",
            image_url: `${CLOUDINARY_BASE_URL}/v1741113323/tasting-nose_sc8jf9.png`,
        },
        {
            label: "Taste",
            value: vino.taste || "Unknown",
            image_url: `${CLOUDINARY_BASE_URL}/v1741113323/tasting-taste_ueekvd.png`,
        },
        {
            label: "Visual",
            value: vino.visual || "Unknown",
            image_url: `${CLOUDINARY_BASE_URL}/v1741113323/tasting-finish_kufwmw.png`,
        },
    ];

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
                text={vino.name}
                mode="dark"
            />

            <section className="container mx-auto px-5 py-20">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-2">
                    {/* Left Column - Details */}
                    <div className="flex flex-col gap-14">
                        <Link
                            href={route("shop.detail", {
                                id: vino.id,
                            })}
                        >
                            <h2 className="heading-8xl-bold">{vino.name}</h2>
                        </Link>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="flex flex-col gap-0.5">
                                <p className="font-xs-bold uppercase text-neutral-800">
                                    Year
                                </p>
                                <p className="font-base-regular text-neutral-900">
                                    {vino.vintage_year || "Unknown"}
                                </p>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <p className="font-xs-bold uppercase text-neutral-800">
                                    Origin
                                </p>
                                <p className="font-base-regular text-neutral-900">
                                    {vino.denominacion?.name || "Unknown"}
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
                                    className="!rounded-none"
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
                                    className="!rounded-none"
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

                        {/* Description */}
                        {vino.description && (
                            <p className="font-base-normal text-neutral-800">
                                {vino.description}
                            </p>
                        )}

                        {/* Product Details */}
                        <div className="flex flex-col gap-6">
                            <h3 className="heading-xl-bold">Product details</h3>

                            {vinoDetails.length > 0 && (
                                <table className="w-full table-auto border-collapse">
                                    <tbody>
                                        {vinoDetails.map((detail) => (
                                            <tr
                                                key={detail.label}
                                                className="border-b border-neutral-200 align-baseline"
                                            >
                                                <td className="font-sm-semibold py-4 pr-6 text-neutral-900 md:min-w-60">
                                                    {detail.label}
                                                </td>
                                                <td className="font-base-normal py-4 text-neutral-800">
                                                    {detail.value}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
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
            </section>

            {vinoTastingNotes.length > 0 && (
                <section className="w-full bg-neutral-50">
                    <div className="mx-auto flex max-w-7xl flex-col gap-12 py-20">
                        <h3 className="heading-3xl-bold">Tasting notes</h3>
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                            {vinoTastingNotes.map((note) => (
                                <div
                                    key={note.label}
                                    className="grid-span-1 flex flex-col items-center gap-6 text-center"
                                >
                                    <CloudinaryImage
                                        src={
                                            note.image_url || "/placeholder.svg"
                                        }
                                        alt={note.label}
                                        className="h-[72px] w-[72px] object-contain"
                                    />
                                    <h4 className="heading-xl-bold text-neutral-900">
                                        {note.label}
                                    </h4>
                                    <p className="font-base-normal text-neutral-800">
                                        {note.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Related Products Section */}
            <RelatedProductsSlider products={relatedProducts} />
        </>
    );
};

export default Detail;
