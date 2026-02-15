import Badge from "@/Components/Forms/Badge";
import Pagination from "@/Components/Pagination";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import {
    primaryButton,
    tableButtonClasses,
    tableTDClasses,
    tableTHClasses,
} from "@/styles";
import { Denominacion, PageProps, PaginatedData } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { IconEdit, IconEye, IconTrash } from "@tabler/icons-react";

/**
 * A React component for displaying a list of denominaciones.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.auth - Authentication data.
 * @param {PaginatedData<Denominacion>} props.denominaciones - Paginated Denominacion data.
 * @returns {JSX.Element} A JSX element representing the list of denominaciones.
 */
export default function Index({
    auth,
    denominaciones,
}: PageProps<{
    denominaciones: PaginatedData<Denominacion>;
}>) {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Denominations
                    </h2>
                    <Link
                        href={route("denominacion.create")}
                        className={primaryButton}
                        aria-label="Create new denomination"
                        title="Create new denomination"
                    >
                        Create new denomination
                    </Link>
                </>
            }
        >
            <Head title="Denominations" />

            {/* <pre>{typeof denominaciones}</pre>
            <pre>{JSON.stringify(denominaciones, undefined, 2)}</pre> */}
            {/*<pre>
                {denominaciones.data.map((Denominacion, denominacionIndex) => (
                    <>
                        {Denominacion.id} - {Denominacion.name}
                        <br />
                    </>
                ))}
            </pre> */}

            {/* Table to display Denominacion data */}
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
                                wineries
                            </th>
                            <th scope="col" className={tableTHClasses}>
                                total wines
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
                        {denominaciones.data.map(
                            (denominacion, denominacionIndex) => {
                                return (
                                    <tr key={denominacionIndex}>
                                        <td className={tableTDClasses}>
                                            {denominacion.id}
                                        </td>
                                        <td className={tableTDClasses}>
                                            <Link
                                                href={route(
                                                    "denominacion.show",
                                                    denominacion.id,
                                                )}
                                                className="hover:underline"
                                                aria-label={`View denomination ${denominacion.name}`}
                                                title={`View denomination ${denominacion.name}`}
                                            >
                                                {denominacion.name}
                                            </Link>{" "}
                                            {denominacion.blocked ? (
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
                                            {denominacion.bodegas_count ?? 0}
                                        </td>
                                        <td className={tableTDClasses}>
                                            {denominacion.vinos_count ?? 0}
                                        </td>

                                        <td
                                            className={`${tableTDClasses} text-right`}
                                        >
                                            <div className="flex justify-end gap-2">
                                                {/* View Denominacion details */}
                                                <Link
                                                    href={route(
                                                        "denominacion.show",
                                                        denominacion.id,
                                                    )}
                                                    className={`${tableButtonClasses}`}
                                                    aria-label={`View denomination ${denominacion.name}`}
                                                    title={`View denomination ${denominacion.name}`}
                                                >
                                                    <IconEye
                                                        stroke={1.5}
                                                        className="size-5"
                                                    />
                                                </Link>
                                                {/* Edit Denominacion details */}
                                                <Link
                                                    href={route(
                                                        "denominacion.edit",
                                                        denominacion.id,
                                                    )}
                                                    className={`${tableButtonClasses}`}
                                                    aria-label={`Edit denomination ${denominacion.name}`}
                                                    title={`Edit denomination ${denominacion.name}`}
                                                >
                                                    <IconEdit
                                                        stroke={1.5}
                                                        className="size-5"
                                                    />
                                                </Link>
                                                {/* Delete Denominacion */}
                                                <Link
                                                    href={route(
                                                        "denominacion.destroy",
                                                        denominacion.id,
                                                    )}
                                                    method="delete"
                                                    className={`${tableButtonClasses}`}
                                                    aria-label={`Delete denomination ${denominacion.name}`}
                                                    title={`Delete denomination ${denominacion.name}`}
                                                >
                                                    <IconTrash
                                                        stroke={1.5}
                                                        className="size-5"
                                                    />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            },
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <Pagination
                links={denominaciones.meta.links}
            // queryParams={filteredQueryParams} // Uncomment if needed
            />
        </AuthenticatedLayout >
    );
}
