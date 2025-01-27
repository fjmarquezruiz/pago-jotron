import React from "react";
import InputError from "@/Components/InputError"; // Custom component for rendering input errors
import InputLabel from "@/Components/InputLabel"; // Custom component for rendering input labels

// Define the interface for an option in the select field
interface Option {
    id: number; // Unique identifier for the option
    name: string; // Display name for the option
}

// Define the interface for the props that the SelectField component will accept
interface SelectFieldProps
    extends Omit<
        React.SelectHTMLAttributes<HTMLSelectElement>,
        "id" | "value"
    > {
    label: string; // The label text for the select field
    options: Option[]; // Array of options to display in the select field
    optional?: boolean; // Optional boolean to indicate if the select field is optional
    placeholder?: string; // Optional placeholder text for the select field
    disabled?: boolean; // Optional boolean to indicate if the select field is disabled
    error?: string; // Optional error message to display below the select field
    value?: string | number; // Optional value for controlled components
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void; // Optional change handler for controlled components
}

/**
 * A reusable select field component.
 * This component renders a select field along with a label and an optional error message.
 *
 * @param {SelectFieldProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the select field component.
 */
const SelectField = ({
    label, // The label text for the select field
    options = [], // Default to an empty array if no options are provided
    optional = false, // Indicates if the field is optional (default: false)
    placeholder, // Optional placeholder text for the select field
    disabled = false, // Default to not disabled if not specified
    error = "", // Default to no error message if not specified
    value, // Optional value for controlled components
    onChange, // Optional change handler for controlled components
    ...props // Spread remaining props to pass to the select element
}: SelectFieldProps) => {
    // Determine if the options array is valid
    const isValidOptionsArray = Array.isArray(options);

    // Generate the htmlFor attribute for the label
    const htmlFor = label.toLowerCase().replace(/\s+/g, "-");

    // Construct the className for the select field
    const selectClassName = `block w-full rounded-md border px-3 py-2 shadow-sm border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
        error ? "border-red-500" : "" // Add red border if there's an error
    } dark:text-gray-50 dark:bg-gray-800 dark:border-gray-700`;

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                {/* Render the InputLabel component with htmlFor and value props */}
                <InputLabel htmlFor={htmlFor} value={label} />
                {optional && (
                    <span className="text-sm text-gray-400">Optional</span>
                )}
            </div>

            <select
                id={htmlFor} // Set the id attribute to match htmlFor in InputLabel
                className={selectClassName}
                aria-label={label} // Set the aria-label for accessibility
                disabled={!isValidOptionsArray || disabled} // Disable the select field if options are invalid or disabled prop is true
                value={value} // Set the value for controlled components
                onChange={onChange} // Set the change handler for controlled components
                {...props} // Spread remaining props to pass to the select element
            >
                {!isValidOptionsArray ? (
                    <option value="">Error: Invalid options</option>
                ) : (
                    <>
                        <option value="">
                            {placeholder || `Elige ${label.toLowerCase()}`}
                        </option>
                        {options.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </>
                )}
            </select>

            {/* Render the InputError component with the error message */}
            <InputError message={error} className="mt-2" />
        </div>
    );
};

export default SelectField;
