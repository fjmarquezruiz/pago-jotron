import { useState, useEffect } from "react";
import { BodegaSectionProps, Denominacion, Uva } from "@/types";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import SecondaryButton from "@/Components/SecondaryButton";
import Toast from "@/Components/Forms/Toast";
import { Link } from "@inertiajs/react";
import { IconTrash, IconMap } from "@tabler/icons-react";
import { dangerButton, primaryButton } from "@/styles";

/**
 * RegionsSection Component
 * This component manages the denominaciones that a winery/bodega belongs to.
 * It allows adding, removing, and saving denominaciones.
 *
 * @param {BodegaSectionProps} props - The component props.
 * @param {Object} props.data - Object containing the current state of the bodega data.
 * @param {Function} props.onChange - Callback function to update the bodega data.
 * @param {Object} props.errors - Object containing any validation errors.
 * @param {boolean} props.preview - Boolean indicating whether the component should render in preview mode.
 * @returns {JSX.Element} A JSX element representing the regions section.
 */
const RegionsSection = ({
    data, // Object containing the current state of the bodega data
    onChange = () => { }, // Callback function to update the bodega data
    errors = {}, // Object containing any validation errors
    preview = false, // Boolean indicating whether the component should render in preview mode
}: BodegaSectionProps) => {
    const LABEL = "Denominations";

    // If in preview mode, render a simplified view of the denominaciones
    if (preview) {
        return (
            <div className="flex flex-col gap-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {LABEL}
                </h3>
                {data.denominaciones?.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No hay denominaciones registradas para esta bodega actualmente.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.denominaciones?.map((denominacion) => (
                            <Link
                                key={denominacion.id}
                                href={route(
                                    "denominacion.show",
                                    denominacion.id,
                                )}
                                className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-amber-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-amber-500"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-500 dark:group-hover:bg-amber-900/30">
                                    <IconMap className="size-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-700 dark:group-hover:text-amber-500">
                                        {denominacion.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {denominacion.vinos_count ?? 0} vinos registrados
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // State variables
    const [denominaciones, setDenominaciones] = useState<Denominacion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Transform the denominaciones data from the server to match the expected structure
    const transformedDenominaciones = (data.denominaciones || []).map(
        (denominacion) => ({
            id: denominacion.id,
            name: denominacion.name,
            blocked: denominacion.blocked,
            created_at: denominacion.created_at,
        }),
    );

    // Initialize regions state with a default row if no regions are present
    const [regions, setRegions] = useState<Denominacion[]>(
        transformedDenominaciones.length > 0
            ? transformedDenominaciones
            : [
                {
                    id: 0,
                    name: "",
                    blocked: false,
                    created_at: new Date().toISOString(),
                },
            ],
    );

    // Fetch denominaciones from the server on component mount
    useEffect(() => {
        const fetchDenominaciones = async () => {
            try {
                const response = await fetch("/api/denominaciones");
                if (!response.ok) {
                    throw new Error(
                        `Error fetching denominations: ${response.statusText}`,
                    );
                }
                const denominacionesDataFetch = await response.json();
                setDenominaciones(denominacionesDataFetch.data);
            } catch (err) {
                console.error("Error fetching denominations:", err);
                setFetchError(
                    "Failed to load denominations. Please try again later.",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDenominaciones();
    }, []);

    // Determine if the save button should be disabled based on validation rules
    useEffect(() => {
        if (regions.length === 0) {
            setSaveDisabled(false);
        } else if (regions.some((grape) => grape.id === 0)) {
            setSaveDisabled(true);
        } else {
            setSaveDisabled(false);
        }
    }, [regions]);

    // Update effectively saveDisabled.
    useEffect(() => { }, [saveDisabled]);

    // Function to add a new denominacion
    const handleAddRow = () => {
        setRegions([
            ...regions,
            {
                id: 0,
                name: "",
                blocked: false,
                created_at: new Date().toISOString(),
            },
        ]);
    };

    // Function to remove a denominacion at a specific index
    const handleRemoveRow = (index: number) => {
        setRegions(regions.filter((_, i) => i !== index));
    };

    // Function to save the denominaciones
    const handleSaveRows = () => {
        if (Array.isArray(regions) && regions.length > 0) {
            onChange("denominaciones", [...regions]);
            setToastMessage("Action performed successfully!"); // Show toast message
        } else if (Array.isArray(regions) && regions.length === 0) {
            onChange("denominaciones", []);
            setToastMessage("Action performed successfully!"); // Show toast message
        } else {
            console.error("Invalid denominations data");
        }
    };

    // Function to close the toast notification
    const handleCloseToast = () => {
        setToastMessage(null); // Hide the toast
    };

    // Function to handle changes to a denominacion's properties
    const handleRowChange = (
        index: number,
        field: "id" | "name",
        value: any,
    ) => {
        const newRegions = [...regions];
        switch (field) {
            case "id":
                newRegions[index].id = parseInt(value, 10);
                newRegions[index].name =
                    denominaciones.find((d) => d.id === parseInt(value, 10))
                        ?.name || "";
                break;
            case "name":
                newRegions[index].name = value;
                break;
            default:
                break;
        }
        setRegions(newRegions);
    };

    // Render loading state
    if (loading) {
        return <div>Loading...</div>;
    }

    // Render error state
    if (fetchError) {
        return <div>{fetchError}</div>;
    }

    // Render the main component UI
    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        {/* Render the InputLabel component with htmlFor and value props */}
                        <InputLabel
                            htmlFor={LABEL.toLowerCase().replace(/\s+/g, "-")} // Convert label to lowercase and replace spaces with hyphens for htmlFor attribute
                            value={LABEL} // Pass the label text as value prop
                        />

                        <span className="text-sm text-gray-400">Opcional</span>
                    </div>
                </div>

                {regions.map((grape, index) => (
                    <div
                        key={index}
                        className="grid-col-2 grid flex-1 items-center gap-6 sm:grid-cols-4 md:grid-cols-6"
                    >
                        <select
                            id={`grape-${index}`}
                            value={grape.id}
                            onChange={(e) => {
                                handleRowChange(index, "id", +e.target.value);
                                handleRowChange(
                                    index,
                                    "name",
                                    e.target.options[e.target.selectedIndex]
                                        .text,
                                );
                            }}
                            className={`col-span-2 block w-full resize-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:col-span-4 ${errors.denominaciones ? "border-red-500" : "" // Add red border if there's an error
                                } dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50`}
                            aria-label={`grape-${index}`}
                        >
                            <option value={0}>
                                Select denomination
                            </option>
                            {denominaciones.map((denominacion) => (
                                <option
                                    key={denominacion.id}
                                    value={denominacion.id}
                                >
                                    {denominacion.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            className={`${dangerButton} min-h-[42px]`}
                            aria-label="Remove grape"
                            title="Remove grape"
                        >
                            <IconTrash stroke={1.5} className="size-4" /> Remove
                        </button>
                    </div>
                ))}
                <div className="flex w-full flex-col gap-6 md:flex-row">
                    <SecondaryButton
                        onClick={handleAddRow}
                        aria-label="Add denomination"
                        title="Add denomination"
                    >
                        Add denomination
                    </SecondaryButton>
                    <button
                        type="button"
                        onClick={handleSaveRows}
                        className={primaryButton}
                        disabled={saveDisabled}
                        aria-label="Save denominations"
                        title="Save denominations"
                    >
                        Save denominations
                    </button>
                    {toastMessage && (
                        <Toast
                            message={toastMessage}
                            onClose={handleCloseToast}
                        />
                    )}
                </div>
                {errors.denominaciones && (
                    <InputError message={errors.denominaciones} />
                )}
            </div>
        </>
    );
};

export default RegionsSection;
