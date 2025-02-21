"use client";

import { useCart } from "@/contexts/cart-context";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import HeroSection from "../Layout/HeroSection";

const Index = ({ auth }: PageProps) => {
    const { state, dispatch } = useCart();

    const handleImageError = (
        event: React.SyntheticEvent<HTMLImageElement>,
    ) => {
        const imgElement = event.currentTarget;
        imgElement.onerror = null; // Prevent infinite loop
        imgElement.src =
            "https://res.cloudinary.com/dtw0se3wn/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1735228980/cld-sample-3.jpg"; // Set the placeholder image
    };

    return (
        <>
            <Head title="The cart" />
            <HeroSection
                auth={auth}
                section="The cart"
                title="The cart best wines of Andalusia"
            />
            <main className="container mx-auto flex-1 border border-red-800 px-4 py-8">
                {state.items.length === 0 ? (
                    <div className="text-center">
                        <h1 className="mb-4 text-2xl font-bold">
                            Your cart is empty
                        </h1>
                        <p className="mb-8 text-gray-600">
                            Add some wines to your cart to get started!
                        </p>
                        {/* Add a link or button to redirect to the shop */}
                    </div>
                ) : (
                    <div className="lg:grid lg:grid-cols-12 lg:gap-12">
                        <div className="lg:col-span-7">
                            <h1 className="mb-8 text-2xl font-bold">
                                Shopping Cart
                            </h1>
                            <div className="space-y-8">
                                {state.items.map((item) => (
                                    <div key={item.id} className="flex gap-6">
                                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                                            {/* <Image
                                                src={
                                                    item.imageUrl ||
                                                    "/placeholder.svg"
                                                }
                                                alt={item.name}
                                                width={96}
                                                height={96}
                                                className="h-full w-full object-cover object-center"
                                            /> */}
                                            <img
                                                src={
                                                    item.imageUrl ||
                                                    "/placeholder.svg"
                                                }
                                                alt={item.name}
                                                width={96}
                                                height={96}
                                                className="h-full w-full object-cover object-center"
                                                onError={handleImageError}
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col">
                                            <div className="flex justify-between text-base font-medium text-gray-900">
                                                <h3>{item.name}</h3>
                                                <p className="ml-4">
                                                    {(
                                                        item.price *
                                                        item.quantity
                                                    ).toFixed(2)}{" "}
                                                    €
                                                </p>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {item.region}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {/* Add buttons to update quantity */}
                                                </div>
                                                {/* Add button to remove item */}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
                            <h2 className="text-lg font-medium text-gray-900">
                                Order summary
                            </h2>
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        Subtotal
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {state.total.toFixed(2)} €
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                                    <p className="text-base font-medium text-gray-900">
                                        Order total
                                    </p>
                                    <p className="text-base font-medium text-gray-900">
                                        {state.total.toFixed(2)} €
                                    </p>
                                </div>
                            </div>
                            {/* Add checkout button */}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
};

export default Index;
