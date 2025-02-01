import { VinoSectionProps } from "@/types/vino";
import PreviewField from "@/Components/Forms/PreviewField";
import TextareaField from "@/Components/Forms/TextareaField";

/**
 * A component that renders the tasting notes section for a wine.
 * This section includes fields for description, food pairing, visual, aromas, and taste.
 *
 * @param {VinoSectionProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the tasting notes section.
 */
const TastingNotesSection = ({
    data, // Object containing the current state of the wine data
    onChange = () => {}, // Callback function to update the wine data
    errors = {}, // Object containing any validation errors
    disabled = false, // Boolean indicating whether the input fields should be disabled
    preview = false, // Boolean indicating whether the component should render in preview mode
}: VinoSectionProps) => {
    // If the component is in preview mode, render the preview fields
    if (preview) {
        return (
            <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Preview field for the description */}
                    <PreviewField
                        label="Description"
                        data={data.description?.toString()}
                    />

                    {/* Preview field for the food pairing */}
                    <PreviewField
                        label="Food pairing"
                        data={data.food_pairing?.toString()}
                    />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Preview field for the visual description */}
                    <PreviewField
                        label="Visual"
                        data={data.visual?.toString()}
                    />

                    {/* Preview field for the aromas */}
                    <PreviewField
                        label="Aromas"
                        data={data.aromas?.toString()}
                    />

                    {/* Preview field for the taste */}
                    <PreviewField label="Taste" data={data.taste?.toString()} />
                </div>
            </div>
        );
    }

    // If the component is in edit mode, render the textarea fields
    return (
        <div className="flex-1 flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Textarea field for the description */}
                <TextareaField
                    label="Description"
                    optional
                    value={data.description?.toString()}
                    onChange={(e) => onChange("description", e.target.value)}
                    required={false}
                    error={errors.description}
                    disabled={disabled}
                />

                {/* Textarea field for the food pairing */}
                <TextareaField
                    label="Food pairing"
                    optional
                    value={data.food_pairing?.toString()}
                    onChange={(e) => onChange("food_pairing", e.target.value)}
                    required={false}
                    error={errors.food_pairing}
                    disabled={disabled}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Textarea field for the visual description */}
                <TextareaField
                    label="Visual"
                    optional
                    value={data.visual?.toString()}
                    onChange={(e) => onChange("visual", e.target.value)}
                    required={false}
                    error={errors.visual}
                    disabled={disabled}
                />

                {/* Textarea field for the aromas */}
                <TextareaField
                    label="Aromas"
                    optional
                    value={data.aromas?.toString()}
                    onChange={(e) => onChange("aromas", e.target.value)}
                    required={false}
                    error={errors.aromas}
                    disabled={disabled}
                />

                {/* Textarea field for the taste */}
                <TextareaField
                    label="Taste"
                    optional
                    value={data.taste?.toString()}
                    onChange={(e) => onChange("taste", e.target.value)}
                    required={false}
                    error={errors.taste}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};

export default TastingNotesSection;
