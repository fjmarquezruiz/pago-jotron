import { PageProps } from "@/types";
import { Vino } from "@/types/vino";
import { Head } from "@inertiajs/react";
import { useEffect, useState } from "react";
import HeroSection from "../Layout/HeroSection";
import Banner from "./Banner";
import HistoryBoxes from "./HistoryBoxes";
import ProductSlider from "./ProductsSlider";
import RelatedNews from "./RelatedNews";
import WinesSlider from "./WinesSlider";

const PRODUCTS_SLIDER = {
    data: [
        {
            id: 1,
            name: "Our selection",
            image: "/v1742150149/bg-our-selection_xklmwt.png",
        },
        {
            id: 2,
            name: "Fortified",
            image: "/v1742150149/bg-fortified.png",
        },
        {
            id: 3,
            name: "Red wines",
            image: "/v1742150446/bg-red-wines_dkxasj.png",
        },
        {
            id: 4,
            name: "White wines",
            image: "/v1742150148/bg-white-wines_collev.png",
        },
        {
            id: 5,
            name: "Sweets",
            image: "/v1742150149/bg-sweets.png",
        },
        {
            id: 6,
            name: "Events",
            image: "/v1742150148/bg-events_hqzdbo.png",
        },
    ],
};

const LAST_NEWS = {
    data: [
        {
            id: 1,
            title: "The art of winemaking: tradition and passion in every glass",
            image: "/v1742150149/bg-our-selection_xklmwt.png",
            date: "01.11.2024",
            category: "History",
        },
        {
            id: 2,
            title: "Exploring the diversity of Malaga wines",
            image: "/v1742150149/bg-fortified.png",
            date: "02.11.2024",
            category: "Wines",
        },
        {
            id: 3,
            title: "Unveiling the influence of Malaga's terroir on wine",
            image: "/v1742150446/bg-red-wines_dkxasj.png",
            date: "03.11.2024",
            category: "Category",
        },
    ],
};

const Index = ({
    auth,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) => {
    // console.log("welcome -> ", auth);
    // State variables to store the list of relatedWines
    const [relatedWines, setRelatedWines] = useState<Vino[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch data for relatedWines concurrently
                const [relatedWinesResponse] = await Promise.all([
                    fetch("/api/vinos/related/1"),
                ]);

                // Check if the responses are successful
                if (!relatedWinesResponse.ok) {
                    throw new Error(
                        `Error fetching relatedWines: ${relatedWinesResponse.statusText}`,
                    );
                }

                // Parse the JSON data from the responses
                const relatedWinesData = await relatedWinesResponse.json();

                // Ensure the data contains the expected array structure
                if (!Array.isArray(relatedWinesData.data)) {
                    throw new Error("RelatedWines data is not an array");
                }

                // Update the state with the fetched data
                setRelatedWines(relatedWinesData.data);
            } catch (err) {
                // Handle any errors that occur during fetching
                console.error("Error fetching data:", err);
                setFetchError("Failed to load data. Please try again later.");
            } finally {
                // Set loading state to false after fetching is complete
                setLoading(false);
            }
        };

        // Call the fetchData function
        fetchData();
    }, []); // Empty dependency array ensures this effect runs only once on mount

    console.log(relatedWines);

    return (
        <>
            <Head title="Store Welcome" />
            <HeroSection
                auth={auth}
                section="Home"
                title="History and future2"
                text="from the heart of the Natural Park of Montes de Málaga"
            />

            {/* Products Section */}
            <ProductSlider products={PRODUCTS_SLIDER} />

            {/* Best sellers Section */}
            <WinesSlider
                title="Best sellers"
                products={{ data: relatedWines }}
            />
            <Banner
                text="Created by"
                accentText="the elements"
                image="/v1742237991/bg-banner-02_yl5y0s.png"
            />

            {/* From our shop Section */}
            <WinesSlider
                title="From our shop"
                products={{ data: relatedWines }}
            />
            <Banner
                text="Land and barrell"
                accentText="FROM THE GRAPE TO THE GLASS..."
                image="/v1742237995/bg-banner-01_ophgvi.png"
            />

            {/* History boxes */}
            <HistoryBoxes />

            {/* Latest News Section */}
            <RelatedNews news={LAST_NEWS} />
        </>
    );
};

export default Index;
