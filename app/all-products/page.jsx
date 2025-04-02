'use client'
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";

const AllProducts = () => {
    const { products } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState("All Product");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [priceRange, setPriceRange] = useState([0, 200]);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Category icons only - removed categoryDisplayNames
    const categoryIcons = {
        "All Product": (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
        ),
        "FacialFoam": (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 21h10a2 2 0 0 0 2-2V11H5v8a2 2 0 0 0 2 2Z"></path>
                <path d="M2 11h20"></path>
                <path d="M6 11V8c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5v3"></path>
            </svg>
        ),
        "Cleansers": (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 5v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2Z"></path>
                <path d="M4 9v10a2 2 0 0 0 2 2h10"></path>
            </svg>
        )
    };
    
    // Get unique categories from products and change "All" to "All Product"
    const allCategories = ["All Product", ...new Set(products.map(product => product.category).filter(cat => cat !== "All"))];
    
    // Filter products when category, price range or search query changes
    useEffect(() => {
        setIsLoading(true);
        
        // Filter by category, price range and search query
        let result = [...products];
        
        if (selectedCategory !== "All Product") {
            result = result.filter(product => product.category === selectedCategory);
        }
        
        // Apply price range filter
        result = result.filter(product => 
            product.offerPrice >= priceRange[0] && product.offerPrice <= priceRange[1]
        );
        
        // Apply search filter if there's a search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(product => 
                product.name.toLowerCase().includes(query) || 
                (product.description && product.description.toLowerCase().includes(query))
            );
        }
        
        // Simulate loading for smooth transitions
        setTimeout(() => {
            setFilteredProducts(result);
            setIsLoading(false);
        }, 300);
    }, [selectedCategory, priceRange, searchQuery, products]);

    // Handle price range changes
    const handleMinPriceChange = (e) => {
        const minValue = parseInt(e.target.value);
        setPriceRange([minValue, priceRange[1]]);
    };
    
    const handleMaxPriceChange = (e) => {
        const maxValue = parseInt(e.target.value);
        setPriceRange([priceRange[0], maxValue]);
    };

    // Toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery("");
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            
            {/* Main Content Area */}
            <div className="flex flex-1 relative">
                {/* Left Sidebar - Now consistently on the left for both mobile and desktop */}
                <div 
                    className={`fixed md:sticky top-0 left-0 h-screen bg-white md:bg-gray-50 w-72 transform transition-transform duration-300 ease-in-out z-30 shadow-lg md:shadow-none ${
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
                >
                    <div className="p-6 h-full overflow-y-auto flex flex-col">
                        {/* Sidebar Header */}
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-2xl font-prata">Categories</h3>
                            <button onClick={toggleSidebar} className="md:hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>      
                        <div className="w-12 h-0.5 bg-sky-200 rounded-full mb-6"></div>
                        
                        {/* Search Box in Sidebar */}
                        <div className="mb-6">
                            <div className="relative font-light">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 py-2 bg-white shadow-md rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </div>
                                {searchQuery && (
                                    <button 
                                        onClick={clearSearch}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-gray-600">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Category Section */}
                        <div className="mb-8">
                            <div className="flex flex-col space-y-2">
                                {allCategories.map((category, index) => (
                                    <button 
                                        key={index}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setIsSidebarOpen(false);
                                        }}
                                        className={`flex items-center text-left px-3 py-2.5 rounded-md transition-all ${
                                            selectedCategory === category 
                                                ? 'bg-sky-100 text-sky-700 font-medium' 
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        <span className="mr-3">
                                            {categoryIcons[category] || categoryIcons["All Product"]}
                                        </span>
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Functional Price Range Filter */}
                        <div className="mb-8">
                            <h4 className="text-lg font-medium font-prata mb-2">Price Range</h4>
                            <div className="w-12 h-0.5 bg-sky-200 rounded-full mb-6"></div>
                            <div className="px-3">
                                <div className="flex justify-between items-center gap-2 mb-4">
                                    <div className="w-full">
                                        <label className="text-sm text-gray-600 block mb-1">Min ($)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max={priceRange[1]}
                                            value={priceRange[0]}
                                            onChange={handleMinPriceChange}
                                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div className="w-full">
                                        <label className="text-sm text-gray-600 block mb-1">Max ($)</label>
                                        <input 
                                            type="number" 
                                            min={priceRange[0]}
                                            max="1000"
                                            value={priceRange[1]}
                                            onChange={handleMaxPriceChange}
                                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full mb-2 relative">
                                    <div 
                                        className="h-2 bg-sky-400 rounded-full absolute"
                                        style={{
                                            left: `${(priceRange[0] / 200) * 100}%`,
                                            right: `${100 - (priceRange[1] / 200) * 100}%`,
                                        }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-gray-600 text-xs">${priceRange[0]}</span>
                                    <span className="text-gray-600 text-xs">${priceRange[1]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Sidebar Overlay - Mobile only */}
                <div 
                    className={`fixed inset-0 bg-black transition-opacity duration-300 md:hidden z-20 ${
                        isSidebarOpen ? 'opacity-50 visible' : 'opacity-0 invisible'
                    }`} 
                    onClick={toggleSidebar}
                ></div>
                
                {/* Main Content - Adjusted margins to accommodate consistent sidebar */}
                <div className="flex-1 px-4 md:px-8 lg:px-12 py-6">
                    {/* Header with Toggle and Search (for mobile) */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-prata">{selectedCategory}</h1>
                        </div>
                        
                        {/* Search for mobile - displayed inline on smaller screens */}
                        <div className="md:hidden relative flex-1 mx-4">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-300"
                            />
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            {searchQuery && (
                                <button 
                                    onClick={clearSearch}
                                    className="absolute inset-y-0 right-0 pr-2 flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        {/* Left sidebar toggle button */}
                        <button 
                            onClick={toggleSidebar} 
                            className="md:hidden p-2 hover:bg-gray-100 rounded-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    {/* Price Range Info and Search Results Summary */}
                    <div className="flex flex-wrap items-center justify-between mb-6">
                        <p className="text-gray-500 text-sm">
                            {searchQuery ? (
                                <>Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} for "{searchQuery}"</>
                            ) : (
                                <>Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</>
                            )}
                        </p>
                        <p className="md:hidden text-gray-500 text-sm">
                            Price: ${priceRange[0]} - ${priceRange[1]}
                        </p>
                    </div>
                    
                    {/* Products Grid with Loading State - Changed to 5 columns for desktop */}
                    <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-12">
                                {[...Array(10)].map((_, index) => (
                                    <div key={index} className="animate-pulse">
                                        <div className="bg-gray-200 h-40 md:h-60 rounded-lg mb-3"></div>
                                        <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                                        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-12">
                                {filteredProducts.map((product, index) => (
                                    <div 
                                        key={index} 
                                        className="opacity-0 animate-fadeIn" 
                                        style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                                    >
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 15h8"></path>
                                    <path d="M9 9h.01"></path>
                                    <path d="M15 9h.01"></path>
                                </svg>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No products found</h3>
                                <p className="text-gray-500">
                                    {searchQuery ? 
                                        `No results for "${searchQuery}". Try a different search term or adjust your filters.` : 
                                        'Try adjusting your filters'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Mobile Floating Action Button for Filter - Moved to left side */}
            <button 
                onClick={toggleSidebar}
                className="fixed bottom-6 left-6 md:hidden z-10 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
            </button>
            
            <Footer />
            
            {/* Add global styles for animations */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default AllProducts;