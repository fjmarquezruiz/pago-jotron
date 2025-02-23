import { Head } from "@inertiajs/react";
import { Link } from "@inertiajs/react";
import HeroSection from "../Layout/HeroSection";
import { PageProps } from "@/types";

const Success = ({ auth }: PageProps) => {
    return (
        <>
            <Head title="Order Successful" />
            <HeroSection
                auth={auth}
                section="Success"
                title="Order Successful!"
            />

            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="mb-4 text-2xl font-bold">
                        Thank you for your order!
                    </h2>
                    <p className="mb-8 text-gray-600">
                        We have received your order and will process it shortly.
                        You will receive a confirmation email with your order
                        details.
                    </p>
                    <Link
                        href={route("shop")}
                        className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </main>
        </>
    );
};

export default Success; 