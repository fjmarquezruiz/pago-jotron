import { CloudinaryImage } from "@/Components/CloudinaryImage";

const TEXT_BOX = [
    {
        title: "From the Natural Park of Montes de Málaga",
        text: "Our winery, located in the Natural Park of Montes de Málaga, benefits from a unique environment that enhances our wines. The diversity of soils and climates creates an ideal microclimate for cultivating moscatel and other varieties, reflecting the essence of this land.",
    },
    {
        title: "Winery with over 100 years of tradition",
        text: "With over 100 years of tradition, our winery celebrates a legacy of quality and sustainability. Each bottle tells a story of passion and dedication, offering wines that reflect a century of commitment to excellence.",
    },
    {
        title: "Winemakers in the 21st century",
        text: "We take pride in being winemakers in the 21st century, blending traditional techniques with modern innovations. Our winemakers oversee every stage of the process, ensuring that each wine is a masterpiece that honors our rich heritage.",
    },
];
const IMAGE_BOX = [
    {
        alt: "From the Natural Park of Montes de Málaga",
        image: "/v1742324018/montes_aqvbdl.png",
    },
    {
        alt: "Winery with over 100 years of tradition",
        image: "/v1742324017/tradition_e3l9di.png",
    },
    {
        alt: "Winemakers in the 21st century",
        image: "/v1742324017/winemakers_xyxpre.png",
    },
];

const HistoryBoxes = () => {
    return (
        <section className="container mx-auto grid max-w-7xl grid-cols-1 gap-2 px-5 py-16 md:grid-cols-2 lg:grid-cols-4 xl:px-0">
            <div className="order-1 flex flex-col gap-4 rounded bg-neutral-100 p-12 lg:col-span-2">
                <h4 className="heading-3xl-bold text-neutral-900">
                    {TEXT_BOX[0].title}
                </h4>
                <p className="font-lg-normal text-neutral-800">
                    {TEXT_BOX[0].text}
                </p>
            </div>
            <div className="order-2 overflow-hidden rounded bg-neutral-100 lg:col-span-2">
                <CloudinaryImage
                    src={IMAGE_BOX[0].image}
                    alt={IMAGE_BOX[0].alt}
                    className="h-full w-full object-cover object-center"
                />
            </div>

            <div className="order-3 flex flex-col gap-4 rounded bg-neutral-100 p-12 lg:order-4">
                <h4 className="heading-3xl-bold text-neutral-900">
                    {TEXT_BOX[1].title}
                </h4>
                <p className="font-lg-normal text-neutral-800">
                    {TEXT_BOX[1].text}
                </p>
            </div>
            <div className="order-4 overflow-hidden rounded bg-neutral-100 lg:order-3">
                <CloudinaryImage
                    src={IMAGE_BOX[1].image}
                    alt={IMAGE_BOX[1].alt}
                    className="h-full w-full object-cover object-center"
                />
            </div>

            <div className="order-5 flex flex-col gap-4 rounded bg-neutral-100 p-12 lg:order-6">
                <h4 className="heading-3xl-bold text-neutral-900">
                    {TEXT_BOX[2].title}
                </h4>
                <p className="font-lg-normal text-neutral-800">
                    {TEXT_BOX[2].text}
                </p>
            </div>
            <div className="order-6 overflow-hidden rounded bg-neutral-100 lg:order-5">
                <CloudinaryImage
                    src={IMAGE_BOX[2].image}
                    alt={IMAGE_BOX[2].alt}
                    className="h-full w-full object-cover object-center"
                />
            </div>
        </section>
    );
};

export default HistoryBoxes;
