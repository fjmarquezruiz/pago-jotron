import InputField from "@/Components/Forms/InputField";
import PreviewField from "@/Components/Forms/PreviewField";
import ToggleSwitch from "@/Components/Forms/ToogleSwitch";
import SelectField from "@/Components/Forms/SelectField";
import { BodegaSectionProps } from "@/types";
import { PROVINCES } from "../Data/data";

/**
 * A component that renders the basic information section for a bodega.
 * This section includes fields for the name, city, province, and blocked status of the bodega.
 *
 * @param {BodegaSectionProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the basic information section.
 */
function BasicInfoSection({
    data, // Object containing the current state of the bodega data
    onChange = () => {}, // Callback function to update the bodega data
    errors = {}, // Object containing any validation errors
    readonly = false, // Boolean indicating whether the input fields should be read-only
    disabled = false, // Boolean indicating whether the input fields should be disabled
    preview = false, // Boolean indicating whether the component should render in preview mode
}: BodegaSectionProps) {
    // If the component is in preview mode, render the preview fields
    if (preview) {
        return (
            <div className="flex flex-col gap-6">
                {/* Preview field for the bodega name */}
                <PreviewField label="Name" data={data.name} />

                {/* Grid layout for city, province, and blocked status */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-6">
                    {/* Preview field for city */}
                    <div className="md:col-span-3 xl:col-span-4">
                        <PreviewField label="City" data={data.city} />
                    </div>

                    {/* Preview field for province */}
                    <PreviewField label="Province" data={data.province} />

                    {/* Preview field for blocked status */}
                    {data?.blocked ? (
                        <PreviewField label="Blocked" data="Bodega blocked" />
                    ) : (
                        <></>
                    )}
                </div>
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
                placeholder="Wine"
                required
                error={errors.name}
                readonly={readonly}
                disabled={disabled}
            />

            {/* Grid layout for city, province, and blocked status */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-6">
                {/* Input field for city */}
                <div className="md:col-span-3 xl:col-span-4">
                    <InputField
                        label="City"
                        optional
                        value={data.city}
                        onChange={(e) => onChange("city", e.target.value)}
                        placeholder="City"
                        error={errors.city}
                        readonly={readonly}
                        disabled={disabled}
                    />
                </div>

                {/* Render the Province select field */}
                <SelectField
                    label="Province"
                    optional
                    options={PROVINCES}
                    value={data.province_id}
                    onChange={(e) => {
                        onChange("province_id", +e.target.value);
                        onChange(
                            "province",
                            e.target.options[e.target.selectedIndex].text
                        );
                    }}
                    disabled={disabled}
                    error={errors.province}
                />

                {/* Toggle switch for blocked status */}
                <ToggleSwitch
                    label="Blocked"
                    optional
                    isChecked={data.blocked ?? false}
                    message="Winery blocked"
                    onChange={(checked) => onChange("blocked", checked)}
                    error={errors.blocked}
                />
            </div>
        </div>
    );
}

export default BasicInfoSection;
