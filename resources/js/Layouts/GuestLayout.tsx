import Logo from "@/Components/Logo";
import { APP_NAME, BACKGROUND_HERO } from "@/constants";
import { Link } from "@inertiajs/react";
import { PropsWithChildren } from "react";

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center bg-gray-100 pt-6 dark:bg-gray-900 sm:justify-center sm:pt-0">
            <div className="absolute z-auto h-full w-full bg-red-50">
                <picture>
                    <img
                        src={BACKGROUND_HERO}
                        loading="lazy"
                        alt={APP_NAME}
                        className="absolute h-full w-full object-cover"
                    />
                    <figcaption className="sr-only">
                        Bodega Pago de Jotrón
                    </figcaption>
                </picture>
                <div className="absolute inset-0 h-full w-full bg-black/40" />
            </div>
            <div className="m-w-lg relative flex flex-col items-center gap-8 rounded bg-white p-10">
                <div className="flex flex-col items-center gap-8 text-center text-neutral-900">
                    <Link href="/">
                        <Logo mode="dark" />
                    </Link>
                </div>
                <div className="w-full">{children}</div>
            </div>
        </div>
    );
}
