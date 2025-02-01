import DividerFields from "@/Components/Forms/DividerFields";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { secondaryButton } from "@/styles";
import { Vino } from "@/types/vino";
import { Transition } from "@headlessui/react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler, useEffect, useRef, useState } from "react";
import { getCurrentYear } from "../../../utils";
import BasicInfoSection from "./FormSections/BasicInfoSection";
import DetailsSection from "./FormSections/DetailsSection";
import GrapesSection from "./FormSections/GrapesSection";
import ImageUploadSection from "./FormSections/ImageUploadSection";
import TastingNotesSection from "./FormSections/TastingNotesSection";
import TechnicalDetailsSection from "./FormSections/TechnicalDetailsSection";

/**
 * A component that renders the edit form for a wine.
 * This component includes sections for basic information, details, technical details, image upload, and tasting notes.
 *
 * @param {Object} props - The props object containing the wine data.
 * @param {Vino} props.vino - The wine data to be edited.
 * @returns {JSX.Element} - A JSX element representing the edit form.
 */
const Edit = ({ vino }: { vino: Vino }) => {
    // Access flash messages from the page props
    const { props } = usePage();

    // Initialize form data using useForm hook from Inertia.js
    const {
        data,
        setData,
        processing,
        errors,
        post,
        reset,
        recentlySuccessful,
    } = useForm<Vino>({
        id: vino?.id || 0,
        name: vino?.name || "",
        price: vino?.price || 10,
        stock: vino?.stock || 30,
        vintage_year: vino?.vintage_year ?? getCurrentYear(),
        image_url: vino?.image_url || "",
        image: vino?.image || undefined,
        description: vino?.description || "",
        visual: vino?.visual || "",
        aromas: vino?.aromas || "",
        taste: vino?.taste || "",
        capacity: vino?.capacity || 750,
        minimum_temperature: vino?.minimum_temperature || 8,
        maximum_temperature: vino?.maximum_temperature || 12,
        alcohol: vino?.alcohol || 0,
        food_pairing: vino?.food_pairing || "",
        blocked: vino?.blocked || false,
        bodega_id: vino?.bodega_id || 1,
        denominacion_id: vino?.denominacion_id || 6,
        categoria_id: vino?.categoria_id || 1,
        bodega: vino?.bodega || undefined,
        denominacion: vino?.denominacion || undefined,
        categoria: vino?.categoria || undefined,
        uvas: vino?.uvas || [],
        created_at: vino.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    // State to store the uploaded image file
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Create a ref for the form element
    const formRef = useRef<HTMLFormElement>(null);

    // Effect to reset imageFile if image_url is present
    useEffect(() => {
        if (vino.image_url) {
            setImageFile(null); // Reset imageFile if image_url is present
        }
    }, [vino.image_url]);

    useEffect(() => {
        setData("uvas", data.uvas);
    }, [data.uvas]);

    /**
     * Handles the form submission for editing the wine.
     *
     * @param {React.FormEvent<HTMLFormElement>} ev - The form submission event.
     */
    const handleSubmit: FormEventHandler<HTMLFormElement> = (ev) => {
        ev.preventDefault();

        // Create a FormData object to send the form data
        const formDataToSend = new FormData();

        // Append all form data except image_url
        Object.keys(data).forEach((key) => {
            if (key !== "image_url") {
                formDataToSend.append(key, data[key as keyof Vino] as any);
            }
        });

        // Append image_url explicitly
        if (data.image_url) {
            formDataToSend.append("image_url", data.image_url);
        }

        // Append the image file if it exists
        if (imageFile) {
            formDataToSend.append("image", imageFile);
        }

        // Submit the form data using the post method from Inertia.js
        post(route("vino.update", vino.id), {
            data: formDataToSend,
            preserveScroll: true,
            onSuccess: () => {
                console.log("Wine updated successfully");
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
     * @param {keyof Vino} field - The field name.
     * @param {any} value - The new value for the field.
     */
    const handleFieldChange = (field: keyof Vino, value: any) => {
        setData(field as keyof Vino, value);
    };

    /**
     * Handles changes to the image file.
     *
     * @param {File | null} file - The new image file or null.
     */
    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        if (file) {
            setData("image_url", URL.createObjectURL(file)); // Temporary URL for preview
            setData("image", file); // Store the file in the form data
        } else {
            setData("image_url", ""); // Reset to original image_url if no file is selected
            setData("image", undefined); // Remove the file from the form data
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

    return (
        <AuthenticatedLayout
            header={
                <>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Edit wine <b>{vino.name}</b>
                    </h2>
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            href={route("vino.index")}
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
            <Head title={`Edit wine ${vino.name}`} />

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
                        id="wine-form"
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

                        {/* Details and Technical Details Sections */}
                        <div className="flex flex-1 flex-col gap-6">
                            <DetailsSection
                                data={data}
                                onChange={handleFieldChange}
                                errors={errors}
                            />
                            <TechnicalDetailsSection
                                data={data}
                                onChange={handleFieldChange}
                                errors={errors}
                            />
                        </div>
                        <DividerFields />

                        {/* Grapes Sections */}
                        <GrapesSection
                            data={data}
                            onChange={handleFieldChange}
                            errors={errors}
                        />
                        <DividerFields />

                        {/* Image Upload Section */}
                        <ImageUploadSection
                            data={{
                                image_url: data.image_url,
                                image: data.image,
                            }}
                            onChange={handleImageChange}
                            errors={errors}
                        />
                        <DividerFields />

                        {/* Tasting Notes Section */}
                        <TastingNotesSection
                            data={data}
                            onChange={handleFieldChange}
                            errors={errors}
                        />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("vino.index")}
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
