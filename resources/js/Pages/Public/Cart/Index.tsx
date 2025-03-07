"use client";

import { CloudinaryImage } from "@/Components/CloudinaryImage";
import { Button } from "@/Components/ui/button";
import { CartActionTypes, CLOUDINARY_BASE_URL } from "@/constants";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { IconMinus, IconPlus, IconTrash } from "@tabler/icons-react";
import HeroSection from "../Layout/HeroSection";

const Index = ({ auth }: PageProps) => {
    const { state, dispatch } = useCart();
    const { toast } = useToast();

    const handleImageError = (
        event: React.SyntheticEvent<HTMLImageElement>,
    ) => {
        const imgElement = event.currentTarget;
        imgElement.onerror = null; // Prevent infinite loop
        imgElement.src = `${CLOUDINARY_BASE_URL}/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1735228980/cld-sample-3.jpg`;
    };

    const handleCheckout = () => {
        if (!auth.user) {
            // Store current path in localStorage
            localStorage.setItem("redirect_after_login", "cart");
            router.get(route("login"));
        } else {
            router.get(route("checkout.index"));
        }
    };

    const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) {
            dispatch({ type: CartActionTypes.REMOVE_ITEM, itemId });
            toast({
                title: "Item removed",
                description: "The item has been removed from your cart.",
            });
            return;
        }

        dispatch({
            type: CartActionTypes.UPDATE_QUANTITY,
            itemId,
            quantity: newQuantity,
        });
    };

    const handleRemoveItem = (itemId: number) => {
        dispatch({ type: CartActionTypes.REMOVE_ITEM, itemId });
        toast({
            title: "Item removed",
            description: "The item has been removed from your cart.",
        });
    };

    const TableCellClasses = "py-6 align-top";
    const TableTHClasses = "font-xs-bold py-2 uppercase text-neutral-600";

    return (
        <>
            <Head title="The cart" />
            <HeroSection
                auth={auth}
                section="The cart"
                title="The cart best wines of Andalusia"
            />
            <main className="container mx-auto px-5 pb-32 pt-12">
                <div className="mx-auto flex max-w-7xl gap-6 lg:grid lg:grid-cols-12 lg:gap-6">
                    {state.items.length === 0 ? (
                        <div className="col-span-12 flex flex-col gap-12">
                            <h2 className="heading-3xl-bold">Shopping Cart</h2>

                            <div className="flex max-w-7xl flex-col items-center gap-6 rounded border border-neutral-200 bg-neutral-50 p-12">
                                <h3 className="heading-2xl-bold">
                                    Your cart is empty
                                </h3>
                                <p className="font-base-normal text-neutral-600">
                                    Add some wines to your cart to get started!
                                </p>

                                <Link
                                    href="/shop"
                                    className="font-sm-semibold button button-size-lg button-primary"
                                >
                                    Shop now
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-12 pr-12 lg:col-span-9">
                                <h2 className="heading-3xl-bold">
                                    Shopping Cart
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse">
                                        <thead>
                                            <tr className="text-left">
                                                <th
                                                    className={`pr-3 ${TableTHClasses}`}
                                                >
                                                    Product
                                                </th>
                                                <th
                                                    className={`px-3 text-right ${TableTHClasses}`}
                                                >
                                                    Price / Unit
                                                </th>
                                                <th
                                                    className={`px-3 text-center ${TableTHClasses}`}
                                                >
                                                    Quantity
                                                </th>
                                                <th
                                                    className={`px-3 text-right ${TableTHClasses}`}
                                                >
                                                    Total
                                                </th>
                                                <th
                                                    className={`pl-3 text-right ${TableTHClasses}`}
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.items.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-gray-100"
                                                >
                                                    <td
                                                        className={`pr-3 ${TableCellClasses}`}
                                                    >
                                                        <div className="flex gap-4">
                                                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                                                                <CloudinaryImage
                                                                    src={
                                                                        item.imageUrl ||
                                                                        "/placeholder.svg"
                                                                    }
                                                                    alt={
                                                                        item.name
                                                                    }
                                                                    className="h-full w-full object-cover object-center"
                                                                    width={96}
                                                                    height={96}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-4 pt-2">
                                                                <div className="flex flex-col gap-2">
                                                                    <Link
                                                                        href={route(
                                                                            "shop.detail",
                                                                            {
                                                                                id: item.id,
                                                                            },
                                                                        )}
                                                                    >
                                                                        <h3 className="font-lg-bold text-neutral-900">
                                                                            {
                                                                                item.name
                                                                            }
                                                                        </h3>
                                                                    </Link>
                                                                    {item.description && (
                                                                        <p className="font-sm-normal text-neutral-800">
                                                                            {
                                                                                item.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <p className="font-xs-bold uppercase text-neutral-500">
                                                                    {
                                                                        item.region
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td
                                                        className={`min-w-28 px-3 text-right ${TableCellClasses}`}
                                                    >
                                                        <p className="font-base-bold pt-2 text-neutral-900">
                                                            {parseFloat(
                                                                item.price,
                                                            ).toFixed(2)}{" "}
                                                            &euro;{" "}
                                                            <span className="font-xs-normal block text-neutral-500">
                                                                IVA included
                                                            </span>
                                                        </p>
                                                    </td>
                                                    <td
                                                        className={`px-3 ${TableCellClasses}`}
                                                    >
                                                        <div className="flex items-center rounded border border-neutral-200">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-md"
                                                                className="!rounded-none"
                                                                onClick={() =>
                                                                    handleUpdateQuantity(
                                                                        item.id,
                                                                        item.quantity -
                                                                            1,
                                                                    )
                                                                }
                                                            >
                                                                <IconMinus
                                                                    stroke={1.5}
                                                                    className="size-5"
                                                                />
                                                            </Button>
                                                            <span className="font-base-normal min-w-13 flex-1 px-4 text-center text-neutral-900">
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-md"
                                                                className="!rounded-none"
                                                                onClick={() =>
                                                                    handleUpdateQuantity(
                                                                        item.id,
                                                                        item.quantity +
                                                                            1,
                                                                    )
                                                                }
                                                            >
                                                                <IconPlus
                                                                    stroke={1.5}
                                                                    className="size-5"
                                                                />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                    <td
                                                        className={`min-w-28 px-3 text-right ${TableCellClasses}`}
                                                    >
                                                        <p className="font-base-bold pt-2 text-neutral-900">
                                                            {(
                                                                item.price *
                                                                item.quantity
                                                            ).toFixed(2)}{" "}
                                                            &euro;{" "}
                                                            <span className="font-xs-normal block text-neutral-500">
                                                                IVA included
                                                            </span>
                                                        </p>
                                                    </td>
                                                    <td
                                                        className={`w-14 pl-3 text-right ${TableCellClasses}`}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-md"
                                                            onClick={() =>
                                                                handleRemoveItem(
                                                                    item.id,
                                                                )
                                                            }
                                                        >
                                                            <IconTrash
                                                                stroke={1.5}
                                                                className="size-5"
                                                            />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="mb-18 flex flex-col gap-6 rounded border border-neutral-200 bg-neutral-50 px-4 py-4 sm:p-6 lg:col-span-3 lg:mt-0 lg:p-6">
                                <h2 className="heading-xl-bold text-neutral-900">
                                    Order summary
                                </h2>
                                <div className="space-y-4">
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
                                <Button
                                    className="w-full"
                                    variant="primary"
                                    size="lg"
                                    onClick={handleCheckout}
                                >
                                    {!auth.user ? "Login" : "Checkout"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </>
    );
};

export default Index;
