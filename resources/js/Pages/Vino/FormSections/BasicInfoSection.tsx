import { VinoSectionProps } from "@/types/vino";
import { getCurrentYear } from "../utils";
import InputField from "@/Components/Forms/InputField";
import ToggleSwitch from "@/Components/Forms/ToogleSwitch";
import PreviewField from "@/Components/Forms/PreviewField";

/**
 * A component that renders the basic information section for a wine.
 * This section includes fields for the name, stock, price, and vintage year of the wine.
 *
 * @param {VinoSectionProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the basic information section.
 */
function BasicInfoSection({
    data, // Object containing the current state of the wine data
    onChange = () => {}, // Callback function to update the wine data
    errors = {}, // Object containing any validation errors
    readonly = false, // Boolean indicating whether the input fields should be read-only
    disabled = false, // Boolean indicating whether the input fields should be disabled
    preview = false, // Boolean indicating whether the component should render in preview mode
}: VinoSectionProps) {
    // If the component is in preview mode, render the preview fields
    if (preview) {
        return (
            <div className="flex flex-col gap-6">
                {/* Preview field for the wine name */}
                <PreviewField label="Wine" data={data.name} />

                {/* Grid layout for stock, price, and vintage year */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-6">
                    {/* Preview field for stock */}
                    <PreviewField
                        label="Stock"
                        type="number"
                        data={data.stock.toString()}
                    />

                    {/* Preview field for price */}
                    <PreviewField
                        label="Price (€ - IVA incl.)"
                        type="number"
                        data={data.price.toString()}
                    />

                    {/* Preview field for vintage year */}
                    <PreviewField
                        label="Vintage year"
                        type="number"
                        data={data.vintage_year?.toString()}
                    />

                    {/* Preview field for blocked */}
                    {data?.blocked ? (
                        <PreviewField
                            label="Blocked"
                            type="text"
                            data="Wine blocked"
                        />
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

            {/* Grid layout for stock, price, and vintage year */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-6">
                {/* Input field for stock */}
                <InputField
                    label="Stock"
                    value={data.stock}
                    onChange={(e) =>
                        onChange("stock", parseInt(e.target.value))
                    }
                    placeholder="000"
                    type="number"
                    required
                    error={errors.stock}
                    readonly={readonly}
                    disabled={disabled}
                />

                {/* Input field for price */}
                <InputField
                    label="Price (€ - IVA incl.)"
                    value={data.price}
                    onChange={(e) =>
                        onChange("price", parseFloat(e.target.value))
                    }
                    placeholder="000.00"
                    type="number"
                    step="0.01"
                    required
                    error={errors.price}
                    readonly={readonly}
                    disabled={disabled}
                />

                {/* Input field for vintage year */}
                <InputField
                    label="Vintage year"
                    optional
                    value={data.vintage_year ?? getCurrentYear()}
                    onChange={(e) => onChange("vintage_year", e.target.value)}
                    placeholder={getCurrentYear().toString()}
                    type="number"
                    error={errors.vintage_year}
                    readonly={readonly}
                    disabled={disabled}
                />

                {/* Toggle switch for blocked status */}
                <ToggleSwitch
                    label="Blocked"
                    optional
                    isChecked={data.blocked ?? false}
                    message="Wine blocked"
                    onChange={(checked) => onChange("blocked", checked)}
                    error={errors.blocked}
                />
            </div>
        </div>
    );
}

export default BasicInfoSection;
