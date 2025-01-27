import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import { Denominacion } from "@/types";
import { secondaryButton } from "@/styles";
import DividerFields from "@/Components/Forms/DividerFields";

/**
 * A React component for displaying a denominacion's details.
 *
 * @param {Object} props - The component props.
 * @param {Denominacion} props.denominacion - The denominacion object to display.
 * @returns {JSX.Element} A JSX element representing the denominacion details.
 */
const Show = ({ denominacion }: { denominacion: Denominacion }) => {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Origin denomination <b>{denominacion.name}</b>
                    </h2>
                    <Link
                        href={route("denominacion.index")}
                        className={secondaryButton}
                        aria-label="Back"
                        title="Back"
                    >
                        Back
                    </Link>
                </>
            }
        >
            <Head title={"Origin denomination " + denominacion.name} />

            <div className="mb-4 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:rounded-lg">
                <div className="flex gap-12 p-6 text-gray-900 dark:text-gray-100 md:p-12">
                    <form
                        id="origin-denomination-form"
                        className="flex flex-1 flex-col gap-12"
                    >
                        {/* Basic Information Section */}
                        <BasicInfoSection data={denominacion} preview={true} />
                        <DividerFields />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("denominacion.index")}
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
