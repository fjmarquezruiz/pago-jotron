import InputError from "@/Components/InputError"; // Custom component for rendering input errors
import InputLabel from "@/Components/InputLabel"; // Custom component for rendering input labels

// Define the interface for the props that the TextareaField component will accept
interface TextareaFieldProps
    extends Omit<
        React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        "id" | "value" | "required" | "disabled" | "readOnly"
    > {
    label: string; // The label text for the textarea field
    optional?: boolean; // Optional boolean to indicate if the textarea field is optional
    value?: string; // The current value of the textarea field
    required?: boolean; // Optional boolean to indicate if the textarea field is required
    readonly?: boolean; // Optional boolean to indicate if the textarea field is read-only
    disabled?: boolean; // Optional boolean to indicate if the textarea field is disabled
    error?: string; // Optional error message to display below the textarea field
    className?: string; // Optional additional class names for customization
}

/**
 * A reusable textarea field component.
 * This component renders a textarea field along with a label and an optional error message.
 *
 * @param {TextareaFieldProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the textarea field component.
 */
const TextareaField = ({
    label, // The label text for the textarea field
    optional = false, // Indicates if the field is optional (default: false)
    value = "", // The current value of the textarea field (default: empty string)
    required = false, // Optional boolean to indicate if the textarea field is required (default: false)
    readonly = false, // Optional boolean to indicate if the textarea field is read-only (default: false)
    disabled = false, // Optional boolean to indicate if the textarea field is disabled (default: false)
    error = "", // Optional error message to display below the textarea field (default: empty string)
    className = "", // Optional additional class names for customization
    ...props // Spread remaining props to pass to the textarea element
}: TextareaFieldProps) => {
    // Generate the htmlFor attribute for the label
    const htmlFor = label.toLowerCase().replace(/\s+/g, "-");

    // Construct the className for the textarea field
    const textareaClassName = `h-32 w-full rounded-md border px-3 py-2 resize-none shadow-sm border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
        error ? "border-red-500" : "" // Add red border if there's an error
    } dark:text-gray-50 dark:bg-gray-800 dark:border-gray-700 ${className}`;

    // Construct the input attributes dynamically
    const textareaAttributes: React.TextareaHTMLAttributes<HTMLTextAreaElement> =
        {
            id: htmlFor,
            value: value.toString(),
            className: textareaClassName,
            required,
            disabled,
            readOnly: readonly,
            ...props, // Spread additional attributes
        };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                {/* Render the InputLabel component with htmlFor and value props */}
                <InputLabel htmlFor={htmlFor} value={label} />
                {optional && (
                    <span className="text-sm text-gray-400">Opcional</span>
                )}
            </div>

            <textarea {...textareaAttributes} />

            {/* Render the InputError component with the error message */}
            <InputError message={error} />
        </div>
    );
};

export default TextareaField;
