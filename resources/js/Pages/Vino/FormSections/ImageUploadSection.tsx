import { ChangeEventHandler } from "react";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PreviewField from "@/Components/Forms/PreviewField";
import { IconTrash } from "@tabler/icons-react";
import { dangerButton } from "@/styles";

// Interface for the component props
interface ImageUploadSectionProps {
    data: {
        image_url?: string | "";
        image?: File | undefined;
    };
    onChange?: (file: File | null) => void;
    errors?: { [key: string]: string };
    preview?: boolean;
}

/**
 * A component that handles image upload and preview.
 * This section includes an input field for uploading images and a preview of the uploaded image.
 *
 * @param {ImageUploadSectionProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the image upload section.
 */
// const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
const ImageUploadSection = ({
    data, // Object containing the current state of the image data
    onChange = () => {}, // Callback function to update the wine data
    errors = {}, // Object containing any validation errors
    preview = false, // Boolean indicating whether the component should render in preview mod
}: ImageUploadSectionProps) => {
    const LABEL = "Wine image"; // Label for the image input field

    /**
     * Handles the change event for the file input.
     * Updates the image data with the selected file.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event - The change event object.
     */
    const handleImageChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const file = event.target.files?.[0];
        onChange(file || null);
    };

    /**
     * Handles the reset of the image.
     * Clears the image data.
     */
    const handleResetImage = () => {
        onChange(null);
    };

    // Determine the URL to display the image
    const imageUrl = data.image
        ? URL.createObjectURL(data.image)
        : data.image_url;

    /**
     * Retrieves the error message for the image field.
     *
     * @returns {string | undefined} The error message if it exists, otherwise undefined.
     */
    const getImageError = (): string | undefined => {
        return errors.image;
    };

    /**
     * Determines the class names for the file input based on errors.
     *
     * @returns {string} The class names for the file input.
     */
    const getInputClassNames = (): string => {
        const baseClasses =
            "block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50";
        const errorClass = getImageError() ? "border-red-500" : "";
        return `${baseClasses} ${errorClass}`;
    };

    if (preview && !imageUrl) {
        return <PreviewField label={LABEL} type={"string"} />;
    }

    return (
        <div className="flex flex-col items-start gap-6">
            <div className="flex w-full flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    {/* Render the InputLabel component with htmlFor and value props */}
                    <InputLabel
                        htmlFor={LABEL.toLowerCase().replace(/\s+/g, "-")} // Convert label to lowercase and replace spaces with hyphens for htmlFor attribute
                        value={LABEL} // Pass the label text as value prop
                    />
                    {!preview && (
                        <span className="text-sm text-gray-400">Opcional</span>
                    )}
                </div>

                {imageUrl ? (
                    <div className="relative w-full">
                        <picture>
                            <img
                                src={imageUrl}
                                alt="Preview"
                                className="sm:max-w-auto h-auto max-w-full rounded-lg object-cover sm:max-h-60"
                                loading="lazy"
                            />
                        </picture>

                        {!preview && (
                            <button
                                type="button"
                                onClick={handleResetImage}
                                className={`${dangerButton} mt-6 w-full md:absolute md:right-0 md:top-2 md:mt-0 md:w-auto`}
                                aria-label="Remove image"
                                title="Remove image"
                            >
                                <IconTrash stroke={1.5} className="size-4" />{" "}
                                Remove
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={getInputClassNames()}
                            aria-label="Upload wine image"
                        />

                        {/* Render the InputError component with the error message */}
                        {getImageError() && (
                            <InputError
                                message={getImageError()}
                                className="mt-2"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploadSection;
