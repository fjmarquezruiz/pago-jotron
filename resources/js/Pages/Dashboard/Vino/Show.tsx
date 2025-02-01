import DividerFields from "@/Components/Forms/DividerFields";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { secondaryButton } from "@/styles";
import { Vino } from "@/types/vino";
import { Head, Link } from "@inertiajs/react";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import DetailsSection from "./FormSections/DetailsSection";
import GrapesSection from "./FormSections/GrapesSection";
import ImageUploadSection from "./FormSections/ImageUploadSection";
import TastingNotesSection from "./FormSections/TastingNotesSection";
import TechnicalDetailsSection from "./FormSections/TechnicalDetailsSection";

/**
 * A React component for show a vino.
 *
 * @returns {JSX.Element} A JSX element representing the create vino form.
 */
const Show = ({ vino }: { vino: Vino }) => {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Wine <b>{vino.name}</b>
                    </h2>
                    <Link
                        href={route("vino.index")}
                        className={secondaryButton}
                        aria-label="Back"
                        title="Back"
                    >
                        Back
                    </Link>
                </>
            }
        >
            <Head title={"Wine " + vino.name} />

            <div className="mb-4 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:rounded-lg">
                <div className="flex gap-12 p-6 text-gray-900 dark:text-gray-100 md:p-12">
                    <form
                        id="wine-form"
                        className="flex flex-1 flex-col gap-12"
                    >
                        {/* Basic Information Section */}
                        <BasicInfoSection data={vino} preview={true} />
                        <DividerFields />

                        {/* Details and Technical Details Sections */}
                        <div className="flex flex-1 flex-col gap-6">
                            <DetailsSection data={vino} preview={true} />
                            <TechnicalDetailsSection
                                data={vino}
                                preview={true}
                            />
                        </div>
                        <DividerFields />

                        {/* Varieties Sections */}
                        <GrapesSection data={vino} preview={true} />
                        <DividerFields />

                        {/* Image Upload Section */}
                        <ImageUploadSection data={vino} preview={true} />
                        <DividerFields />

                        {/* Tasting Notes Section */}
                        <TastingNotesSection data={vino} preview={true} />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("vino.index")}
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
