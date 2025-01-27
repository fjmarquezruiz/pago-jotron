import InputField from "@/Components/Forms/InputField";
import PreviewField from "@/Components/Forms/PreviewField";
import ToggleSwitch from "@/Components/Forms/ToogleSwitch";
import { Denominacion, GenericSectionProps, UvaSectionProps } from "@/types";

/**
 * A component that renders the basic information section for a uva.
 * This section includes fields for the name, city, province, and blocked status of the uva.
 *
 * @param {GenericSectionProps<Denominacion>} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the basic information section.
 */
function BasicInfoSection({
    data, // Object containing the current state of the uva data
    onChange = () => {}, // Callback function to update the uva data
    errors = {}, // Object containing any validation errors
    readonly = false, // Boolean indicating whether the input fields should be read-only
    disabled = false, // Boolean indicating whether the input fields should be disabled
    preview = false, // Boolean indicating whether the component should render in preview mode
}: GenericSectionProps<Denominacion>) {
    // If the component is in preview mode, render the preview fields
    if (preview) {
        return (
            <div className="flex flex-col gap-6">
                {/* Preview field for the uva name */}
                <PreviewField label="Name" data={data.name} />

                {/* Preview field for blocked status */}
                {data?.blocked ? (
                    <PreviewField
                        label="Blocked"
                        data="Origin denomination blocked"
                    />
                ) : (
                    <></>
                )}
            </div>
        );
    }

    // If the component is in edit mode, render the input fields
    return (
        <div className="flex flex-col gap-6">
            {/* Input field for the wine name */}
            <InputField
                label="Name"
                value={data.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Origin denomination name"
                required
                error={errors.name}
                readonly={readonly}
                disabled={disabled}
            />

            {/* Toggle switch for blocked status */}
            <ToggleSwitch
                label="Blocked"
                optional
                isChecked={data.blocked ?? false}
                message="Origin denomination blocked"
                onChange={(checked) => onChange("blocked", checked)}
                error={errors.blocked}
            />
        </div>
    );
}

export default BasicInfoSection;
