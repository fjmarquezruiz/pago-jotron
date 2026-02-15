import { useEffect, useState } from "react";
import { VinoOption, VinoSectionProps } from "@/types/vino";
import SelectField from "@/Components/Forms/SelectField";
import PreviewField from "@/Components/Forms/PreviewField";
import { Link } from "@inertiajs/react";

/**
 * A component that renders the details section for a wine.
 * This section includes fields for selecting the bodega and denominación de origen.
 *
 * @param {VinoSectionProps} props - The props object containing all necessary properties.
 * @returns {JSX.Element} - A JSX element representing the details section.
 */
const DetailsSection = ({
    data, // Object containing the current state of the wine data
    onChange = () => { }, // Callback function to update the wine data
    errors = {}, // Object containing any validation errors
    disabled = false, // Boolean indicating whether the input fields should be disabled
    preview = false, // Boolean indicating whether the component should render in preview mode
}: VinoSectionProps) => {
    // If the component is in preview mode, render the preview fields
    if (preview) {
        return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Preview field for the winery name */}
                <PreviewField
                    label="Winery"
                    data={
                        data.bodega ? (
                            <Link
                                href={route("bodega.show", data.bodega.id)}
                                className="text-amber-700 hover:underline dark:text-amber-500"
                            >
                                {data.bodega.name}
                            </Link>
                        ) : (
                            "No data available"
                        )
                    }
                />

                {/* Preview field for the origin name */}
                <PreviewField
                    label="Denomination"
                    data={
                        data.denominacion ? (
                            <Link
                                href={route(
                                    "denominacion.show",
                                    data.denominacion.id,
                                )}
                                className="text-amber-700 hover:underline dark:text-amber-500"
                            >
                                {data.denominacion.name}
                            </Link>
                        ) : (
                            "No data available"
                        )
                    }
                />
            </div>
        );
    }

    // State variables to store the list of bodegas and denominaciones
    const [bodegas, setBodegas] = useState<VinoOption[]>([]);
    const [denominaciones, setDenominaciones] = useState<VinoOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch data for bodegas and denominaciones concurrently
                const [bodegasResponse, denominacionesResponse] =
                    await Promise.all([
                        fetch("/api/bodegas"),
                        fetch("/api/denominaciones"),
                    ]);

                // Check if the responses are successful
                if (!bodegasResponse.ok) {
                    throw new Error(
                        `Error fetching bodegas: ${bodegasResponse.statusText}`,
                    );
                }
                if (!denominacionesResponse.ok) {
                    throw new Error(
                        `Error fetching denominaciones: ${denominacionesResponse.statusText}`,
                    );
                }

                // Parse the JSON data from the responses
                const bodegasData = await bodegasResponse.json();
                const denominacionesData = await denominacionesResponse.json();

                // Ensure the data contains the expected array structure
                if (!Array.isArray(bodegasData.data)) {
                    throw new Error("Bodegas data is not an array");
                }
                if (!Array.isArray(denominacionesData.data)) {
                    throw new Error("Denominaciones data is not an array");
                }

                // Update the state with the fetched data
                setBodegas(bodegasData.data);
                setDenominaciones(denominacionesData.data);
            } catch (err) {
                // Handle any errors that occur during fetching
                console.error("Error fetching data:", err);
                setFetchError("Failed to load data. Please try again later.");
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
    if (fetchError) {
        return <div>{fetchError}</div>;
    }

    // If the data is successfully fetched, render the select fields
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Render the Bodega select field */}
            <SelectField
                label="Winery"
                options={bodegas}
                value={data.bodega_id?.toString()}
                onChange={(e) =>
                    onChange("bodega_id", parseInt(e.target.value))
                }
                disabled={disabled}
                error={errors.bodega_id}
            />
            {/* Render the Denominación de origen select field */}
            <SelectField
                label="Origin denomination"
                options={denominaciones}
                value={data.denominacion_id?.toString()}
                onChange={(e) =>
                    onChange("denominacion_id", parseInt(e.target.value))
                }
                disabled={disabled}
                error={errors.denominacion_id}
            />
        </div>
    );
};

// Export the DetailsSection component as the default export
export default DetailsSection;
