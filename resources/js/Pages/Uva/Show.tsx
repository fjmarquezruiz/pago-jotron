import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import { Uva } from "@/types";
import { secondaryButton } from "@/styles";
import DividerFields from "@/Components/Forms/DividerFields";

/**
 * A React component for displaying a uva's details.
 *
 * @param {Object} props - The component props.
 * @param {Uva} props.uva - The uva object to display.
 * @returns {JSX.Element} A JSX element representing the uva details.
 */
const Show = ({ uva }: { uva: Uva }) => {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Grape <b>{uva.name}</b>
                    </h2>
                    <Link
                        href={route("uva.index")}
                        className={secondaryButton}
                        aria-label="Back"
                        title="Back"
                    >
                        Back
                    </Link>
                </>
            }
        >
            <Head title={"Grape " + uva.name} />

            <div className="mb-4 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:rounded-lg">
                <div className="flex gap-12 p-6 text-gray-900 dark:text-gray-100 md:p-12">
                    <form
                        id="grape-form"
                        className="flex flex-1 flex-col gap-12"
                    >
                        {/* Basic Information Section */}
                        <BasicInfoSection data={uva} preview={true} />
                        <DividerFields />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("uva.index")}
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
