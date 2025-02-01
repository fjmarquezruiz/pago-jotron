import DividerFields from "@/Components/Forms/DividerFields";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { secondaryButton } from "@/styles";
import { Bodega } from "@/types";
import { Transition } from "@headlessui/react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler, useRef } from "react";
import { PROVINCES } from "./Data/data";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import RegionsSection from "./FormSections/RegionsSection";

/**
 * A component that renders the edit form for a bodega.
 * This component includes sections for basic information, details, technical details, image upload, and tasting notes.
 *
 * @param {Object} props - The props object containing the bodega data.
 * @param {Bodega} props.bodega - The bodega data to be edited.
 * @returns {JSX.Element} - A JSX element representing the edit form.
 */
const Edit = ({ bodega }: { bodega: Bodega }) => {
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
    } = useForm<Bodega>({
        id: bodega?.id || 0,
        name: bodega?.name || "",
        city: bodega?.city || "",
        province_id:
            PROVINCES.find((province) => province.name === bodega?.province)
                ?.id || 0,
        province: bodega?.province || "",
        blocked: bodega?.blocked || false,
        denominaciones: bodega?.denominaciones || [],
        created_at: bodega?.created_at || new Date().toISOString(),
    });

    // Create a ref for the form element
    const formRef = useRef<HTMLFormElement>(null);

    /**
     * Handles the form submission for editing the bodega.
     *
     * @param {React.FormEvent<HTMLFormElement>} ev - The form submission event.
     */
    const handleSubmit: FormEventHandler<HTMLFormElement> = (ev) => {
        ev.preventDefault();

        // Submit the form data using the post method from Inertia.js
        put(route("bodega.update", bodega.id), {
            preserveScroll: true,
            onSuccess: () => {
                console.log("Winery updated successfully");
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
     * @param {keyof Bodega} field - The field name.
     * @param {any} value - The new value for the field.
     */
    const handleFieldChange = (field: keyof Bodega, value: any) => {
        setData(field as keyof Bodega, value);
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
                        Edit winery <b>{bodega.name}</b>
                    </h2>
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            href={route("bodega.index")}
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
            <Head title={`Edit winery ${bodega.name}`} />

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
                        id="winery-form"
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

                        {/* Regions Section */}
                        <RegionsSection
                            data={data}
                            onChange={handleFieldChange}
                            errors={errors}
                        />
                        <DividerFields />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("bodega.index")}
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
