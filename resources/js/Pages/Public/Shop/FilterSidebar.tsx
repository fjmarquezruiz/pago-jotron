"use client";

import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Slider } from "@/Components/ui/slider";
import { useEffect, useState } from "react";

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

    const wineTypes = [
        "Rosés",
        "Sparkling wine",
        "Vermouth",
        "Sweet wine",
        "Semi-sweet white wine",
        "Semi-sweet sparkling wine",
    ];

    const denominations = [
        "DO Jerez-Xérès-Sherry",
        "DO Manzanilla-Sanlúcar de Barrameda",
        "DO Montilla-Moriles",
        "DO Condado de Huelva",
        "DO Málaga",
    ];

    const grapeTypes = [
        "Cabernet Franc",
        "Cabernet Sauvignon",
        "Chardonnay",
        "Colombard",
        "Doradilla",
    ];

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
        <div className="w-64 flex-shrink-0 pr-8">
            <div className="sticky top-4">
                <div className="space-y-6">
                    <div>
                        <h3 className="mb-4 font-semibold">FILTERS</h3>
                        <Button
                            variant="ghost"
                            className="text-primary text-sm"
                            onClick={() => {
                                setPriceRange([4, 370]);
                                setSelectedWineTypes([]);
                                setSelectedDenominations([]);
                                setSelectedGrapeTypes([]);
                                setSelectedWinery(null);
                            }}
                        >
                            Clear all
                        </Button>
                    </div>

                    <div>
                        <h4 className="mb-3 font-medium">Wine Type</h4>
                        <div className="space-y-2">
                            {wineTypes.map((type) => (
                                <div key={type} className="flex items-center">
                                    <Checkbox
                                        id={type}
                                        checked={selectedWineTypes.includes(
                                            type,
                                        )}
                                        onCheckedChange={() =>
                                            handleWineTypeChange(type)
                                        }
                                    />
                                    <label
                                        htmlFor={type}
                                        className="ml-2 text-sm"
                                    >
                                        {type}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

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
                                <SelectItem value="sierra">
                                    Sierra de Málaga
                                </SelectItem>
                                <SelectItem value="costa">
                                    Costa del Sol
                                </SelectItem>
                                <SelectItem value="almeria">
                                    Costa de Almería
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <h4 className="mb-3 font-medium">
                            Denomination of Origin
                        </h4>
                        <div className="space-y-2">
                            {denominations.map((denomination) => (
                                <div
                                    key={denomination}
                                    className="flex items-center"
                                >
                                    <Checkbox
                                        id={denomination}
                                        checked={selectedDenominations.includes(
                                            denomination,
                                        )}
                                        onCheckedChange={() =>
                                            handleDenominationChange(
                                                denomination,
                                            )
                                        }
                                    />
                                    <label
                                        htmlFor={denomination}
                                        className="ml-2 text-sm"
                                    >
                                        {denomination}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-3 font-medium">Grape Type</h4>
                        <div className="space-y-2">
                            {grapeTypes.map((grape) => (
                                <div key={grape} className="flex items-center">
                                    <Checkbox
                                        id={grape}
                                        checked={selectedGrapeTypes.includes(
                                            grape,
                                        )}
                                        onCheckedChange={() =>
                                            handleGrapeTypeChange(grape)
                                        }
                                    />
                                    <label
                                        htmlFor={grape}
                                        className="ml-2 text-sm"
                                    >
                                        {grape}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;
