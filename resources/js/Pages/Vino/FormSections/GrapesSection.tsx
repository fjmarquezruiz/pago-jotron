import { useState, useEffect } from "react";
import { VinoSectionProps } from "@/types/vino";
import { Uva } from "@/types";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import SecondaryButton from "@/Components/SecondaryButton";
import Toast from "@/Components/Forms/Toast";
import { IconTrash } from "@tabler/icons-react";
import { dangerButton, primaryButton } from "@/styles";

/**
 * GrapesSection Component
 * This component manages the grape varieties used in a wine.
 * It allows adding, removing, and saving grape varieties with their respective percentages.
 */
const GrapesSection = ({
    data, // Object containing the current state of the wine data
    onChange = () => {}, // Callback function to update the wine data
    errors = {}, // Object containing any validation errors
    preview = false, // Boolean indicating whether the component should render in preview mode
}: VinoSectionProps) => {
    const LABEL = "Grape varieties used";

    // If in preview mode, render a simplified view of the grape varieties
    if (preview) {
        return (
            <div className="flex flex-col gap-1.5">
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {LABEL}
                </p>
                {data.uvas?.length === 0 ? (
                    <p className="mt-1.5 block w-full text-lg font-semibold">
                        No grape varieties added.
                    </p>
                ) : (
                    data.uvas?.map((uva) => (
                        <p
                            key={uva.id}
                            className="mt-1.5 block w-full text-lg font-semibold"
                        >
                            {uva.pivot.percent} % - {uva.name}
                        </p>
                    ))
                )}
            </div>
        );
    }

    // State variables
    const [uvas, setUvas] = useState<Uva[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
    const [totalPercent, setTotalPercent] = useState<number>(0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Transform the uvas data from the server to match the expected structure
    const transformedUvas = (data.uvas || []).map((uva) => ({
        id: uva.id,
        name: uva.name,
        created_at: uva.created_at,
        updated_at: uva.updated_at,
        pivot: {
            vino_id: uva.pivot.vino_id,
            percent: uva.pivot.percent,
            name: uva.pivot.name,
        },
    }));

    // Initialize grapes state with a default row if no grapes are present
    const [grapes, setGrapes] = useState<Uva[]>(
        transformedUvas.length > 0
            ? transformedUvas
            : [
                  {
                      id: 0,
                      name: "",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      pivot: {
                          vino_id: data.id,
                          percent: 0,
                          name: data.name,
                      },
                  },
              ],
    );

    // Fetch grape varieties from the server on component mount
    useEffect(() => {
        const fetchUvas = async () => {
            try {
                const response = await fetch("/api/uvas");
                if (!response.ok) {
                    throw new Error(
                        `Error fetching uvas: ${response.statusText}`,
                    );
                }
                const uvasDataFetch = await response.json();
                setUvas(uvasDataFetch);
            } catch (err) {
                console.error("Error fetching uvas:", err);
                setFetchError(
                    "Failed to load uvas varieties. Please try again later.",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchUvas();
    }, []);

    // Calculate the total percentage of all grapes
    useEffect(() => {
        if (grapes.length === 0) {
            setTotalPercent(-1);
        } else {
            const calculatedPercent = grapes.reduce((acc, grape) => {
                const percent = parseFloat(grape.pivot.percent.toString());
                return acc + (isNaN(percent) ? 0 : percent);
            }, 0);
            setTotalPercent(calculatedPercent);
        }
    }, [grapes]);

    // Determine if the save button should be disabled based on validation rules
    useEffect(() => {
        if (totalPercent == -1) {
            setSaveDisabled(false);
        } else if (
            grapes.length === 0 ||
            totalPercent < 100 ||
            totalPercent > 100
        ) {
            setSaveDisabled(true);
        } else if (
            grapes.some(
                (grape) =>
                    grape.id === 0 ||
                    grape.pivot.percent <= 0 ||
                    isNaN(grape.pivot.percent),
            )
        ) {
            setSaveDisabled(true);
        } else {
            setSaveDisabled(false);
        }
    }, [grapes, totalPercent]);

    // Update effectively saveDisabled.
    useEffect(() => {}, [saveDisabled]);

    // Function to add a new grape variety
    const handleAddRow = () => {
        setGrapes([
            ...grapes,
            {
                id: 0,
                name: "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                pivot: {
                    vino_id: data.id,
                    percent: 0,
                    name: data.name,
                },
            },
        ]);
    };

    // Function to remove a grape variety at a specific index
    const handleRemoveRow = (index: number) => {
        setGrapes(grapes.filter((_, i) => i !== index));
    };

    // Function to save the grape varieties
    const handleSaveRows = () => {
        if (Array.isArray(grapes) && grapes.length > 0) {
            onChange("uvas", [...grapes]);
            setToastMessage("Action performed successfully!"); // Show toast message
        } else if (Array.isArray(grapes) && grapes.length === 0) {
            onChange("uvas", []);
            setToastMessage("Action performed successfully!"); // Show toast message
        } else {
            console.error("Invalid grapes data");
        }
    };

    // Function to close the toast notification
    const handleCloseToast = () => {
        setToastMessage(null); // Hide the toast
    };

    // Function to handle changes to a grape's properties
    const handleRowChange = (
        index: number,
        field: "id" | "percent" | "name",
        value: any,
    ) => {
        const newGrapes = [...grapes];
        switch (field) {
            case "id":
                newGrapes[index].id = parseInt(value);
                break;
            case "percent":
                newGrapes[index].pivot.percent = parseFloat(value);
                break;
            case "name":
                newGrapes[index].name = value;
                break;
            default:
                break;
        }
        newGrapes[index].pivot.vino_id = data.id;
        newGrapes[index].pivot.name = data.name;
        setGrapes(newGrapes);
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

            {grapes.map((grape, index) => (
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
                                e.target.options[e.target.selectedIndex].text,
                            );
                        }}
                        className={`col-span-2 block w-full resize-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:col-span-4 ${
                            errors.uvas ? "border-red-500" : "" // Add red border if there's an error
                        } dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50`}
                        aria-label={`grape-${index}`}
                    >
                        <option value={0}>Select Grape Variety</option>
                        {uvas.map((uva) => (
                            <option key={uva.id} value={uva.id}>
                                {uva.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={grape.pivot.percent}
                        min="0"
                        max="100"
                        onChange={(e) =>
                            handleRowChange(index, "percent", e.target.value)
                        }
                        className={`col-span-1 block resize-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:col-span-2 md:col-span-1 ${
                            errors.uvas ? "border-red-500" : "" // Add red border if there's an error
                        } dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50`}
                    />
                    <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className={`${dangerButton} min-h-[42px]`}
                        aria-label={`Remove grape`}
                        title={`Remove grape`}
                    >
                        <IconTrash stroke={1.5} className="size-4" /> Remove
                    </button>
                </div>
            ))}
            <div className="flex w-full flex-col gap-6 md:flex-row">
                <SecondaryButton
                    onClick={handleAddRow}
                    disabled={totalPercent >= 100}
                    aria-label="Add grape variety"
                    title="Add grape variety"
                >
                    Add grape variety
                </SecondaryButton>
                <button
                    type="button"
                    onClick={handleSaveRows}
                    className={primaryButton}
                    disabled={saveDisabled}
                    aria-label="Save grape varieties"
                    title="Save grape varieties"
                >
                    Save grape varieties
                </button>
                {toastMessage && (
                    <Toast message={toastMessage} onClose={handleCloseToast} />
                )}
            </div>
            {totalPercent !== 100 && (
                <InputError
                    message={`Total percentage must be 100%. Current total: ${totalPercent}%`}
                />
            )}
            {errors.uvas && <InputError message={errors.uvas} />}
        </div>
    );
};

export default GrapesSection;
