import InputLabel from "@/Components/InputLabel"; // Custom component for rendering input labels
import InputError from "@/Components/InputError"; // Custom component for rendering input errors

// Define the interface for the props that the InputField component will accept
interface InputFieldProps {
    label: string; // The label text for the input field
    optional?: boolean; // Indicates if the field is optional
    value: string | number; // The current value of the input field
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Event handler for changes to the input field
    placeholder?: string; // Optional placeholder text for the input field
    type?: string; // Optional type attribute for the input field (e.g., 'text', 'email', 'number')
    required?: boolean; // Optional boolean to indicate if the input field is required
    readonly?: boolean; // Optional boolean to indicate if the input field is read-only
    disabled?: boolean; // Optional boolean to indicate if the input field is disabled
    step?: string; // Optional step attribute for numeric inputs
    error?: string; // Optional error message to display below the input field
    max?: string | number; // Optional max attribute for numeric inputs or string length
    pattern?: string; // Optional pattern attribute for input validation
}

/**
 * A reusable input field component.
 * This component renders an input field along with a label and an optional error message.
 *
 * @param {InputFieldProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the input field component.
 */
const InputField: React.FC<InputFieldProps> = ({
    label, // The label text for the input field
    optional = false, // Indicates if the field is optional (default: false)
    value, // The current value of the input field
    onChange, // Event handler for changes to the input field
    placeholder = "", // Optional placeholder text for the input field (default: "")
    type = "text", // Optional type attribute for the input field (default: "text")
    required = false, // Optional boolean to indicate if the input field is required (default: false)
    readonly = false, // Optional boolean to indicate if the input field is read-only (default: false)
    disabled = false, // Optional boolean to indicate if the input field is disabled (default: false)
    step = "any", // Optional step attribute for numeric inputs (default: "any")
    error = "", // Optional error message to display below the input field (default: "")
    max, // Optional max attribute for numeric inputs or string length
    pattern, // Optional pattern attribute for input validation
    ...props
}) => {
    // Generate the htmlFor attribute for the label
    const htmlFor = label.toLowerCase().replace(/\s+/g, "-");

    // Construct the className for the input field
    const inputClassName = `block w-full rounded-md border px-3 py-2 resize-none shadow-sm border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
        error ? "border-red-500" : "" // Add red border if there's an error
    } dark:text-gray-50 dark:bg-gray-800 dark:border-gray-700`;

    // Construct the input attributes dynamically
    const inputAttributes: React.InputHTMLAttributes<HTMLInputElement> = {
        id: htmlFor,
        type,
        value: value.toString(),
        onChange,
        placeholder,
        className: inputClassName,
        required,
        disabled,
        step,
        readOnly: readonly,
        ...props, // Spread additional attributes
    };

    // Conditionally add max attribute
    if (max !== undefined) {
        inputAttributes.max = max.toString();
    }

    // Conditionally add pattern attribute
    if (pattern !== undefined) {
        inputAttributes.pattern = pattern;
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                {/* Render the InputLabel component with htmlFor and value props */}
                <InputLabel htmlFor={htmlFor} value={label} />
                {optional && (
                    <span className="text-sm text-gray-400">Optional</span>
                )}
            </div>

            <input {...inputAttributes} />

            {/* Render the InputError component with the error message */}
            <InputError message={error} />
        </div>
    );
};

// Export the InputField component as the default export
export default InputField;
