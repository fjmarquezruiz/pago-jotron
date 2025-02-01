import InputField from "@/Components/Forms/InputField";
import PreviewField from "@/Components/Forms/PreviewField";
import { GenericSectionProps, User } from "@/types";
import { getMaxDate } from "@/utils";

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
}: GenericSectionProps<User>) {
    // If the component is in preview mode, render the preview fields
    if (preview) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <PreviewField label="Name" data={data.name} />
                    <PreviewField label="Last Name" data={data.last_name} />
                </div>
                <PreviewField label="Email" data={data.email} />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-6">
                    <PreviewField
                        label="Date of birth"
                        data={data.date_of_birth}
                    />
                    <PreviewField label="ID Card" data={data.id_card} />
                    <PreviewField
                        label="Phone number"
                        data={data.phone_number}
                    />
                </div>
            </div>
        );
    }

    // If the component is in edit mode, render the input fields
    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <InputField
                    label="Name"
                    value={data.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    placeholder="Name"
                    required
                    error={errors.name}
                    readonly={readonly}
                    disabled={disabled}
                />

                <InputField
                    label="Last name"
                    value={data.last_name}
                    onChange={(e) => onChange("last_name", e.target.value)}
                    placeholder="Last name"
                    required
                    error={errors.last_name}
                    readonly={readonly}
                    disabled={disabled}
                />
            </div>

            <InputField
                label="Email"
                value={data.email}
                type="email"
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="Email"
                required
                error={errors.email}
                readonly={readonly}
                disabled={disabled}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-6">
                <InputField
                    label="Date of birth"
                    value={data.date_of_birth}
                    type="date"
                    onChange={(e) => onChange("date_of_birth", e.target.value)}
                    placeholder="DD-MM-YYYY"
                    required
                    error={errors.email}
                    readonly={readonly}
                    disabled={disabled}
                    max={getMaxDate()}
                />
                <InputField
                    label="ID Card"
                    value={data.id_card ? data.id_card : ""}
                    type="text"
                    onChange={(e) => onChange("id_card", e.target.value)}
                    placeholder="ID Card"
                    required
                    error={errors.id_card}
                    readonly={readonly}
                    disabled={disabled}
                />
                <InputField
                    label="Phone number"
                    value={data.phone_number ? data.phone_number : ""}
                    type="text"
                    onChange={(e) => onChange("phone_number", e.target.value)}
                    placeholder="Phone number"
                    required
                    error={errors.phone_number}
                    readonly={readonly}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

export default BasicInfoSection;
