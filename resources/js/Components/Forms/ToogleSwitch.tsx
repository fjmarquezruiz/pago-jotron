import React from "react";
import InputError from "@/Components/InputError"; // Custom component for rendering input errors
import InputLabel from "@/Components/InputLabel"; // Custom component for rendering input labels

// Interface defining the props for the ToggleSwitch component
interface ToggleSwitchProps {
    label: string; // The label text for the input field
    optional?: boolean; // Indicates if the field is optional
    isChecked: boolean; // The current checked state of the toggle switch
    message?: string; // Optional message to display when the toggle is checked
    onChange?: (checked: boolean) => void; // Callback function to handle changes to the toggle switch
    required?: boolean; // Optional boolean to indicate if the input field is required
    readonly?: boolean; // Optional boolean to indicate if the input field is read-only
    disabled?: boolean; // Optional boolean to indicate if the input field is disabled
    error?: string; // Optional error message to display below the input field
    className?: string; // Optional additional class names for customization
}

/**
 * ToggleSwitch component to display a toggle switch with a label and optional error message.
 *
 * @param {ToggleSwitchProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - The rendered ToggleSwitch component.
 */
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    label, // The label text for the input field
    optional = false, // Indicates if the field is optional (default: false)
    isChecked = false, // The current checked state of the toggle switch (default: false)
    message = "", // Optional message to display when the toggle is checked
    onChange = () => {}, // Callback function to handle changes to the toggle switch
    required = false, // Optional boolean to indicate if the input field is required (default: false)
    readonly = false, // Optional boolean to indicate if the input field is read-only (default: false)
    disabled = false, // Optional boolean to indicate if the input field is disabled (default: false)
    error = "", // Optional error message to display below the input field (default: "")
    className = "", // Optional additional class names for customization
}: ToggleSwitchProps) => {
    // Generate the htmlFor attribute for the label
    const htmlFor = label.toLowerCase().replace(/\s+/g, "-");

    // Construct the className for the toggle switch container
    const toggleContainerClassName = `flex items-center cursor-pointer min-h-[42px] ${className}`;

    // Construct the className for the toggle switch track
    const toggleTrackClassName = `relative w-14 h-8 rounded-full outline outline-offset-0 outline-1 transition duration-200 ease-in-out ${
        isChecked
            ? "bg-blue-500 dark:bg-blue-400 outline-blue-500 dark:outline-blue-400"
            : "bg-gray-300 dark:bg-gray-800 outline-gray-300 dark:outline-gray-700"
    }`;

    // Construct the className for the toggle switch thumb
    const toggleThumbClassName = `absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition duration-200 ease-in-out transform ${
        isChecked ? "translate-x-full" : ""
    }`;

    /**
     * Handler for toggle changes.
     * Updates the checked state and calls the onChange callback with the new checked value.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the checkbox input.
     */
    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        onChange(checked);
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                {/* Render the InputLabel component with htmlFor and value props */}
                <InputLabel htmlFor={htmlFor} value={label} />
                {optional && (
                    <span className="text-sm text-gray-400">Optional</span>
                )}
            </div>

            <label className={toggleContainerClassName}>
                <div className="flex items-center gap-3">
                    <div className={toggleTrackClassName}>
                        <input
                            type="checkbox"
                            id={htmlFor}
                            checked={isChecked}
                            onChange={handleToggle}
                            className="sr-only" // Hide the default checkbox
                            required={required}
                            readOnly={readonly}
                            disabled={disabled}
                            aria-checked={isChecked} // ARIA attribute for accessibility
                            aria-label={label} // ARIA attribute for accessibility
                        />
                        <div className={toggleThumbClassName}></div>
                    </div>
                    {isChecked && message && (
                        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {message}
                        </p>
                    )}
                </div>

                {/* Render the InputError component with the error message */}
                <InputError message={error} className="mt-2" />
            </label>
        </div>
    );
};

export default ToggleSwitch;
