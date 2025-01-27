// Define the interface for the props that the PreviewField component will accept
export interface PreviewFieldProps {
    label: string; // The label text for the preview field
    type?: string | number; // Optional type of the data (default: "string")
    data?: string | number; // The data to be displayed in the preview field
    className?: string; // Optional additional class names for customization
}

/**
 * A reusable preview field component.
 * This component renders a label and the corresponding data in a preview format.
 *
 * @param {PreviewFieldProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the preview field component.
 */
const PreviewField = ({
    label,
    type = "string",
    data,
    className = "",
}: PreviewFieldProps) => {
    // Determine the default message based on the type
    const defaultData = type === "string" ? "No data available" : "00";

    // Combine default classes with any additional classes passed via props
    const combinedClasses = `mt-1.5 block w-full text-lg font-semibold ${className}`;

    const ariaLabel = `${label.toLowerCase().replace(/\s+/g, "-")}-label`;

    return (
        <div className="flex flex-col gap-1.5">
            {/* Render the label for the preview field */}
            <p
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                id={ariaLabel}
            >
                {label}
            </p>

            {/* Render the data or a default message if no data is available */}
            <p className={combinedClasses} aria-labelledby={ariaLabel}>
                {data !== undefined ? data : defaultData}
            </p>
        </div>
    );
};

export default PreviewField;
