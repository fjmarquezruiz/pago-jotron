import { Head, Link } from "@inertiajs/react";
import { PaginatedData } from "@/types";
import { Vino } from "@/types/vino";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Pagination from "@/Components/Pagination";
import Badge from "@/Components/Forms/Badge";
import {
    primaryButton,
    tableButtonClasses,
    tableTDClasses,
    tableTHClasses,
} from "@/styles";
import { IconEdit, IconEye, IconTrash } from "@tabler/icons-react";

/**
 * The main component for displaying a list of vinos.
 * It includes a table to show vino details and pagination controls.
 *
 * @param {Object} props - The props passed to the component.
 * @param {PaginatedData<Vino>} props.vinos - The paginated data containing vinos.
 */

const Index = ({ vinos }: { vinos: PaginatedData<Vino> }) => {
    /**
     * Check if vinos data is available.
     * If not, display a message indicating no vinos are available.
     */
    if (!vinos || !vinos.data) {
        return <p>No vinos available.</p>;
    }

    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Wines
                    </h2>
                    {/* Button to create a new vino */}
                    <Link
                        href={route("vino.create")}
                        className={primaryButton}
                        aria-label="Create new wine"
                        title="Create new wine"
                    >
                        Create new wine
                    </Link>
                </>
            }
        >
            <Head title="Wines" />

            {/* Table to display vino data */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-gray-50 dark:divide-gray-700 dark:bg-gray-800">
                    <thead>
                        <tr>
                            <th scope="col" className={tableTHClasses}>
                                id
                            </th>
                            <th scope="col" className={tableTHClasses}>
                                name
                            </th>
                            <th scope="col" className={tableTHClasses}>
                                winery
                            </th>
                            <th
                                scope="col"
                                className={`${tableTHClasses} text-right`}
                            >
                                stock
                            </th>
                            <th
                                scope="col"
                                className={`${tableTHClasses} text-right`}
                            >
                                price
                            </th>
                            <th
                                scope="col"
                                className={`${tableTHClasses} text-right`}
                            >
                                actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {vinos.data.map((vino, vinoIndex) => (
                            <tr key={vinoIndex}>
                                <td className={tableTDClasses}>{vino.id}</td>
                                <td className={tableTDClasses}>
                                    <Link
                                        href={route("vino.show", vino)}
                                        className="hover:underline"
                                        aria-label={`View vino ${vino.name}`}
                                    >
                                        {vino.name}
                                    </Link>{" "}
                                    {vino.blocked ? (
                                        <Badge label="Blocked" status="error" />
                                    ) : (
                                        <></>
                                    )}
                                </td>
                                <td className={tableTDClasses}>
                                    {/* Display winery name or "N/A" if not available */}
                                    {vino.bodega ? vino.bodega.name : "N/A"}
                                </td>
                                <td className={`${tableTDClasses} text-right`}>
                                    {vino.stock}
                                </td>
                                <td className={`${tableTDClasses} text-right`}>
                                    {vino.price}
                                </td>
                                <td className={`${tableTDClasses} text-right`}>
                                    <div className="flex justify-end gap-2">
                                        {/* View vino details */}
                                        <Link
                                            href={route("vino.show", vino)}
                                            className={`${tableButtonClasses}`}
                                            aria-label={`View wine ${vino.name}`}
                                            title={`View wine ${vino.name}`}
                                        >
                                            <IconEye
                                                stroke={1.5}
                                                className="size-5"
                                            />
                                        </Link>
                                        {/* Edit vino details */}
                                        <Link
                                            href={route("vino.edit", vino.id)}
                                            className={`${tableButtonClasses}`}
                                            aria-label={`Edit wine ${vino.name}`}
                                            title={`Edit wine ${vino.name}`}
                                        >
                                            <IconEdit
                                                stroke={1.5}
                                                className="size-5"
                                            />
                                        </Link>
                                        {/* Delete vino */}
                                        <Link
                                            href={route(
                                                "vino.destroy",
                                                vino.id,
                                            )}
                                            method="delete"
                                            className={`${tableButtonClasses}`}
                                            aria-label={`Delete wine ${vino.name}`}
                                            title={`Delete wine ${vino.name}`}
                                        >
                                            <IconTrash
                                                stroke={1.5}
                                                className="size-5"
                                            />
                                        </Link>
                                        {/* Pause vino (action not specified) */}
                                        {/* <button
                                            className={`${tableButtonClasses}`}
                                            aria-label={`Pause vino ${vino.name}`}
                                            onClick={() => {
                                                handleBlocked(vino);
                                            }}
                                        >
                                            {vino.blocked ? (
                                                <PlayIcon className="size-6" />
                                            ) : (
                                                <PauseIcon className="size-6" />
                                            )}
                                        </button> */}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <Pagination
                links={vinos.meta.links}
                // queryParams={filteredQueryParams} // Uncomment if needed
            />
        </AuthenticatedLayout>
    );
};

export default Index;
