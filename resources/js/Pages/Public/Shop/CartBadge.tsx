"use client";

// import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import { IconShoppingBag } from "@tabler/icons-react";
import { useRoute } from "../../../../../vendor/tightenco/ziggy/src/js";

export function CartBadge() {
    const router = useRoute();
    // const { state } = useCart();

    // const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

    const itemCount = 10;

    return (
        <>
            <Link
                href={route("login")}
                as="button"
                className="relative inline-flex items-center gap-2 rounded border border-transparent bg-transparent p-2 text-sm font-medium leading-4 text-white transition duration-150 ease-in-out hover:bg-white/10 focus:bg-white/20 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300 dark:focus:bg-gray-700"
                aria-label="Cart"
                title="Cart"
                // onClick={() => router.push("/cart")}
            >
                <IconShoppingBag stroke={1.5} className="size-5" />
                {itemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-medium text-gray-900">
                        {itemCount}
                    </span>
                )}
                <span className="sr-only">Cart</span>
            </Link>
        </>
    );
}
