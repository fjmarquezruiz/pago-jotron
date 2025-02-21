// ToggleList.tsx
"use client";

import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { useState } from "react";

interface ToggleListProps {
    title: string;
    items: { id: number; name: string }[];
    selectedItems: string[];
    onItemChange: (item: string) => void;
    itemsToShow?: number;
}

const ToggleList = ({
    title,
    items,
    selectedItems,
    onItemChange,
    itemsToShow = 10,
}: ToggleListProps) => {
    const [showMore, setShowMore] = useState(false);

    const toggleShowMore = () => setShowMore(!showMore);

    return (
        <div>
            <h4 className="mb-3 font-medium">{title}</h4>
            <div className="space-y-2">
                {items
                    .slice(0, showMore ? items.length : itemsToShow)
                    .map((item) => (
                        <div key={item.id} className="flex items-center">
                            <Checkbox
                                id={item.id.toString()}
                                checked={selectedItems.includes(
                                    item.id.toString(),
                                )}
                                onCheckedChange={() =>
                                    onItemChange(item.id.toString())
                                }
                            />
                            <label
                                htmlFor={item.id.toString()}
                                className="ml-2 text-sm"
                            >
                                {item.name}
                            </label>
                        </div>
                    ))}
                {items.length > itemsToShow && (
                    <Button
                        variant="link"
                        className="text-sm text-primary"
                        onClick={toggleShowMore}
                    >
                        {showMore ? "Show Less" : "Show More"}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ToggleList;
