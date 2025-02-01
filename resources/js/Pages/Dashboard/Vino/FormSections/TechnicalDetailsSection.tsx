import { useEffect, useState } from "react";
import { VinoOption, VinoSectionProps } from "@/types/vino";
import SelectField from "@/Components/Forms/SelectField";
import InputField from "@/Components/Forms/InputField";
import InputLabel from "@/Components/InputLabel";
import PreviewField from "@/Components/Forms/PreviewField";

/**
 * A component that renders the technical details section for a wine.
 * This section includes fields for selecting the category, alcohol percentage, capacity, and serving temperature range.
 *
 * @param {VinoSectionProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the technical details section.
 */
const TechnicalDetailsSection = ({
    data, // Object containing the current state of the wine data
    onChange = () => {}, // Callback function to update the wine data
    errors = {}, // Object containing any validation errors
    disabled = false, // Boolean indicating whether the input fields should be disabled
    preview = false, // Boolean indicating whether the component should render in preview mode
}: VinoSectionProps) => {
    // If the component is in preview mode, render the preview fields
    if (preview) {
        return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {/* Preview field for the category name */}
                <PreviewField label="Category" data={data.categoria?.name} />

                {/* Preview field for the alcohol percentage */}
                <PreviewField
                    label="Alcohol (% Vol.)"
                    type="number"
                    data={data.alcohol?.toString()}
                />

                {/* Preview field for the capacity */}
                <PreviewField
                    label="Capacity (cl.)"
                    type="number"
                    data={data.capacity?.toString()}
                />

                {/* Preview field for the serving temperature range */}
                <PreviewField
                    label="Serving temperature (ºC)"
                    type="number"
                    data={`${data.minimum_temperature?.toString() ?? "00"} -
                            ${data.maximum_temperature?.toString() ?? "00"}`}
                />
            </div>
        );
    }

    // State variables to store the list of categories
    const [categorias, setCategorias] = useState<VinoOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch data for categories
                const categoriasResponse = await fetch("/api/categorias");

                // Check if the response is successful
                if (!categoriasResponse.ok) {
                    throw new Error(
                        `HTTP error! Status: ${categoriasResponse.status}`,
                    );
                }

                // Parse the JSON data from the response
                const categoriasData = await categoriasResponse.json();

                // Ensure categoriasData.data is an array
                if (!Array.isArray(categoriasData.data)) {
                    throw new Error("Categorias data is not an array");
                }

                // Update the state with the fetched data
                setCategorias(categoriasData.data);
            } catch (err) {
                // Handle any errors that occur during fetching
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
            } finally {
                // Set loading state to false after fetching is complete
                setLoading(false);
            }
        };

        // Call the fetchData function
        fetchData();
    }, []); // Empty dependency array ensures this effect runs only once on mount

    // If the data is still loading, render a loading message
    if (loading) {
        return <div>Loading...</div>;
    }

    // If there was an error fetching the data, render an error message
    if (error) {
        return <div>{error}</div>;
    }

    // If the data is successfully fetched, render the select and input fields
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Render the Category select field */}
            <SelectField
                label="Category"
                options={categorias}
                value={data.categoria_id?.toString()}
                onChange={(e) =>
                    onChange("categoria_id", parseFloat(e.target.value))
                }
                disabled={disabled}
                error={errors.categoria_id}
            />

            {/* Render the Alcohol (% Vol.) input field */}
            <InputField
                label="Alcohol (% Vol.)"
                optional
                value={data.alcohol ? data.alcohol?.toString() : ""}
                onChange={(e) =>
                    onChange("alcohol", parseFloat(e.target.value))
                }
                placeholder="00"
                disabled={disabled}
            />

            {/* Render the Capacity (cl.) input field */}
            <InputField
                label="Capacity (cl.)"
                optional
                value={data.capacity ? data.capacity?.toString() : ""}
                onChange={(e) =>
                    onChange("capacity", parseFloat(e.target.value))
                }
                placeholder="000"
                disabled={disabled}
            />

            {/* Render the Serving temperature (ºC) input fields */}
            <div className="flex flex-col gap-1.5">
                {/* Input label for the serving temperature range */}
                <InputLabel
                    htmlFor="serving-temperature"
                    className="flex items-center justify-between"
                >
                    Serving temperature (ºC)
                    <span className="text-gray-400">Optional</span>
                </InputLabel>

                {/* Container for minimum and maximum temperature inputs */}
                <div className="flex gap-6">
                    {/* Input field for minimum temperature */}
                    <input
                        type="text"
                        value={data.minimum_temperature?.toString() ?? ""}
                        onChange={(e) =>
                            onChange(
                                "minimum_temperature",
                                parseFloat(e.target.value),
                            )
                        }
                        className={`block w-full resize-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
                            error ? "border-red-500" : "" // Add red border if there's an error
                        } dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50`}
                        placeholder="00"
                        disabled={disabled}
                    />

                    {/* Input field for maximum temperature */}
                    <input
                        type="text"
                        value={data.maximum_temperature?.toString() ?? ""}
                        onChange={(e) =>
                            onChange(
                                "maximum_temperature",
                                parseFloat(e.target.value),
                            )
                        }
                        className={`block w-full resize-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
                            error ? "border-red-500" : "" // Add red border if there's an error
                        } dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50`}
                        placeholder="00"
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};

export default TechnicalDetailsSection;
