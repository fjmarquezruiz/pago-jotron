import DividerFields from "@/Components/Forms/DividerFields";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { CloudinaryImage } from "@/Components/CloudinaryImage";
import { secondaryButton } from "@/styles";
import { Uva } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { useEffect } from "react";
import BasicInfoSection from "./FormSections/BasicInfoSection";

/**
 * A React component for displaying a uva's details.
 *
 * @param {Object} props - The component props.
 * @param {Uva} props.uva - The uva object to display.
 * @returns {JSX.Element} A JSX element representing the uva details.
 */
const Show = ({ uva }: { uva: Uva }) => {
    useEffect(() => {
        console.log("Uva Data received in Show component:", uva);
    }, [uva]);

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

                        {/* Wines Section */}
                        <section className="flex flex-col gap-6">
                            <h3 className="text-xl border-b pb-2 font-bold text-gray-800 dark:text-gray-200">
                                Vinos que contienen esta variedad
                            </h3>
                            {uva.vinos && uva.vinos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                    {uva.vinos.map((vino) => (
                                        <Link
                                            key={vino.id}
                                            href={route("vino.show", vino.id)}
                                            className="group relative flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-amber-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-amber-500"
                                        >
                                            {/* Percentage Badge */}
                                            <div className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-800">
                                                {vino.pivot?.percent}%
                                            </div>

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

                                            <div className="flex flex-col items-center gap-1">
                                                <span className="line-clamp-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 group-hover:text-amber-700 dark:group-hover:text-amber-500">
                                                    {vino.name}
                                                </span>
                                                {vino.bodega && (
                                                    <span className="text-center text-[9px] italic text-gray-400">
                                                        {vino.bodega.name}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800/20">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No hay vinos registrados con esta variedad actualmente.
                                    </p>
                                </div>
                            )}
                        </section>

                        <DividerFields />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("uva.index")}
                                className={secondaryButton}
                                aria-label="Volver"
                                title="Volver"
                            >
                                Volver
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;
