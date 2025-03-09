// ToggleList.tsx
"use client";

import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { useState } from "react";

interface ToggleListProps {
    title: string;
    items: { id: number; name: string }[];
    selectedItems: string[];
    onItemChange: (item: string) => void;
    itemsToShow?: number;
    reset?: () => void;
}

const FilterToogleList = ({
    title,
    items,
    selectedItems,
    onItemChange,
    itemsToShow = 4,
    reset,
}: ToggleListProps) => {
    const [showMore, setShowMore] = useState(false);

    const toggleShowMore = () => setShowMore(!showMore);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-baseline justify-between">
                <h4 className="font-lg-bold">{title}</h4>
                <Button variant="link" size="link-sm" onClick={reset}>
                    Clear
                </Button>
            </div>
            <ScrollArea className="h-44 w-full rounded border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex flex-col gap-3">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-2">
                            <Checkbox
                                id={item.id.toString()}
                                checked={selectedItems.includes(
                                    item.id.toString(),
                                )}
                                onCheckedChange={() =>
                                    onItemChange(item.id.toString())
                                }
                                className="mt-0.5"
                            />
                            <label
                                htmlFor={item.id.toString()}
                                className="font-sm-medium"
                            >
                                {item.name}
                            </label>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

export default FilterToogleList;
