import { ChangeEventHandler } from "react";
import InputLabel from "@/Components/InputLabel";
import Radio from "@/Components/Radio";
import { User } from "@/types";

export interface PermissionSectionProps<T> {
    data: T; // Use a generic type T
    roles: any;
    roleLabels: Record<string, string>;
    onChange?: (field: keyof T, value: any) => void;
    errors?: Record<string, string>;
    readonly?: boolean;
    disabled?: boolean;
    preview?: boolean;
}

/**
 * A component that renders the basic information section for a wine.
 * This section includes fields for the name, stock, price, and vintage year of the wine.
 *
 * @param {VinoSectionProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the basic information section.
 */
function PermissionsSection({
    data, // Object containing the current state of the wine data
    roles,
    roleLabels,
    onChange = () => {}, // Callback function to update the wine data
    errors = {}, // Object containing any validation errors
    readonly = false, // Boolean indicating whether the input fields should be read-only
    disabled = false, // Boolean indicating whether the input fields should be disabled
    preview = false, // Boolean indicating whether the component should render in preview mode
}: PermissionSectionProps<User>) {
    const LABEL = "Roles";

    // If the component is in preview mode, render the preview fields
    if (preview) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                    {/* Render the label for the preview field */}
                    <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {LABEL}
                    </p>

                    <div className="mt-1.5 flex gap-6">
                        {roles.map((role: any) => (
                            <label
                                key={role.id}
                                className="inline-flex items-center"
                            >
                                <Radio
                                    name="roles"
                                    value={role.name}
                                    checked={data.roles.includes(role.name)}
                                    disabled
                                />
                                <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                                    {roleLabels[role.name]}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const handleRolChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        if (event.target.checked) {
            onChange("roles", [event.target.value]);
        }
    };

    // If the component is in edit mode, render the input fields
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    {/* Render the InputLabel component with htmlFor and value props */}
                    <InputLabel
                        htmlFor={LABEL.toLowerCase().replace(/\s+/g, "-")} // Convert label to lowercase and replace spaces with hyphens for htmlFor attribute
                        value={LABEL} // Pass the label text as value prop
                    />
                </div>
                <div className="flex gap-6">
                    {roles.map((role: any) => (
                        <label
                            key={role.id}
                            className="inline-flex items-center"
                        >
                            <Radio
                                name="roles"
                                value={role.name}
                                checked={data.roles.includes(role.name)}
                                onChange={handleRolChange}
                            />
                            <span className="ms-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {roleLabels[role.name]}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PermissionsSection;
