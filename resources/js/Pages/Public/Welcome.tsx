import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import HeroSection from "./Layout/HeroSection";
import { CloudinaryImage } from "@/Components/CloudinaryImage";

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    console.log("welcome -> ", auth);

    return (
        <>
            <Head title="Store Welcome" />
            <HeroSection
                auth={auth}
                section="HOME"
                title="History and future from the heart of the Natural Park of Montes de Málaga"
            />

            <main className="relative min-h-screen">
                {/* Products Section */}
                <section className="container mx-auto px-4 py-16">
                    <h2 className="mb-8 text-center text-3xl font-bold">Our products</h2>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        <Link href={route('shop')} className="group">
                            <div className="overflow-hidden rounded-lg">
                                <CloudinaryImage
                                    src="/images/products/fortified.jpg"
                                    alt="Fortified Wines"
                                    className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">FORTIFIED +</h3>
                        </Link>
                        <Link href={route('shop')} className="group">
                            <div className="overflow-hidden rounded-lg">
                                <CloudinaryImage
                                    src="/images/products/sweet.jpg"
                                    alt="Sweet Natural"
                                    className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">SWEET NATURAL +</h3>
                        </Link>
                        <Link href={route('shop')} className="group">
                            <div className="overflow-hidden rounded-lg">
                                <CloudinaryImage
                                    src="/images/products/limited.jpg"
                                    alt="Limited Editions"
                                    className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">LIMITED EDITIONS +</h3>
                        </Link>
                        <Link href={route('shop')} className="group">
                            <div className="overflow-hidden rounded-lg">
                                <CloudinaryImage
                                    src="/images/products/events.jpg"
                                    alt="Events"
                                    className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">EVENTS +</h3>
                        </Link>
                    </div>
                </section>

                {/* Story Section */}
                <section className="bg-gray-50 py-16">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                            <div>
                                <h2 className="mb-6 text-3xl font-bold">Land and barrel</h2>
                                <h3 className="mb-8 text-2xl">FROM THE GRAPE TO THE GLASS...</h3>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="mb-2 text-xl font-semibold">From the Natural Park of Montes de Málaga</h4>
                                        <p className="text-gray-600">Our vineyards are located in the heart of the Natural Park, where the unique climate and soil conditions create exceptional wines.</p>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 text-xl font-semibold">Winemakers in the 21st Century</h4>
                                        <p className="text-gray-600">We combine traditional winemaking methods with modern technology to create wines that reflect our heritage and innovation.</p>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 text-xl font-semibold">Wining with Over 100 Years of Tradition</h4>
                                        <p className="text-gray-600">Our family has been crafting wines for over a century, passing down knowledge and passion through generations.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-6">
                                <CloudinaryImage
                                    src="/images/landscape.jpg"
                                    alt="Vineyard landscape"
                                    className="rounded-lg object-cover"
                                />
                                <CloudinaryImage
                                    src="/images/winery.jpg"
                                    alt="Winery barrels"
                                    className="rounded-lg object-cover"
                                />
                                <CloudinaryImage
                                    src="/images/tasting.jpg"
                                    alt="Wine tasting"
                                    className="rounded-lg object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Latest News Section */}
                <section className="container mx-auto px-4 py-16">
                    <h2 className="mb-12 text-center text-3xl font-bold">LATEST NEWS</h2>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <article className="group">
                            <CloudinaryImage
                                src="/images/news/tradition.jpg"
                                alt="Winemaking Tradition"
                                className="mb-4 rounded-lg object-cover"
                            />
                            <h3 className="mb-2 text-xl font-semibold group-hover:text-[#FF2D20]">
                                The Art of Winemaking: Tradition and Passion at Every Step
                            </h3>
                            <p className="text-gray-600">Discover how we maintain our century-old traditions while embracing modern techniques...</p>
                            <Link href="#" className="mt-4 inline-block text-[#FF2D20]">Continue reading</Link>
                        </article>
                        <article className="group">
                            <CloudinaryImage
                                src="/images/news/harvest.jpg"
                                alt="Exploring Málaga"
                                className="mb-4 rounded-lg object-cover"
                            />
                            <h3 className="mb-2 text-xl font-semibold group-hover:text-[#FF2D20]">
                                Exploring the Diversity of Málaga Terroir
                            </h3>
                            <p className="text-gray-600">Join us on a journey through the unique characteristics of our region...</p>
                            <Link href="#" className="mt-4 inline-block text-[#FF2D20]">Continue reading</Link>
                        </article>
                        <article className="group">
                            <CloudinaryImage
                                src="/images/news/influence.jpg"
                                alt="Mediterranean Influence"
                                className="mb-4 rounded-lg object-cover"
                            />
                            <h3 className="mb-2 text-xl font-semibold group-hover:text-[#FF2D20]">
                                Unveiling the Influence of Málaga's Terroir on Wine
                            </h3>
                            <p className="text-gray-600">Learn how our Mediterranean climate shapes the character of our wines...</p>
                            <Link href="#" className="mt-4 inline-block text-[#FF2D20]">Continue reading</Link>
                        </article>
                    </div>
                </section>
            </main>

            <footer className="py-16 text-center text-sm text-black dark:text-white/70">
                Laravel v{laravelVersion} (PHP v{phpVersion})
            </footer>
        </>
    );
}
