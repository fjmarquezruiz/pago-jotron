// FilterSidebar.tsx
"use client";

import { Button } from "@/Components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Slider } from "@/Components/ui/slider";
import { VinoOption } from "@/types/vino";
import { useEffect, useState } from "react";
import ToggleList from "./ToogleList";

interface FilterSidebarProps {
    onFilterChange: (filters: any) => void;
}

const FilterSidebar = ({ onFilterChange }: FilterSidebarProps) => {
    const [priceRange, setPriceRange] = useState([4, 370]);
    const [selectedWineTypes, setSelectedWineTypes] = useState<string[]>([]);
    const [selectedDenominations, setSelectedDenominations] = useState<
        string[]
    >([]);
    const [selectedGrapeTypes, setSelectedGrapeTypes] = useState<string[]>([]);
    const [selectedWinery, setSelectedWinery] = useState<string | null>(null);
    const [categorias, setCategorias] = useState<VinoOption[]>([]);
    const [denominaciones, setDenominaciones] = useState<VinoOption[]>([]);
    const [uvas, setUvas] = useState<VinoOption[]>([]);
    const [bodegas, setBodegas] = useState<VinoOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const filters = {
            priceRange,
            wineTypes: selectedWineTypes,
            denominations: selectedDenominations,
            grapeTypes: selectedGrapeTypes,
            winery: selectedWinery,
        };
        onFilterChange(filters);
    }, [
        priceRange,
        selectedWineTypes,
        selectedDenominations,
        selectedGrapeTypes,
        selectedWinery,
        onFilterChange,
    ]);

    useEffect(() => {
        const fetchData = async (
            url: string,
            setState: React.Dispatch<React.SetStateAction<VinoOption[]>>,
            directData: boolean = false,
        ) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                if (!Array.isArray(directData ? data : data.data)) {
                    throw new Error(`${url} data is not an array`);
                }
                setState(directData ? data : data.data);
            } catch (err) {
                console.error(`Error fetching data from ${url}:`, err);
                setError(
                    `Failed to load data from ${url}. Please try again later.`,
                );
            }
        };

        const fetchAllData = async () => {
            await Promise.all([
                fetchData("/api/categorias", setCategorias),
                fetchData("/api/denominaciones", setDenominaciones),
                fetchData("/api/uvas", setUvas, true), // Direct data for /api/uvas
                fetchData("/api/bodegas", setBodegas),
            ]);
            setLoading(false);
        };

        fetchAllData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const handleWineTypeChange = (type: string) => {
        setSelectedWineTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type],
        );
    };

    const handleDenominationChange = (denomination: string) => {
        setSelectedDenominations((prev) =>
            prev.includes(denomination)
                ? prev.filter((d) => d !== denomination)
                : [...prev, denomination],
        );
    };

    const handleGrapeTypeChange = (grape: string) => {
        setSelectedGrapeTypes((prev) =>
            prev.includes(grape)
                ? prev.filter((g) => g !== grape)
                : [...prev, grape],
        );
    };

    return (
        <div className="w-80 flex-shrink-0">
            <div className="sticky top-4 w-full rounded border border-neutral-900 p-6">
                <div className="space-y-6">
                    <div>
                        <h3 className="mb-4 font-semibold">FILTERS</h3>
                        <Button
                            variant="ghost"
                            className="text-sm text-primary"
                            onClick={() => {
                                setSelectedWineTypes([]);
                                setSelectedDenominations([]);
                                setSelectedGrapeTypes([]);
                                setSelectedWinery(null);
                            }}
                        >
                            Clear all
                        </Button>
                    </div>

                    <ToggleList
                        title="Wine Type"
                        items={categorias}
                        selectedItems={selectedWineTypes}
                        onItemChange={handleWineTypeChange}
                    />

                    <div>
                        <h4 className="mb-3 font-medium">Price Range</h4>
                        <div className="px-2">
                            <Slider
                                defaultValue={[4, 370]}
                                max={370}
                                min={4}
                                step={1}
                                value={priceRange}
                                onValueChange={setPriceRange}
                            />
                            <div className="mt-2 flex items-center justify-between text-sm">
                                <span>{priceRange[0]}€</span>
                                <span>{priceRange[1]}€</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-3 font-medium">Winery</h4>
                        <Select
                            value={selectedWinery || ""}
                            onValueChange={setSelectedWinery}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a winery" />
                            </SelectTrigger>
                            <SelectContent>
                                {bodegas.map((type) => (
                                    <SelectItem
                                        key={type.id}
                                        value={type.id.toString()}
                                    >
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <ToggleList
                        title="Denomination of Origin"
                        items={denominaciones}
                        selectedItems={selectedDenominations}
                        onItemChange={handleDenominationChange}
                    />

                    <ToggleList
                        title="Grape Type"
                        items={uvas}
                        selectedItems={selectedGrapeTypes}
                        onItemChange={handleGrapeTypeChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;
