"use client";

import { User } from "@/types";
import Header from "./Header";

interface HeroSectionProps {
    auth: {
        user: User;
    };
    section: string;
    title: string;
}

const HeroSection = ({ auth, section = "", title = "" }: HeroSectionProps) => {
    // Determine the minimum height class based on the section
    const minHeightClass =
        section.toLowerCase() === "home"
            ? " min-h-screen md:min-h-[1024px]"
            : "";

    // Determine the header class based on the section
    const headerClass =
        section.toLowerCase() === "home"
            ? "absolute -top-[84px] flex flex-col gap-8 text-white"
            : "flex flex-col gap-3";

    // Determine the section name class based on the section
    const sectionNameClass =
        section.toLowerCase() === "home"
            ? "font-display -ml-2 text-[270px] font-bold leading-none tracking-tighter"
            : "heading-4xl-regular text-neutral-50";

    // Determine the title class based on the section
    const titleClass =
        section.toLowerCase() === "home"
            ? "font-display text-2xl"
            : "heading-7xl-regular text-neutral-50";

    // Render the section name as JSX
    const renderSectionName = () => {
        if (section.toLowerCase() === "home") {
            return (
                <>
                    bodega <span className="inline-block">pago de jotrón</span>
                </>
            );
        }
        return section;
    };

    return (
        <div
            className={`relative flex w-full flex-col justify-start ${minHeightClass}`}
        >
            <div className="absolute inset-0">
                <picture>
                    <img
                        src="https://res.cloudinary.com/dtw0se3wn/image/upload/v1735228979/samples/coffee.jpg"
                        loading="lazy"
                        alt="Bodega Pago de Jotrón"
                        className="absolute h-full w-full object-cover"
                    />
                    <figcaption className="sr-only">
                        Bodega Pago de Jotrón
                    </figcaption>
                </picture>
                <div className="absolute inset-0 bg-black/50" />
            </div>

            <Header auth={auth} section={section} />

            <div className="align-center container relative mx-auto flex flex-col justify-center px-5">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-0 py-32">
                    <div className={headerClass}>
                        <h1 className={sectionNameClass}>
                            {renderSectionName()}
                        </h1>
                        <p className={titleClass}>{title}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
