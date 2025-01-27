import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import { User } from "@/types";
import PermissionsSection from "./FormSections/PermissionsSection";
import DividerFields from "@/Components/Forms/DividerFields";
import { secondaryButton } from "@/styles";

/**
 * A React component for displaying a user's details.
 *
 * @param {Object} props - The component props.
 * @param {User} props.user - The user object to display.
 * @returns {JSX.Element} A JSX element representing the user details.
 */
const Show = ({
    user,
    roles,
    roleLabels,
}: {
    user: User;
    roles: any;
    roleLabels: Record<string, string>;
}) => {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        User <b>{user.name}</b>
                    </h2>
                    <Link
                        href={route("user.index")}
                        className={secondaryButton}
                        aria-label="Back"
                        title="Back"
                    >
                        Back
                    </Link>
                </>
            }
        >
            <Head title={"User " + user.name} />

            <div className="mb-4 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:rounded-lg">
                <div className="flex gap-12 p-6 text-gray-900 dark:text-gray-100 md:p-12">
                    <form
                        id="user-form"
                        className="flex flex-1 flex-col gap-12"
                    >
                        {/* Basic Information Section */}
                        <BasicInfoSection data={user} preview={true} />
                        <DividerFields />

                        <PermissionsSection
                            data={user}
                            roles={roles}
                            roleLabels={roleLabels}
                            preview={true}
                        />
                        <DividerFields />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("user.index")}
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
