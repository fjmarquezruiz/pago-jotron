import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { FormEventHandler, useRef } from "react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { User } from "@/types";
import { getMaxDate, handleGoToPage } from "../Vino/utils";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import PermissionsSection from "./FormSections/PermissionsSection";
import DividerFields from "@/Components/Forms/DividerFields";
import { secondaryButton } from "@/styles";

/**
 * A component that renders the edit form for a user.
 * This component includes sections for basic information, details, technical details, image upload, and tasting notes.
 *
 * @param {Object} props - The props object containing the user data.
 * @param {User} props.user - The user data to be edited.
 * @returns {JSX.Element} - A JSX element representing the edit form.
 */
const Edit = ({
    user,
    roles,
    roleLabels,
}: {
    user: User;
    roles: any;
    roleLabels: Record<string, string>;
}) => {
    // Access flash messages from the page props
    const { props } = usePage();

    // Initialize form data using useForm hook from Inertia.js
    const {
        data,
        setData,
        processing,
        errors,
        put,
        reset,
        recentlySuccessful,
    } = useForm<User>({
        id: user?.id || 0,
        name: user?.name || "",
        last_name: user?.last_name || "",
        date_of_birth: user?.date_of_birth
            ? new Date(user.date_of_birth).toISOString().split("T")[0]
            : getMaxDate(),
        email: user?.email || "",
        email_verified_at: user?.email_verified_at || "",
        password: user.password,
        id_card: user?.id_card || "",
        phone_number: user?.phone_number || "",
        account_status: user?.account_status || true,
        age_verified: user?.age_verified || false,
        created_at: user?.created_at || new Date().toISOString(),
        permissions: user.permissions || [],
        roles: user.roles || [],
    });

    // Create a ref for the form element
    const formRef = useRef<HTMLFormElement>(null);

    /**
     * Handles the form submission for editing the user.
     *
     * @param {React.FormEvent<HTMLFormElement>} ev - The form submission event.
     */
    const handleSubmit: FormEventHandler<HTMLFormElement> = (ev) => {
        ev.preventDefault();

        // Submit the form data using the post method from Inertia.js
        put(route("user.update", user.id), {
            preserveScroll: true,
            onSuccess: () => {
                console.log("User updated successfully");
                reset();
            },
            onError: (errors) => {
                console.log("ERRORS update:", errors);
                console.log("ERRORS data:", data);
            },
        });
    };

    /**
     * Handles changes to the form fields.
     *
     * @param {keyof User} field - The field name.
     * @param {any} value - The new value for the field.
     */
    const handleFieldChange = (field: keyof User, value: any) => {
        setData(field as keyof User, value);
    };

    /**
     * Programmatically submits the form.
     */
    const submitForm = () => {
        if (formRef.current) {
            formRef.current.dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true }),
            );
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Edit user <b>{user.name}</b>
                    </h2>
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            href={route("user.index")}
                            className={secondaryButton}
                            aria-label="Cancel"
                            title="Cancel"
                        >
                            Cancel
                        </Link>
                        <PrimaryButton
                            disabled={processing}
                            onClick={submitForm}
                            aria-label="Save"
                            title="Save"
                        >
                            Save
                        </PrimaryButton>
                    </div>
                </>
            }
        >
            <Head title={`Edit user ${user.name}`} />

            {/* Display success and error messages */}
            {props.success && (
                <div className="mb-4 border-l-4 border-green-500 bg-green-100 p-4">
                    <p className="text-green-700">{props.success}</p>
                </div>
            )}
            {props.error && (
                <div className="mb-4 border-l-4 border-red-500 bg-red-100 p-4">
                    <p className="text-red-700">{props.error}</p>
                </div>
            )}

            {/* <pre>{JSON.stringify(user, undefined, 2)}</pre> */}

            <div className="mb-4 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:rounded-lg">
                <div className="flex gap-12 p-6 text-gray-900 dark:text-gray-100 md:p-12">
                    <form
                        id="user-form"
                        ref={formRef}
                        onSubmit={handleSubmit}
                        encType="multipart/form-data" // Ensure form data is encoded correctly for file uploads
                        className="flex flex-1 flex-col gap-12"
                    >
                        {/* Basic Information Section */}
                        <BasicInfoSection
                            data={data}
                            onChange={handleFieldChange}
                            errors={errors}
                        />
                        <DividerFields />

                        <PermissionsSection
                            data={data}
                            roles={roles}
                            roleLabels={roleLabels}
                            onChange={handleFieldChange}
                            errors={errors}
                        />
                        <DividerFields />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("user.index")}
                                className={secondaryButton}
                                aria-label="Cancel"
                                title="Cancel"
                            >
                                Cancel
                            </Link>
                            <PrimaryButton
                                disabled={processing}
                                aria-label="Save"
                                title="Save"
                            >
                                Save
                            </PrimaryButton>

                            {/* Success Message Transition */}
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Saved.
                                </p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Edit;
