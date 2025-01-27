import Public from "@/Layouts/PublicLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import HeroSection from "../Layout/HeroSection";

const Index = ({ auth }: PageProps) => {
    return (
        <Public>
            <Head title="The shop" />
            <HeroSection
                section="The shop"
                title="The best wines of Andalusia"
                // section="HOME"
                // title="History and future from the heart of the Natural Park of Montes de Málaga"
            />
        </Public>
    );
};

export default Index;
