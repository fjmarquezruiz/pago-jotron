import DividerFields from "@/Components/Forms/DividerFields";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { CloudinaryImage } from "@/Components/CloudinaryImage";
import { secondaryButton } from "@/styles";
import { Bodega } from "@/types";
import { Head, Link } from "@inertiajs/react";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import RegionsSection from "./FormSections/RegionsSection";

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

                        {/* Wines Section */}
                        <section className="flex flex-col gap-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                Wines from this winery
                            </h3>
                            {bodega.vinos && bodega.vinos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                    {bodega.vinos.map((vino) => (
                                        <Link
                                            key={vino.id}
                                            href={route("vino.show", vino.id)}
                                            className="group flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-amber-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-amber-500"
                                        >
                                            <div className="aspect-[3/4] w-full overflow-hidden rounded bg-gray-50 dark:bg-gray-800">
                                                <CloudinaryImage
                                                    src={
                                                        vino.image_url ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt={vino.name}
                                                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                                                />
                                            </div>
                                            <span className="line-clamp-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 group-hover:text-amber-700 dark:group-hover:text-amber-500">
                                                {vino.name}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    No wines registered for this winery yet.
                                </p>
                            )}
                        </section>
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
