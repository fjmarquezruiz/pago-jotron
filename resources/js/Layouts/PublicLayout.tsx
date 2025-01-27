import { PropsWithChildren } from "react";

export default function Public({ children }: PropsWithChildren) {
    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com"></link>
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="true"
            ></link>
            <link
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
                rel="stylesheet"
            ></link>

            <div className="flex min-h-screen flex-col items-center bg-red-100 text-gray-900 dark:bg-gray-900 dark:text-white/5">
                {children}
            </div>
        </>
    );
}
