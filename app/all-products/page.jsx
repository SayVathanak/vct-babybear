"use client";
import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { CiFilter } from "react-icons/ci";
// Components
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import ProductFilter from "@/components/ProductFilter";

const AllProducts = () => {
    const { products } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortOption, setSortOption] = useState("nameAsc");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const calculatePriceRange = useCallback(() => {
        if (products.length === 0) return { min: 0, max: 1000 };

        const prices = products.map(product => product.offerPrice);
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));

        return { min: minPrice, max: maxPrice };
    }, [products]);
    const [priceRange, setPriceRange] = useState(() => calculatePriceRange());
    const [maxPossiblePrice, setMaxPossiblePrice] = useState(1000);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    // Extract unique categories and brands
    const allCategories = ["All", ...new Set(products.map(product => product.category))];

    const getBrands = () => {
        const brandCount = {};
        products.forEach(product => {
            const brand = product.brand || 'Unknown';
            brandCount[brand] = (brandCount[brand] || 0) + 1;
        });

        return Object.entries(brandCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    };

    const brands = getBrands();

    useEffect(() => {
        // Get category from URL if it exists
        const params = new URLSearchParams(window.location.search);
        const categoryParam = params.get('category');
        if (categoryParam) {
            setSelectedCategory(categoryParam);
        }
    }, []);

    useEffect(() => {
        const range = calculatePriceRange();
        setMaxPossiblePrice(range.max);

        // Only reset the price range if the current max is higher than the new calculated max
        // This prevents resetting user's selected range when it's within the valid bounds
        setPriceRange(prev => ({
            min: prev.min,
            max: prev.max > range.max ? range.max : prev.max
        }));
    }, [products, calculatePriceRange]);

    // Debounce search query to avoid rapid filtering
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter products function
    const filterProducts = useCallback(() => {
        // Start with all products
        let result = [...products];

        // Apply category filter
        if (selectedCategory !== "All") {
            result = result.filter(product => product.category === selectedCategory);
        }

        // Apply search filter
        if (debouncedSearchQuery.trim() !== "") {
            const query = debouncedSearchQuery.toLowerCase();
            result = result.filter(product =>
                product.name.toLowerCase().includes(query) ||
                (product.description && product.description.toLowerCase().includes(query))
            );
        }

        // Apply brand filter
        if (selectedBrands.length > 0) {
            result = result.filter(product =>
                selectedBrands.includes(product.brand || 'Unknown')
            );
        }

        // Apply price filter
        result = result.filter(product =>
            product.offerPrice >= priceRange.min &&
            product.offerPrice <= priceRange.max
        );

        // Apply sorting
        switch (sortOption) {
            case "nameAsc":
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "nameDesc":
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "priceAsc":
                result.sort((a, b) => a.offerPrice - b.offerPrice);
                break;
            case "priceDesc":
                result.sort((a, b) => b.offerPrice - a.offerPrice);
                break;
            case "newest":
                result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                break;
            case "popular":
                // Placeholder for popularity sorting
                break;
            default:
                break;
        }

        return result;
    }, [products, selectedCategory, debouncedSearchQuery, selectedBrands, priceRange, sortOption]);

    // Initial load and when filter parameters change
    useEffect(() => {
        // Only show loading on initial load or major filter changes (not search)
        if (products.length > 0 && filteredProducts.length === 0) {
            setIsLoading(true);

            // Short timeout for initial load
            setTimeout(() => {
                setFilteredProducts(filterProducts());
                setIsLoading(false);
            }, 300);
        } else {
            // For subsequent filter changes, update without loading state
            setFilteredProducts(filterProducts());
        }
    }, [products, filterProducts, filteredProducts.length]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="max-w-7xl px-4 md:px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-medium text-sky-300">ᥫ᭡αву єѕѕєηтιαℓѕ ⋆˙⟡</h1>

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:block">   
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="newest">Newest</option>
                                <option value="nameAsc">Name: A to Z</option>
                                <option value="nameDesc">Name: Z to A</option>
                                <option value="priceAsc">Price: Low to High</option>
                                <option value="priceDesc">Price: High to Low</option>
                                <option value="popular">Popularity</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden px-3 py-2 text-sm flex items-center"
                        >
                            <CiFilter className="h-6 w-6" />
                        </button>

                    </div>
                </div>

                <div className="relative flex flex-col lg:flex-row gap-8">
                    {/* Overlay for mobile filters */}
                    <div
                        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>

                    {/* Sidebar/Filters */}
                    <div
                        className={`lg:w-64 shrink-0 bg-white lg:bg-transparent fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto overflow-y-auto shadow-lg lg:shadow-none transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-6 lg:hidden">
                            <button onClick={() => setIsSidebarOpen(true)} className="flex items-center text-lg font-medium">
                                <CiFilter className="h-6 w-6 mr-2" />
                                Filters
                            </button>
                        </div>


                        <ProductFilter
                            categories={allCategories}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            sortOption={sortOption}
                            setSortOption={setSortOption}
                            priceRange={priceRange}
                            setPriceRange={setPriceRange}
                            maxPossiblePrice={maxPossiblePrice}
                            brands={brands}
                            selectedBrands={selectedBrands}
                            setSelectedBrands={setSelectedBrands}
                        />

                        <div className="mt-6 pt-6 border-t border-gray-200 lg:hidden">
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                {searchQuery && (
                                    <button
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <ProductGrid
                            products={filteredProducts}
                            isLoading={isLoading}
                            title=""
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default AllProducts;