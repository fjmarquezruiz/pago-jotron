import { CloudinaryImage } from "@/Components/CloudinaryImage";

interface BannerProps {
    text: string;
    accentText?: string;
    image: string;
}

const Banner = ({ text, accentText, image }: BannerProps) => {
    return (
        <div className="relative w-full bg-red-50">
            <CloudinaryImage
                src={`${image}` || "/placeholder.svg"}
                alt="banner"
                className="absolute h-full w-full bg-red-100 object-cover object-center"
            />
            <div className="heading-5xl-regular relative mx-auto max-w-7xl py-32 text-center text-white">
                {text}{" "}
                {accentText ? (
                    <span className="font-bold uppercase">{accentText}</span>
                ) : (
                    ""
                )}
            </div>
        </div>
    );
};

export default Banner;
