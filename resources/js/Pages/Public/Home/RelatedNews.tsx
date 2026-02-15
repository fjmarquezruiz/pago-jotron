"use client";

import { CloudinaryImage } from "@/Components/CloudinaryImage";
import { Link } from "@inertiajs/react";

interface NewsCard {
    id: number;
    title: string;
    image: string;
    date: string;
    category: string;
}

interface ProductsSliderProps {
    title?: string;
    news: { data: NewsCard[] };
}

const RelatedNews = ({ title = "Last news", news }: ProductsSliderProps) => {
    return (
        <div className="w-full bg-neutral-50">
            <section className="container mx-auto max-w-7xl px-5 py-16 xl:px-0">
                <div className="flex flex-col gap-12">
                    <div className="flex items-baseline justify-between">
                        <h2 className="heading-3xl-bold">{title}</h2>
                        <Link
                            href={route("shop")}
                            className="font-sm-semibold text-neutral-600 hover:underline"
                        >
                            View all
                        </Link>
                    </div>
                    <div className="flex w-full gap-4">
                        {news.data.map((newsItem) => (
                            <article
                                key={newsItem.id}
                                className="flex flex-col gap-2"
                            >
                                <Link
                                    href={route("shop")}
                                    className="group block aspect-square overflow-hidden rounded"
                                >
                                    <CloudinaryImage
                                        src={
                                            `${newsItem.image}` ||
                                            "/placeholder.svg"
                                        }
                                        alt={newsItem.title}
                                        className="h-full w-full object-cover object-center transition-all duration-500 ease-in-out group-hover:rotate-12 group-hover:scale-125"
                                    />
                                </Link>
                                <Link href={route("shop")} className="group">
                                    <h4 className="font-lg-bold text-neutral-900 group-hover:underline">
                                        {newsItem.title}
                                    </h4>
                                </Link>
                                <div className="font-sm-normal flex gap-4 text-neutral-900">
                                    {newsItem.date}
                                    <span className="text-neutral-500">
                                        {newsItem.category}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RelatedNews;
