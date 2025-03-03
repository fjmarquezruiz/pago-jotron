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
                title="The best wines of Andalusia"
            />

            <main className="container mx-auto px-5 pb-32 pt-12">
                <div className="mx-auto flex max-w-7xl gap-6">
                    <FilterSidebar onFilterChange={updateFilters} />

                    <div className="flex flex-1 flex-col gap-12 pl-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing {vinos.data.length} of{" "}
                                {vinos.meta.total} results
                            </div>
                            <select
                                className="rounded-md border p-2 text-sm"
                                value={`${filters.sortField}_${filters.sortDirection}`}
                                onChange={updateSortOrder}
                            >
                                <option value="">Order by</option>
                                <option value="name_asc">Name: A-Z</option>
                                <option value="name_desc">Name: Z-A</option>
                                <option value="price_asc">
                                    Price: Low to High
                                </option>
                                <option value="price_desc">
                                    Price: High to Low
                                </option>
                            </select>
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
