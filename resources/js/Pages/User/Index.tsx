import { Head, Link } from "@inertiajs/react";
import { PaginatedData, PageProps, User } from "@/types";
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
 * A React component for displaying a list of users.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.auth - Authentication data.
 * @param {PaginatedData<User>} props.users - Paginated user data.
 * @returns {JSX.Element} A JSX element representing the list of users.
 */
export default function Index({
    auth,
    users,
}: PageProps<{
    users: PaginatedData<User>;
}>) {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Users
                    </h2>
                    <Link
                        href={route("user.create")}
                        className={primaryButton}
                        aria-label="Create new user"
                        title="Create new user"
                    >
                        Create new user
                    </Link>
                </>
            }
        >
            <Head title="Users" />

            {/* Table to display user data */}
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
                                email
                            </th>
                            <th scope="col" className={tableTHClasses}>
                                created at
                            </th>
                            <th scope="col" className={tableTHClasses}>
                                roles
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
                        {users.data.map((user, userIndex) => {
                            return (
                                <tr key={userIndex}>
                                    <td className={tableTDClasses}>
                                        {user.id}
                                    </td>
                                    <td className={tableTDClasses}>
                                        <Link
                                            href={route("user.show", user.id)}
                                            className="hover:underline"
                                            aria-label={`View user ${user.name}`}
                                        >
                                            {user.name}
                                        </Link>{" "}
                                    </td>
                                    <td className={tableTDClasses}>
                                        {user.email}
                                    </td>
                                    <td className={tableTDClasses}>
                                        {user.created_at}
                                    </td>
                                    <td className={tableTDClasses}>
                                        {user.roles.join(", ")}
                                    </td>

                                    <td
                                        className={`${tableTDClasses} text-right`}
                                    >
                                        <div className="flex justify-end gap-2">
                                            {/* View user details */}
                                            <Link
                                                href={route(
                                                    "user.show",
                                                    user.id,
                                                )}
                                                className={`${tableButtonClasses}`}
                                                aria-label={`View user ${user.name}`}
                                                title={`View user ${user.name}`}
                                            >
                                                <IconEye
                                                    stroke={1.5}
                                                    className="size-5"
                                                />
                                            </Link>
                                            {/* Edit user details */}
                                            <Link
                                                href={route(
                                                    "user.edit",
                                                    user.id,
                                                )}
                                                className={`${tableButtonClasses}`}
                                                aria-label={`Edit user ${user.name}`}
                                                title={`Edit user ${user.name}`}
                                            >
                                                <IconEdit
                                                    stroke={1.5}
                                                    className="size-5"
                                                />
                                            </Link>
                                            {/* Delete user */}
                                            <Link
                                                href={route(
                                                    "user.destroy",
                                                    user.id,
                                                )}
                                                method="delete"
                                                className={`${tableButtonClasses}`}
                                                aria-label={`Delete user ${user.name}`}
                                                title={`Delete user ${user.name}`}
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
                links={users.meta.links}
                // queryParams={filteredQueryParams} // Uncomment if needed
            />
        </AuthenticatedLayout>
    );
}
