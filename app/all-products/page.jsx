'use client'
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import { MdFilterAlt } from 'react-icons/md';

const AllProducts = () => {
    const { products } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sortOption, setSortOption] = useState("newest");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    
    // Category mapping for display names and icons
    const categoryDisplayNames = {
        "All": "All Products",
        "PowderedMilk": "Formula & Powdered Milk",
        "LiquidMilk": "Ready-to-Feed Milk",
        "Bottles": "Bottles & Sippy Cups",
        "Tumblers": "Toddler Tumblers & Cups",
        "FeedingTools": "Feeding Sets & Utensils",
        "Accessories": "Baby Essentials & Accessories",
        "Vitamins": "Nutrition & Supplements",
        "Diapers": "Diapers & Wipes",
        "NurseryItems": "Nursery & Sleep Essentials"
    };
    
    // Get unique categories from products and add "All" option
    const allCategories = ["All", ...new Set(products.map(product => product.category))];
    
    // Function to truncate text for mobile view
    const truncateText = (text, maxLength = 20) => {
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };
    
    // Filter and sort products when category, sort option, or search query changes
    useEffect(() => {
        setIsLoading(true);
        
        // Filter by category and search query
        let result = [...products];
        
        // Apply category filter
        if (selectedCategory !== "All") {
            result = result.filter(product => product.category === selectedCategory);
        }
        
        // Apply search filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(product => 
                product.name.toLowerCase().includes(query) || 
                (product.description && product.description.toLowerCase().includes(query))
            );
        }
        
        // Sort products
        switch (sortOption) {
            case "priceAsc":
                result.sort((a, b) => a.offerPrice - b.offerPrice);
                break;
            case "priceDesc":
                result.sort((a, b) => b.offerPrice - a.offerPrice);
                break;
            case "newest":
                // Assuming we have a createdAt field, otherwise this is a placeholder
                result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                break;
            case "popular":
                // Placeholder for popularity sorting - could be based on sales or views
                break;
            default:
                break;
        }
        
        // Simulate loading for smooth transitions
        setTimeout(() => {
            setFilteredProducts(result);
            setIsLoading(false);
        }, 300);
    }, [selectedCategory, sortOption, products, searchQuery]);

    // Toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Toggle search visibility
    const toggleSearch = () => {
        setIsSearchVisible(!isSearchVisible);
        // Clear search query when hiding the search box
        if (isSearchVisible) {
            setSearchQuery("");
        }
    };

    // Handle search input
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            
            {/* Main Content Area */}
            <div className="flex flex-1 relative">
                {/* Sidebar Overlay - Mobile only */}
                <div 
                    className={`fixed inset-0 bg-black transition-opacity duration-300 md:hidden z-20 ${
                        isSidebarOpen ? 'opacity-50 visible' : 'opacity-0 invisible'
                    }`} 
                    onClick={toggleSidebar}
                ></div>
                
                {/* Sidebar */}
                <div 
                    className={`fixed md:sticky top-0 left-0 h-screen bg-white md:bg-gray-50 w-72 transform transition-transform duration-300 ease-in-out z-30 shadow-lg md:shadow-none ${
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
                >
                    <div className="p-6 h-full overflow-y-auto flex flex-col">
                        {/* Sidebar Header */}
                        <div className="flex justify-between items-center mt-12 sm:mt-0 mb-2">
                            <h3 className="text-xl md:text-3xl md:mt-0">CATEGORIES</h3>
                            <button onClick={toggleSidebar} className="md:hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="h-px w-full my-4 bg-gray-200"></div>
                        
                        {/* Category Section - Updated to remove icon spaces and make text even */}
                        <div className="mb-8">
                            <div className="flex flex-col space-y-2">
                                {allCategories.map((category, index) => (
                                    <button 
                                        key={index}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setIsSidebarOpen(false);
                                        }}
                                        className={`flex items-center text-left py-3 rounded-md transition-all duration-300 ease-in-out cursor-pointer
                                            ${selectedCategory === category
                                                ? 'text-blue-600'
                                                : 'hover:text-blue-400'}
                                        `}
                                    >
                                        {categoryDisplayNames[category] || category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 px-4 md:px-8 lg:px-12 py-6">
                    {/* Header with Title, Search Icon and Menu Icon */}
                    <div className="flex justify-between items-center">
                        {/* Title with truncation for mobile */}
                        <h1 className="text-2xl">
                            <span className="md:hidden whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxWidth: '220px', display: 'inline-block' }}>
                                {categoryDisplayNames[selectedCategory] || selectedCategory}
                            </span>
                            <span className="hidden md:inline">
                                {categoryDisplayNames[selectedCategory] || selectedCategory}
                            </span>
                        </h1>
                        
                        <div className="flex items-center space-x-3">
                            {/* Mobile menu button */}
                            <button 
                                onClick={toggleSidebar} 
                                className="md:hidden rounded-md underline underline-offset-4 text-gray-500"
                            >
                                FILTERS
                            </button>
                            {/* Search Icon Button */}
                            <button
                                onClick={toggleSearch}
                                className="p-2 rounded-md transition-colors"
                                aria-label="Toggle search"
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-5 w-5 text-gray-600"
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                    {/* Product Count */}
                    <p className="text-gray-400 font-light text-xs md:text-sm mb-2">
                        Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                    </p>
                    
                    {/* Animated Search Box - shows/hides based on isSearchVisible */}
                    <div 
                        className={`transition-all duration-300 ease-in-out overflow-hidden mb-4 md:mb-6 ${
                            isSearchVisible ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-300"
                            />
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                    </div>
                    
                    {/* Products Grid with Loading State */}
                    <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
                                {[...Array(8)].map((_, index) => (
                                    <div key={index} className="animate-pulse">
                                        <div className="bg-gray-200 h-60 rounded-lg mb-3"></div>
                                        <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                                        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
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
                                <p className="text-gray-500">Try changing the filter or search keyword.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Mobile Floating Action Button for Filter */}
            <button 
                onClick={toggleSidebar}
                className="fixed bottom-6 right-6 md:hidden z-10 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
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