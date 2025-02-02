import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { useMemo, useState } from "react";
import HeroSection from "../Layout/HeroSection";
import FilterSidebar from "./FilterSidebar";
import { Pagination } from "./Pagination";
import { ProductGrid } from "./ProductGrid";

// Mock products related to Andalusian wines
const mockProducts = [
    {
        id: 1,
        name: "La Encina del Inglés",
        price: 7.69,
        originalPrice: 9.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Sweet wine",
        denomination: "DO Málaga",
        grapeType: "Doradilla",
    },
    {
        id: 2,
        name: "El Jardín Secreto",
        price: 12.5,
        originalPrice: 14.0,
        region: "COSTA DEL SOL",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Semi-sweet",
        denomination: "DO Montilla-Moriles",
        grapeType: "Doradilla",
    },
    {
        id: 3,
        name: "Bodegas Mijares",
        price: 18.99,
        originalPrice: 21.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry white",
        denomination: "DO Sierra de Mijares",
        grapeType: "Palomino",
    },
    {
        id: 4,
        name: "Vinos del Alba",
        price: 15.5,
        originalPrice: 17.0,
        region: "JEREZ",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Sherry",
        denomination: "DO Jerez-Xérès-Sherry",
        grapeType: "Pedro Ximénez",
    },
    {
        id: 5,
        name: "Miguel Torres",
        price: 22.99,
        originalPrice: 25.0,
        region: "COSTA DEL SOL",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Rose",
        denomination: "DO Costers del Segura",
        grapeType: "Garnacha",
    },
    {
        id: 6,
        name: "Viñedos del Marques",
        price: 10.99,
        originalPrice: 12.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry red",
        denomination: "DO Sierra de Mijares",
        grapeType: "Monastrell",
    },
    {
        id: 7,
        name: "Bodegas Tradición",
        price: 14.99,
        originalPrice: 16.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Sweet wine",
        denomination: "DO Málaga",
        grapeType: "Doradilla",
    },
    {
        id: 8,
        name: "Viñedos del Sur",
        price: 19.99,
        originalPrice: 22.0,
        region: "COSTA DEL SOL",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry white",
        denomination: "DO Costers del Segura",
        grapeType: "Macabeo",
    },
    {
        id: 9,
        name: "Bodegas Alfonso",
        price: 24.99,
        originalPrice: 27.0,
        region: "JEREZ",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Sherry",
        denomination: "DO Jerez-Xérès-Sherry",
        grapeType: "Fino",
    },
    {
        id: 10,
        name: "Vinos del Mediterráneo",
        price: 17.99,
        originalPrice: 20.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry red",
        denomination: "DO Sierra de Mijares",
        grapeType: "Tempranillo",
    },
    {
        id: 11,
        name: "Bodegas La Bota",
        price: 9.99,
        originalPrice: 11.0,
        region: "COSTA DEL SOL",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Semi-sweet",
        denomination: "DO Málaga",
        grapeType: "Doradilla",
    },
    {
        id: 12,
        name: "Viñedos del Sol",
        price: 21.99,
        originalPrice: 24.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry white",
        denomination: "DO Sierra de Mijares",
        grapeType: "Palomino",
    },
    {
        id: 13,
        name: "Bodegas El Bosque",
        price: 16.99,
        originalPrice: 18.0,
        region: "JEREZ",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Sherry",
        denomination: "DO Jerez-Xérès-Sherry",
        grapeType: "Pedro Ximénez",
    },
    {
        id: 14,
        name: "Vinos del Alba",
        price: 13.99,
        originalPrice: 15.0,
        region: "COSTA DEL SOL",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Rose",
        denomination: "DO Costers del Segura",
        grapeType: "Garnacha",
    },
    {
        id: 15,
        name: "Bodegas del Sur",
        price: 11.99,
        originalPrice: 13.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry red",
        denomination: "DO Sierra de Mijares",
        grapeType: "Monastrell",
    },
    {
        id: 16,
        name: "Viñedos Tradición",
        price: 15.99,
        originalPrice: 17.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Sweet wine",
        denomination: "DO Málaga",
        grapeType: "Doradilla",
    },
    {
        id: 17,
        name: "Bodegas del Marques",
        price: 19.99,
        originalPrice: 22.0,
        region: "COSTA DEL SOL",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry white",
        denomination: "DO Costers del Segura",
        grapeType: "Macabeo",
    },
    {
        id: 18,
        name: "Viñedos Alfonso",
        price: 23.99,
        originalPrice: 26.0,
        region: "JEREZ",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Sherry",
        denomination: "DO Jerez-Xérès-Sherry",
        grapeType: "Fino",
    },
    {
        id: 19,
        name: "Bodegas del Mediterráneo",
        price: 18.99,
        originalPrice: 21.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry red",
        denomination: "DO Sierra de Mijares",
        grapeType: "Tempranillo",
    },
    {
        id: 20,
        name: "Viñedos La Bota",
        price: 10.99,
        originalPrice: 12.0,
        region: "COSTA DEL SOL",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Semi-sweet",
        denomination: "DO Málaga",
        grapeType: "Doradilla",
    },
    {
        id: 21,
        name: "Bodegas del Sol",
        price: 22.99,
        originalPrice: 25.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry white",
        denomination: "DO Sierra de Mijares",
        grapeType: "Palomino",
    },
    {
        id: 22,
        name: "Viñedos El Bosque",
        price: 17.99,
        originalPrice: 19.0,
        region: "JEREZ",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Sherry",
        denomination: "DO Jerez-Xérès-Sherry",
        grapeType: "Pedro Ximénez",
    },
    {
        id: 23,
        name: "Bodegas del Alba",
        price: 14.99,
        originalPrice: 16.0,
        region: "COSTA DEL SOL",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Rose",
        denomination: "DO Costers del Segura",
        grapeType: "Garnacha",
    },
    {
        id: 24,
        name: "Viñedos del Sur",
        price: 12.99,
        originalPrice: 14.0,
        region: "SIERRA DE MÁLAGA",
        imageUrl: "/placeholder.svg?height=400&width=300",
        type: "Dry red",
        denomination: "DO Sierra de Mijares",
        grapeType: "Monastrell",
    },
];

