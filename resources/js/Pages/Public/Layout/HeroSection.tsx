"use client";

import Header from "./Header";

interface HeroSectionProps {
    section: string;
    title: string;
}

const HeroSection = ({ section = "", title = "" }: HeroSectionProps) => {
    // Determine the minimum height class based on the section
    const minHeightClass =
        section.toLowerCase() === "home"
            ? "md:min-h-[1024px]"
            : "md:min-h-[464px]";

    // Determine the header class based on the section
    const headerClass =
        section.toLowerCase() === "home"
            ? "absolute -top-[84px] flex flex-col gap-8 text-white"
            : "flex flex-col gap-3 text-white w-8/12";

    // Determine the section name class based on the section
    const sectionNameClass =
        section.toLowerCase() === "home"
            ? "font-display -ml-2 text-[270px] font-bold leading-none tracking-tighter"
            : "text-lg uppercase";

    // Determine the title class based on the section
    const titleClass =
        section.toLowerCase() === "home"
            ? "font-display text-2xl"
            : "font-display text-8xl font-bold leading-none tracking-tight";

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
            className={`relative flex min-h-screen w-full flex-col justify-start ${minHeightClass}`}
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

            <Header section={section} />

            <div className="container relative mx-auto flex flex-1 flex-col justify-center px-4">
                <div className={headerClass}>
                    <h1 className={sectionNameClass}>{renderSectionName()}</h1>
                    <p className={titleClass}>{title}</p>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
