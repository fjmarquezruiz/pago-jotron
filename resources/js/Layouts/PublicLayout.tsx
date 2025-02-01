import { Toaster } from "@/Components/ui/toaster";
import { CartProvider } from "@/contexts/cart-context";
import { PropsWithChildren } from "react";

export default function Public({ children }: PropsWithChildren) {
    return (
        <CartProvider>
            <link rel="preconnect" href="https://fonts.googleapis.com"></link>
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            ></link>
            <link
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
                rel="stylesheet"
            ></link>

            <div className="flex min-h-screen flex-col items-center bg-red-100 text-gray-900 dark:bg-gray-900 dark:text-white/5">
                <div>cominezo Estas en PUBLIC</div>
                {children}
                <div>fin Estas en PUBLIC</div>
            </div>
            <Toaster />
        </CartProvider>
    );
}
