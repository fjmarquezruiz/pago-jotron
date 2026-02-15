import Badge from "@/Components/Forms/Badge";
import Pagination from "@/Components/Pagination";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import {
    primaryButton,
    tableButtonClasses,
    tableTDClasses,
    tableTHClasses,
} from "@/styles";
import { Bodega, PageProps, PaginatedData } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { IconEdit, IconEye, IconTrash } from "@tabler/icons-react";

/**
 * A React component for displaying a list of bodegas.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.auth - Authentication data.
 * @param {PaginatedData<Bodega>} props.bodegas - Paginated bodega data.
 * @returns {JSX.Element} A JSX element representing the list of bodegas.
 */
export default function Index({
    auth,
    bodegas,
}: PageProps<{
    bodegas: PaginatedData<Bodega>;
}>) {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Wineries
                    </h2>
                    <Link
                        href={route("bodega.create")}
                        className={primaryButton}
                        aria-label="Create new winery"
                        title="Create new winery"
                    >
                        Create new winery
                    </Link>
                </>
            }
        >
            <Head title="Wineries" />

            {/* Table to display bodega data */}
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
                                city
                            </th>
                            <th scope="col" className={tableTHClasses}>
                                denomination
                            </th>
                            <th scope="col" className={tableTHClasses}>
                                province
                            </th>
                            <th scope="col" className={tableTHClasses}>
                                wines
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
                        {bodegas.data.map((bodega, bodegaIndex) => {
                            return (
                                <tr key={bodegaIndex}>
                                    <td className={tableTDClasses}>
                                        {bodega.id}
                                    </td>
                                    <td className={tableTDClasses}>
                                        <Link
                                            href={route("bodega.show", bodega)}
                                            className="hover:underline"
                                            aria-label={`View bodega ${bodega.name}`}
                                        >
                                            {bodega.name}
                                        </Link>{" "}
                                        {bodega.blocked ? (
                                            <Badge
                                                label="Blocked"
                                                status="error"
                                                className="ml-2"
                                            />
                                        ) : (
                                            <></>
                                        )}
                                    </td>
                                    <td className={tableTDClasses}>
                                        {/* Display city name or "N/A" if not available */}
                                        {bodega.city ? bodega.city : "N/A"}
                                    </td>
                                    <td className={tableTDClasses}>
                                        <div className="flex flex-wrap gap-1">
                                            {bodega.denominaciones &&
                                                bodega.denominaciones.length > 0 ? (
                                                bodega.denominaciones.map(
                                                    (denominacion) => (
                                                        <Link
                                                            key={denominacion.id}
                                                            href={route(
                                                                "denominacion.show",
                                                                denominacion.id,
                                                            )}
                                                            className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                                                        >
                                                            {denominacion.name}
                                                        </Link>
                                                    ),
                                                )
                                            ) : (
                                                <span className="text-gray-400">
                                                    N/A
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={tableTDClasses}>
                                        {bodega.province
                                            ? bodega.province
                                            : "N/A"}
                                    </td>
                                    <td className={tableTDClasses}>
                                        {bodega.vinos_count ?? 0}
                                    </td>
                                    <td
                                        className={`${tableTDClasses} text-right`}
                                    >
                                        <div className="flex justify-end gap-2">
                                            {/* View bodega details */}
                                            <Link
                                                href={route(
                                                    "bodega.show",
                                                    bodega,
                                                )}
                                                className={`${tableButtonClasses}`}
                                                aria-label={`View winery ${bodega.name}`}
                                                title={`View winery ${bodega.name}`}
                                            >
                                                <IconEye
                                                    stroke={1.5}
                                                    className="size-5"
                                                />
                                            </Link>
                                            {/* Edit bodega details */}
                                            <Link
                                                href={route(
                                                    "bodega.edit",
                                                    bodega.id,
                                                )}
                                                className={`${tableButtonClasses}`}
                                                aria-label={`Edit winery ${bodega.name}`}
                                                title={`Edit winery ${bodega.name}`}
                                            >
                                                <IconEdit
                                                    stroke={1.5}
                                                    className="size-5"
                                                />
                                            </Link>
                                            {/* Delete bodega */}
                                            <Link
                                                href={route(
                                                    "bodega.destroy",
                                                    bodega.id,
                                                )}
                                                method="delete"
                                                className={`${tableButtonClasses}`}
                                                aria-label={`Delete winery ${bodega.name}`}
                                                title={`Delete winery ${bodega.name}`}
                                            >
                                                <IconTrash
                                                    stroke={1.5}
                                                    className="size-5"
                                                />
                                            </Link>
                                            {/* Toggle blocked status */}
                                            {/* <button
                                                className={`${tableButtonClasses}`}
                                                aria-label={`Toggle blocked status for bodega ${bodega.name}`}
                                                onClick={() => {
                                                    // Implement toggle blocked logic here
                                                    // Example: handleToggleBlocked(bodega.id);
                                                }}
                                            >
                                                {bodega.blocked ? (
                                                    <IconPlayerPlay
                                                        stroke={1.5}
                                                        className="size-5"
                                                    />
                                                ) : (
                                                    <IconPlayerPause
                                                        stroke={1.5}
                                                        className="size-5"
                                                    />
                                                )}
                                            </button> */}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <Pagination
                links={bodegas.meta.links}
            // queryParams={filteredQueryParams} // Uncomment if needed
            />
        </AuthenticatedLayout>
    );
}
