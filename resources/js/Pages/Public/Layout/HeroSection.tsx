"use client";

import { APP_NAME, CLOUDINARY_BASE_URL } from "@/constants";
import { User } from "@/types";
import Menu from "./Menu";

interface HeroSectionProps {
    auth: {
        user: User;
    };
    section: string;
    title: string;
    text: string;
    background?: string;
    mode?: "light" | "dark";
}

const HeroSection = ({
    auth,
    section = "",
    title = "",
    text = "",
    background = `${CLOUDINARY_BASE_URL}/v1735228979/samples/coffee.jpg`,
    mode = "light",
}: HeroSectionProps) => {
    // Determine the minimum height class based on the section
    const isDetail = section.toLowerCase() !== "detail";
    const isHome = section.toLowerCase() === "home";

    return (
        <div
            className={`relative flex w-full flex-col justify-start ${isHome ? "min-h-screen md:min-h-[860px]" : ""}`}
        >
            {isDetail && (
                <div className="absolute inset-0">
                    <picture>
                        <img
                            src={background}
                            loading="lazy"
                            alt={APP_NAME}
                            className="absolute h-full w-full object-cover"
                        />
                        <figcaption className="sr-only">
                            Bodega Pago de Jotrón
                        </figcaption>
                    </picture>
                    <div className="absolute inset-0 bg-black/50" />
                </div>
            )}

            <Menu auth={auth} section={section} mode={mode} />

            {isDetail && (
                <div className="align-center container relative mx-auto flex max-w-7xl flex-1 flex-col justify-center px-5 xl:px-0">
                    <div
                        className={`${!isHome ? "py-32" : ""} flex flex-col gap-2.5 text-white`}
                    >
                        <h1
                            className={`${isHome ? "heading-7xl-regular" : "heading-4xl-regular"}`}
                        >
                            {title}
                        </h1>
                        <p
                            className={`${!isHome ? "heading-7xl-regular" : "heading-4xl-regular"}`}
                        >
                            {text}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroSection;
