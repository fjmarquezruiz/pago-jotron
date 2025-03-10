"use client";

import { useCart } from "@/contexts/cart-context";
import { Link } from "@inertiajs/react";
import { IconShoppingBag } from "@tabler/icons-react";
import { useRoute } from "../../../../../vendor/tightenco/ziggy/src/js";

interface CartBadgeProps {
    mode?: "light" | "dark";
}

const CartBadge = ({ mode = "light" }: CartBadgeProps) => {
    const router = useRoute();
    const { state } = useCart();

    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <>
            <Link
                href={route("cart")}
                as="button"
                // className="relative inline-flex items-center gap-2 rounded border border-transparent bg-transparent p-2 text-sm font-medium leading-4 text-white transition duration-150 ease-in-out hover:bg-white/10 focus:bg-white/20 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300 dark:focus:bg-gray-700"
                className={`relative h-10 w-10 border border-transparent bg-transparent px-0 button ${mode === "dark" ? "button-ghost" : "button-ghost-dark"}`}
                aria-label="Cart"
                title="Cart"
                // onClick={() => router.push("/cart")}
            >
                <IconShoppingBag stroke={1.5} className="size-5" />
                {itemCount > 0 && (
                    <span
                        // className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-medium text-gray-900"
                        className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full font-sans text-[10px] font-medium ${mode === "dark" ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"}`}
                    >
                        {itemCount}
                    </span>
                )}
                <span className="sr-only">Cart</span>
            </Link>
            {/* <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => router.push("/cart")}
            >
                <IconShoppingBag stroke={1.5} className="size-5" />
                {itemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-medium text-gray-900">
                        {itemCount}
                    </span>
                )}
                <span className="sr-only">Cart</span>
            </Button> */}
        </>
    );
};

export default CartBadge;
