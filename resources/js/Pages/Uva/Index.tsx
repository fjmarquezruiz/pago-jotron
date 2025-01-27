import { Head, Link } from "@inertiajs/react";
import { Uva, PaginatedData, PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Pagination from "@/Components/Pagination";
import {
    primaryButton,
    tableButtonClasses,
    tableTDClasses,
    tableTHClasses,
} from "@/styles";
import { IconEdit, IconEye, IconTrash } from "@tabler/icons-react";

/**
 * A React component for displaying a list of uvas.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.auth - Authentication data.
 * @param {PaginatedData<Uva>} props.uvas - Paginated uva data.
 * @returns {JSX.Element} A JSX element representing the list of uvas.
 */
export default function Index({
    auth,
    uvas,
}: PageProps<{
    uvas: PaginatedData<Uva>;
}>) {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Grapes
                    </h2>
                    <Link
                        href={route("uva.create")}
                        className={primaryButton}
                        aria-label="Create new grape"
                        title="Create new grape"
                    >
                        Create new grape
                    </Link>
                </>
            }
        >
            <Head title="Grapes" />

            {/* <pre>{typeof uvas}</pre>
            <pre>{JSON.stringify(uvas, undefined, 2)}</pre> */}
            {/*<pre>
                {uvas.data.map((uva, uvaIndex) => (
                    <>
                        {uva.id} - {uva.name}
                        <br />
                    </>
                ))}
            </pre> */}

            {/* Table to display uva data */}
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

                            <th
                                scope="col"
                                className={`${tableTHClasses} text-right`}
                            >
                                actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {uvas.data.map((uva, uvaIndex) => {
                            return (
                                <tr key={uvaIndex}>
                                    <td className={tableTDClasses}>{uva.id}</td>
                                    <td className={tableTDClasses}>
                                        <Link
                                            href={route("uva.show", uva.id)}
                                            className="hover:underline"
                                            aria-label={`View grape ${uva.name}`}
                                            title={`View grape ${uva.name}`}
                                        >
                                            {uva.name}
                                        </Link>
                                    </td>

                                    <td
                                        className={`${tableTDClasses} text-right`}
                                    >
                                        <div className="flex justify-end gap-2">
                                            {/* View uva details */}
                                            <Link
                                                href={route("uva.show", uva.id)}
                                                className={`${tableButtonClasses}`}
                                                aria-label={`View grape ${uva.name}`}
                                                title={`View grape ${uva.name}`}
                                            >
                                                <IconEye
                                                    stroke={1.5}
                                                    className="size-5"
                                                />
                                            </Link>
                                            {/* Edit uva details */}
                                            <Link
                                                href={route("uva.edit", uva.id)}
                                                className={`${tableButtonClasses}`}
                                                aria-label={`Edit grape ${uva.name}`}
                                                title={`Edit grape ${uva.name}`}
                                            >
                                                <IconEdit
                                                    stroke={1.5}
                                                    className="size-5"
                                                />
                                            </Link>
                                            {/* Delete uva */}
                                            <Link
                                                href={route(
                                                    "uva.destroy",
                                                    uva.id,
                                                )}
                                                method="delete"
                                                className={`${tableButtonClasses}`}
                                                aria-label={`Delete grape ${uva.name}`}
                                                title={`Delete grape ${uva.name}`}
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
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <Pagination
                links={uvas.meta.links}
                // queryParams={filteredQueryParams} // Uncomment if needed
            />
        </AuthenticatedLayout>
    );
}