const Index = ({ auth }: PageProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<{
        priceRange: [number, number];
        wineTypes: string[];
        denominations: string[];
        grapeTypes: string[];
        winery: string | null;
    }>({
        priceRange: [4, 370],
        wineTypes: [],
        denominations: [],
        grapeTypes: [],
        winery: null,
    });

    const [sortOrder, setSortOrder] = useState<string>("Relevance");

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handleSortOrderChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        setSortOrder(event.target.value);
        setCurrentPage(1); // Reset to first page when sort order changes
    };

    const filteredProducts = useMemo(() => {
        let filtered = mockProducts.filter((product) => {
            const withinPriceRange =
                product.price >= filters.priceRange[0] &&
                product.price <= filters.priceRange[1];
            const matchesWineType =
                filters.wineTypes.length === 0 ||
                filters.wineTypes.includes(product.type); // Assuming `type` exists in product
            const matchesDenomination =
                filters.denominations.length === 0 ||
                filters.denominations.includes(product.denomination); // Assuming `denomination` exists in product
            const matchesGrapeType =
                filters.grapeTypes.length === 0 ||
                filters.grapeTypes.includes(product.grapeType); // Assuming `grapeType` exists in product
            const matchesWinery =
                !filters.winery || product.region === filters.winery;

            return (
                withinPriceRange &&
                matchesWineType &&
                matchesDenomination &&
                matchesGrapeType &&
                matchesWinery
            );
        });

        // Apply sorting based on selected order
        switch (sortOrder) {
            case "Price: Low to High":
                filtered.sort((a, b) => a.price - b.price);
                break;
            case "Price: High to Low":
                filtered.sort((a, b) => b.price - a.price);
                break;
            default:
                // Default to no specific order or relevance
                break;
        }

        return filtered;
    }, [filters, sortOrder]);

    const productsPerPage = 9;
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        return filteredProducts.slice(startIndex, startIndex + productsPerPage);
    }, [filteredProducts, currentPage, productsPerPage]);

    return (
        <>
            <Head title="The shop" />
            <HeroSection
                auth={auth}
                section="The shop"
                title="The best wines of Andalusia"
            />
            <div className="container mx-auto border border-red-800 px-4 py-8">
                <div className="flex gap-8">
                    <FilterSidebar onFilterChange={handleFilterChange} />

                    <div className="flex-1">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing {totalProducts} results
                            </div>
                            <select
                                className="rounded-md border p-2 text-sm"
                                value={sortOrder}
                                onChange={handleSortOrderChange}
                            >
                                <option value="Relevance">Relevance</option>
                                <option value="Price: Low to High">
                                    Price: Low to High
                                </option>
                                <option value="Price: High to Low">
                                    Price: High to Low
                                </option>
                            </select>
                        </div>

                        {paginatedProducts.length > 0 ? (
                            <>
                                <ProductGrid products={paginatedProducts} />

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        ) : (
                            <div className="mt-10 text-center text-gray-500">
                                No products found matching your filters.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Index;
