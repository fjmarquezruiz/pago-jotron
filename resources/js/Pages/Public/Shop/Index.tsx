import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { PageProps } from "@/types";
import { Vino } from "@/types/vino";
import { Head, router } from "@inertiajs/react";
import debounce from "lodash/debounce";
import { useState } from "react";
import HeroSection from "../Layout/HeroSection";
import FilterSidebar from "./FilterSidebar";
import Pagination from "./Pagination";
import { ProductGrid } from "./ProductGrid";

interface Links {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: Links[];
    per_page: number;
    total: number;
}

interface QueryParams extends Record<string, any> {
    page?: string;
    priceRange?: string[];
    wineTypes?: string[];
    denominations?: string[];
    grapeTypes?: string[];
    winery?: string | null;
    sortField?: string;
    sortDirection?: string;
}

interface IndexProps extends Record<string, unknown> {
    vinos: {
        data: Vino[];
        meta: PaginationMeta;
    };
    queryParams?: QueryParams;
}

const Index = ({ auth, vinos, queryParams = {} }: PageProps<IndexProps>) => {
    // Get initial filter/sort values from URL (queryParams)
    const initialFilters = {
        priceRange: queryParams.priceRange ?? [],
        wineTypes: queryParams.wineTypes ?? [],
        denominations: queryParams.denominations ?? [],
        grapeTypes: queryParams.grapeTypes ?? [],
        winery: queryParams.winery ?? null,
        sortField: queryParams.sortField ?? "name",
        sortDirection: queryParams.sortDirection ?? "asc",
    };

    const [filters, setFilters] = useState(initialFilters);
    const [currentPage, setCurrentPage] = useState<number>(
        vinos.meta.current_page,
    );

    const SORT_OPTIONS = [
        { id: 1, label: "Name: A-Z", value: "name_asc" },
        { id: 2, label: "Name: Z-A", value: "name_desc" },
        { id: 3, label: "Price: Low to High", value: "price_asc" },
        { id: 4, label: "Price: High to Low", value: "price_desc" },
    ];

    // Debounce API calls (wait 300ms before making a request)
    const debouncedUpdateFilters = debounce((newFilters: QueryParams) => {
        router.get(route("shop"), newFilters, {
            preserveState: true,
            replace: true,
        });
    }, 300);

    // Function to update filters and trigger server-side request
    const updateFilters = (newFilters: Partial<QueryParams>) => {
        const updatedFilters = {
            ...filters,
            ...newFilters,
        };
        // Prevent redundant API calls if filters haven’t changed
        if (JSON.stringify(updatedFilters) === JSON.stringify(filters)) return;

        setFilters(updatedFilters);
        setCurrentPage(1);

        // Construct query parameters
        const queryParams: QueryParams = {
            page: "1",
            priceRange: updatedFilters.priceRange?.length
                ? updatedFilters.priceRange
                : undefined,
            wineTypes: updatedFilters.wineTypes?.length
                ? updatedFilters.wineTypes
                : undefined,
            denominations: updatedFilters.denominations?.length
                ? updatedFilters.denominations
                : undefined,
            grapeTypes: updatedFilters.grapeTypes?.length
                ? updatedFilters.grapeTypes
                : undefined,
            winery: updatedFilters.winery,
            sortField: updatedFilters.sortField,
            sortDirection: updatedFilters.sortDirection,
        };

        debouncedUpdateFilters(queryParams);
    };

    // Function to update sorting
    const updateSortOrder = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const [sortField, sortDirection] = event.target.value.split("_");
        updateFilters({ sortField, sortDirection });
    };

    // Function to change page
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            route("shop"),
            { ...filters, page },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="The shop" />
            <HeroSection
                auth={auth}
                section="The shop"
                title="The shop"
                text="The best wines of Andalusia"
            />

            <main className="container mx-auto px-5 pb-32 pt-12">
                <div className="mx-auto flex max-w-7xl gap-6">
                    <FilterSidebar onFilterChange={updateFilters} />

                    <div className="flex flex-1 flex-col gap-12 pl-6">
                        <div className="grid grid-cols-4 items-center gap-6">
                            <div className="font-sm-medium col-span-1 text-gray-500">
                                Showing <strong>{vinos.data.length}</strong> of{" "}
                                <strong>{vinos.meta.total}</strong> results
                            </div>
                            <Select
                                value={
                                    `${filters.sortField}_${filters.sortDirection}` ||
                                    ""
                                }
                                onValueChange={(value: string) => {
                                    const [sortField, sortDirection] =
                                        value.split("_");
                                    updateFilters({ sortField, sortDirection });
                                }}
                            >
                                <SelectTrigger className="col-start-4">
                                    <SelectValue placeholder="Order by" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORT_OPTIONS.map((type) => (
                                        <SelectItem
                                            key={type.id}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {vinos.data.length > 0 ? (
                            <>
                                <ProductGrid products={vinos.data} />
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={vinos.meta.last_page}
                                    onPageChange={handlePageChange}
                                />
                            </>
                        ) : (
                            <div className="mt-10 text-center text-gray-500">
                                No products found matching your filters.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};

export default Index;
