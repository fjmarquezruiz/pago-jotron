import { Toaster } from "@/Components/ui/toaster";
import { CartProvider } from "@/contexts/cart-context";
import { PropsWithChildren } from "react";
import "../../css/styles.css";

const PublicApp = ({ children }: PropsWithChildren) => {
    return (
        <CartProvider>
            <link rel="preconnect" href="https://fonts.googleaºpis.com"></link>
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            ></link>
            <link
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
                rel="stylesheet"
            ></link>
            {/* <div className="public-layout">
                <header className="public-header">Public Header</header>
                <main className="public-content">{children}</main>
                <footer className="public-footer">Public Footer</footer>
            </div> */}
            <main className="flex min-h-screen flex-col items-center bg-white text-neutral-900 dark:bg-gray-900 dark:text-white/5">
                {children}
                <footer className="py-16 text-center text-sm text-black dark:text-white/70">
                    ESTE ES EL FOOTER
                </footer>
            </main>
            <Toaster />
        </CartProvider>
    );
};

export default PublicApp;
