import DividerFields from "@/Components/Forms/DividerFields";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { secondaryButton } from "@/styles";
import { Uva } from "@/types";
import { Transition } from "@headlessui/react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler, useRef } from "react";
import BasicInfoSection from "./FormSections/BasicInfoSection";

/**
 * A component that renders the edit form for a uva.
 * This component includes sections for basic information, details, technical details, image upload, and tasting notes.
 *
 * @param {Object} props - The props object containing the uva data.
 * @param {Uva} props.uva - The uva data to be edited.
 * @returns {JSX.Element} - A JSX element representing the edit form.
 */
const Edit = ({ uva }: { uva: Uva }) => {
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
    } = useForm<Uva>({
        id: uva?.id || 0,
        name: uva?.name || "",
        created_at: uva?.created_at || new Date().toISOString(),
        updated_at: uva?.updated_at || new Date().toISOString(),
        pivot: {
            vino_id: 0,
            percent: 0,
            name: "",
        },
    });

    // Create a ref for the form element
    const formRef = useRef<HTMLFormElement>(null);

    /**
     * Handles the form submission for editing the uva.
     *
     * @param {React.FormEvent<HTMLFormElement>} ev - The form submission event.
     */
    const handleSubmit: FormEventHandler<HTMLFormElement> = (ev) => {
        ev.preventDefault();

        // Submit the form data using the post method from Inertia.js
        put(route("uva.update", uva.id), {
            preserveScroll: true,
            onSuccess: () => {
                console.log("Uva updated successfully");
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
     * @param {keyof Uva} field - The field name.
     * @param {any} value - The new value for the field.
     */
    const handleFieldChange = (field: keyof Uva, value: any) => {
        setData(field as keyof Uva, value);
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
                        Edit uva <b>{uva.name}</b>
                    </h2>
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            href={route("uva.index")}
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
            <Head title={`Edit uva ${uva.name}`} />

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
                        id="grape-form"
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

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("uva.index")}
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
