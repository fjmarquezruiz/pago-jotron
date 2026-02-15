import DividerFields from "@/Components/Forms/DividerFields";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { secondaryButton } from "@/styles";
import { Denominacion } from "@/types";
import { Head, Link } from "@inertiajs/react";
import BasicInfoSection from "./FormSections/BasicInfoSection";

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

                        {/* Wineries Section */}
                        <section className="flex flex-col gap-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                Wineries in this area
                            </h3>
                            {denominacion.bodegas &&
                                denominacion.bodegas.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {denominacion.bodegas.map((bodega) => (
                                        <Link
                                            key={bodega.id}
                                            href={route(
                                                "bodega.show",
                                                bodega.id,
                                            )}
                                            className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-amber-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-amber-500"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-700 dark:group-hover:text-amber-500">
                                                    {bodega.name}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {bodega.city},{" "}
                                                    {bodega.province}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    No wineries registered in this area yet.
                                </p>
                            )}
                        </section>
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
