// Import necessary components and hooks
import DividerFields from "@/Components/Forms/DividerFields";
import InputField from "@/Components/Forms/InputField";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { secondaryButton } from "@/styles";
import { User } from "@/types";
import { getMaxDate } from "@/utils";
import { Transition } from "@headlessui/react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler, useRef } from "react";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import PermissionsSection from "./FormSections/PermissionsSection";

/**
 * A React component for creating a new user.
 *
 * @returns {JSX.Element} A JSX element representing the create user form.
 */
const Create = ({
    roles,
    roleLabels,
}: {
    roles: any;
    roleLabels: Record<string, string>;
}) => {
    // Access flash messages from the page props
    const { props } = usePage();

    // Initialize form data using useForm hook
    const {
        data,
        setData,
        processing,
        errors,
        post,
        reset,
        recentlySuccessful,
    } = useForm<User>({
        id: 0,
        name: "",
        last_name: "",
        date_of_birth: getMaxDate(),
        email: "",
        email_verified_at: "",
        password: "",
        id_card: "",
        phone_number: "",
        account_status: true,
        age_verified: false,
        created_at: new Date().toISOString(),
        permissions: [],
        roles: ["user"],
    });

    // Create a ref for the form element
    const formRef = useRef<HTMLFormElement>(null);

    /**
     * Handles the form submission event.
     *
     * @param {React.FormEvent<HTMLFormElement>} ev - The form submission event.
     */
    const handleSubmit: FormEventHandler<HTMLFormElement> = (ev) => {
        ev.preventDefault();

        post(route("user.store"), {
            // data: updatedData, // Pass the updated data directly
            preserveScroll: true,
            onSuccess: () => {
                reset();
                console.log("SUCCESS creating a user!!!!");
            },
            onError: (errors) => {
                console.log("ERRORS create:", errors);
                console.log("ERRORS data:", data);
            },
        });
    };

    /**
     * Handles changes to form fields.
     *
     * @param {keyof User} field - The field name to update.
     * @param {any} value - The new value for the field.
     */
    const handleFieldChange = (field: keyof User, value: any) => {
        setData(field as keyof User, value);
        if (field === "name") {
            setData("password", String(value + "1234"));
        }
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

    const LABEL_PASSWORD = "Password";

    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Create new user
                    </h2>
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
                            onClick={submitForm}
                        >
                            Save
                        </PrimaryButton>
                    </div>
                </>
            }
        >
            <Head title="Create new user" />

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

            <div className="mb-4 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:rounded-lg">
                <div className="flex gap-12 p-6 text-gray-900 dark:text-gray-100 md:p-12">
                    <form
                        id="user-form"
                        ref={formRef}
                        onSubmit={handleSubmit}
                        encType="multipart/form-data" // Ensure form data is encoded correctly for file uploads
                        className="flex w-full flex-col gap-12"
                    >
                        {/* Basic Information Section */}
                        <BasicInfoSection
                            data={data}
                            onChange={handleFieldChange}
                            errors={errors}
                        />
                        <DividerFields />

                        <InputField
                            type="text"
                            label={LABEL_PASSWORD}
                            value={data.name + "1234"}
                            onChange={(e) => {}}
                            placeholder={LABEL_PASSWORD}
                            required
                            disabled
                            error={errors.password}
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

export default Create;
