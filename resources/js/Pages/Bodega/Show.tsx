import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import { Bodega } from "@/types";
import RegionsSection from "./FormSections/RegionsSection";
import DividerFields from "@/Components/Forms/DividerFields";
import { secondaryButton } from "@/styles";

/**
 * A React component for displaying a bodega's details.
 *
 * @param {Object} props - The component props.
 * @param {Bodega} props.bodega - The bodega object to display.
 * @returns {JSX.Element} A JSX element representing the bodega details.
 */
const Show = ({ bodega }: { bodega: Bodega }) => {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Winery <b>{bodega.name}</b>
                    </h2>
                    <Link
                        href={route("bodega.index")}
                        className={secondaryButton}
                        aria-label="Back"
                        title="Back"
                    >
                        Back
                    </Link>
                </>
            }
        >
            <Head title={"Winery " + bodega.name} />

            <div className="mb-4 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                <div className="flex gap-12 p-6 text-gray-900 dark:text-gray-100 md:p-12">
                    <form
                        id="winery-form"
                        className="flex flex-1 flex-col gap-12"
                    >
                        {/* Basic Information Section */}
                        <BasicInfoSection data={bodega} preview={true} />
                        <DividerFields />

                        {/* Regions Section */}
                        <RegionsSection data={bodega} preview={true} />
                        <DividerFields />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("bodega.index")}
                                className={secondaryButton}
                                aria-label="Back"
                                title="Back"
                            >
                                Back
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;
