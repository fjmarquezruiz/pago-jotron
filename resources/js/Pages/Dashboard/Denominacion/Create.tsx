// Import necessary components and hooks
import DividerFields from "@/Components/Forms/DividerFields";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { secondaryButton } from "@/styles";
import { Denominacion } from "@/types";
import { Transition } from "@headlessui/react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler, useRef } from "react";
import BasicInfoSection from "./FormSections/BasicInfoSection";

/**
 * A React component for creating a new uva.
 *
 * @returns {JSX.Element} A JSX element representing the create uva form.
 */
const Create = () => {
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
    } = useForm<Denominacion>({
        id: 0,
        name: "",
        blocked: false,
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

        post(route("denominacion.store"), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                console.log("SUCCESS creating a origin denomination!!!!");
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
     * @param {keyof Denominacion} field - The field name to update.
     * @param {any} value - The new value for the field.
     */
    const handleFieldChange = (field: keyof Denominacion, value: any) => {
        setData(field as keyof Denominacion, value);
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
                        Create new origin denomination
                    </h2>
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            href={route("denominacion.index")}
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
            <Head title="Create new origin denomination" />

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
                        id="origin-denomination-form"
                        ref={formRef}
                        onSubmit={handleSubmit}
                        className="flex w-full flex-col gap-12"
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
                                href={route("denominacion.index")}
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
