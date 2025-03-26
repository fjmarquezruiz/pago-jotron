// FilterSidebar.tsx
"use client";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
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
import FilterToogleList from "./FilterToogleList";

interface FilterSidebarProps {
    onFilterChange: (filters: any) => void;
}

const FilterSidebar = ({ onFilterChange }: FilterSidebarProps) => {
    const PRICE_RANGE = [0, 100];
    const [priceRange, setPriceRange] = useState(PRICE_RANGE);
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
        <div className="sticky top-4 flex w-80 flex-shrink-0 flex-col gap-6 rounded border border-neutral-200 p-6">
            <div className="flex items-baseline justify-between">
                <h3 className="heading-2xl-bold">FILTERS</h3>
                <Button
                    variant="link"
                    size="link-sm"
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

            {/* Winery */}
            <div className="flex flex-col gap-6">
                <div className="flex items-baseline justify-between">
                    <h4 className="font-lg-bold">Winery</h4>
                    <Button
                        variant="link"
                        size="link-sm"
                        onClick={() => {
                            setSelectedWinery(null);
                        }}
                    >
                        Clear
                    </Button>
                </div>
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
            <hr className="border-neutral-200" />

            {/* Price Range */}
            <div className="flex flex-col gap-6">
                <div className="flex items-baseline justify-between">
                    <h4 className="font-lg-bold">Price</h4>
                    {/* <Button
                        variant="link"
                        size="link-sm"
                        onClick={() => {
                            setSelectedWinery(null);
                        }}
                    >
                        Clear
                    </Button> */}
                </div>
                <div className="flex flex-col gap-6">
                    <Slider
                        defaultValue={PRICE_RANGE}
                        max={PRICE_RANGE[1]}
                        min={PRICE_RANGE[0]}
                        step={1}
                        value={priceRange}
                        onValueChange={setPriceRange}
                    />
                    <div className="flex items-center gap-4">
                        <Input
                            type="number"
                            value={priceRange[0]}
                            onChange={(e) =>
                                setPriceRange([
                                    Number(e.target.value),
                                    priceRange[1],
                                ])
                            }
                            min={PRICE_RANGE[0]}
                        />
                        <Input
                            type="number"
                            value={priceRange[1]}
                            onChange={(e) =>
                                setPriceRange([
                                    priceRange[0],
                                    Number(e.target.value),
                                ])
                            }
                            max={PRICE_RANGE[1]}
                        />
                    </div>
                    {/* <div className="mt-2 flex items-center justify-between text-sm">
                        <span>{priceRange[0]}€</span>
                        <span>{priceRange[1]}€</span>
                    </div> */}
                </div>
            </div>
            <hr className="border-neutral-200" />

            {/* Denomination of Origin */}
            <FilterToogleList
                title="Denomination of Origin"
                items={denominaciones}
                selectedItems={selectedDenominations}
                onItemChange={handleDenominationChange}
                reset={() => setSelectedDenominations([])}
            />
            <hr className="border-neutral-200" />

            {/* Wine type */}
            <FilterToogleList
                title="Wine Type"
                items={categorias}
                selectedItems={selectedWineTypes}
                onItemChange={handleWineTypeChange}
                reset={() => setSelectedWineTypes([])}
            />
            <hr className="border-neutral-200" />

            {/* Grape Type */}
            <FilterToogleList
                title="Grape Type"
                items={uvas}
                selectedItems={selectedGrapeTypes}
                onItemChange={handleGrapeTypeChange}
                reset={() => setSelectedGrapeTypes([])}
            />
            <hr className="border-neutral-200" />
        </div>
    );
};

export default FilterSidebar;
