"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import { useAppContext } from "@/context/AppContext";
import { CiFilter } from "react-icons/ci";
import { FiX, FiSearch } from "react-icons/fi";
import { CiSliderHorizontal } from "react-icons/ci";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import ProductFilter from "@/components/ProductFilter";

// This is your original page component, now correctly isolated as a client component.
const AllProductsClient = () => {
    const { products, router } = useAppContext();
    const searchParams = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortOption, setSortOption] = useState("newest");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const calculatePriceRange = useCallback(() => {
        if (products.length === 0) return { min: 0, max: 1000 };
        const prices = products.map(p => p.offerPrice || p.price || 0).filter(p => p > 0);
        if (prices.length === 0) return { min: 0, max: 1000 };
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        return { min: minPrice, max: maxPrice };
    }, [products]);

    const [priceRange, setPriceRange] = useState(() => calculatePriceRange());
    const [maxPossiblePrice, setMaxPossiblePrice] = useState(1000);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    const allCategories = useMemo(() => ["All", ...new Set(products.map(p => p.category))], [products]);

    const brands = useMemo(() => {
        const brandCount = {};
        products.forEach(product => {
            const brand = product.brand || 'Unknown';
            brandCount[brand] = (brandCount[brand] || 0) + 1;
        });
        return Object.entries(brandCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [products]);

    useEffect(() => {
        const categoryParam = searchParams.get('category');
        setSelectedCategory(categoryParam || "All");
    }, [searchParams]);

    useEffect(() => {
        const range = calculatePriceRange();
        setMaxPossiblePrice(range.max);
        setPriceRange(prev => ({
            min: Math.max(0, prev.min),
            max: range.max
        }));
    }, [products, calculatePriceRange]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filterProducts = useCallback(() => {
        let result = [...products];
        if (selectedCategory !== "All") {
            result = result.filter(p => p.category === selectedCategory);
        }
        if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query));
        }
        if (selectedBrands.length > 0) {
            result = result.filter(p => selectedBrands.includes(p.brand || 'Unknown'));
        }
        result = result.filter(p => (p.offerPrice || p.price || 0) >= priceRange.min && (p.offerPrice || p.price || 0) <= priceRange.max);

        switch (sortOption) {
            case "nameAsc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
            case "nameDesc": result.sort((a, b) => b.name.localeCompare(a.name)); break;
            case "priceAsc": result.sort((a, b) => (a.offerPrice || a.price) - (b.offerPrice || b.price)); break;
            case "priceDesc": result.sort((a, b) => (b.offerPrice || b.price) - (a.offerPrice || a.price)); break;
            case "newest": result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
            default: break;
        }
        return result;
    }, [products, selectedCategory, debouncedSearchQuery, selectedBrands, priceRange, sortOption]);

    useEffect(() => {
        if (products.length > 0) {
            setIsLoading(true);
            setTimeout(() => {
                setFilteredProducts(filterProducts());
                setIsLoading(false);
            }, 300);
        } else {
             setIsLoading(false);
        }
    }, [products, filterProducts]);

    const handleSearchChange = (e) => setSearchQuery(e.target.value);

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />

            <main className="flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                           ᥫ᭡αву єѕѕєηтιαℓѕ ⋆˙⟡
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className="hidden lg:block">
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="nameAsc">Name: A-Z</option>
                                    <option value="nameDesc">Name: Z-A</option>
                                    <option value="priceAsc">Price: Low to High</option>
                                    <option value="priceDesc">Price: High to Low</option>
                                    <option value="popular">Popularity</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden text-sm flex items-center gap-1.5"
                            >
                                <CiSliderHorizontal className="h-5 w-5" />
                                <span>Filter & Sort</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative flex flex-col lg:flex-row gap-8">
                        <div
                            className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            onClick={() => setIsSidebarOpen(false)}
                        ></div>

                        <aside
                            className={`fixed lg:relative inset-y-0 right-0 z-50 flex flex-col w-80 lg:w-64 shrink-0 bg-white shadow-lg lg:shadow-none transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
                        >
                            <div className="flex items-center justify-between p-4 border-b lg:hidden">
                                <h2 className="font-semibold text-lg">Filters</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                                    <FiX className="h-6 w-6 text-gray-500" />
                                </button>
                            </div>
                            <div className="flex-grow overflow-y-auto p-4">
                                <ProductFilter
                                    router={router}
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
                            </div>
                            <div className="p-4 border-t lg:hidden">
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="w-full py-2.5 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition font-semibold"
                                >
                                    Show {filteredProducts.length} Results
                                </button>
                            </div>
                        </aside>

                        <div className="flex-1">
                            <div className="mb-6">
                                <div className="relative">
                                    <FiSearch className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-200" />
                                    <input
                                        type="text"
                                        placeholder="Search for products by name..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="w-full p-3 pl-12 pr-10 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                    {searchQuery && (
                                        <button
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <FiX className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <ProductGrid
                                products={filteredProducts}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AllProductsClient;
