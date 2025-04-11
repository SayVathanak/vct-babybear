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
    
    const categoryIcons = {
            "All": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            ),
            "PowderedMilk": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"></path>
                    <path d="M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"></path>
                    <path d="M8 12h8"></path>
                    <path d="M10 16h4"></path>
                </svg>
            ),
            "LiquidMilk": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2h8"></path>
                    <path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2"></path>
                    <path d="M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0"></path>
                </svg>
            ),
            "Bottles": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 2h6"></path>
                    <path d="M12 2v4"></path>
                    <path d="M8 8h8l-1 13a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1L8 8Z"></path>
                    <path d="M7 11h10"></path>
                </svg>
            ),
            "Tumblers": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 8h8"></path>
                    <path d="M8 8v11a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V8"></path>
                    <path d="M8 8a4 4 0 0 1 8 0"></path>
                    <path d="M14 3.5c0 1.5-.7 2.5-2 2.5s-2-1-2-2.5.7-2.5 2-2.5 2 1 2 2.5z"></path>
                </svg>
            ),
            "FeedingTools": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2v20l3-2 3 2 3-2 3 2V2"></path>
                    <path d="M4 11h16"></path>
                    <path d="M4 15h16"></path>
                </svg>
            ),
            "Accessories": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M9.5 9a2.5 2.5 0 0 1 5 0v4.5"></path>
                </svg>
            ),
            "Vitamins": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="7"></circle>
                    <path d="M12 9v6"></path>
                    <path d="M9 12h6"></path>
                </svg>
            ),
            "Diapers": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s-8-2-8-16h16c0 14-8 16-8 16z"></path>
                    <path d="M8 6h8"></path>
                    <path d="M8 10h8"></path>
                    <path d="M8 14h8"></path>
                </svg>
            ),
            "NurseryItems": (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"></path>
                    <path d="M4 10h16"></path>
                    <path d="M12 10v8"></path>
                    <path d="M8 14h8"></path>
                </svg>
            )
        };
    
    // Get unique categories from products and add "All" option
    const allCategories = ["All", ...new Set(products.map(product => product.category))];
    
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
                        <div className="flex justify-between items-center mt-12 sm:mt-0 mb-8">
                            <h3 className="text-2xl md:text-3xl md:mt-0">Categories</h3>
                            <button onClick={toggleSidebar} className="md:hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
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
                                        className={`flex items-center text-left px-4 py-3 rounded-md transition-all duration-300 ease-in-out cursor-pointer
                                            ${selectedCategory === category
                                                ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                                                : 'hover:bg-sky-100 hover:text-sky-600'}
                                        `}
                                    >
                                        <span className="mr-3">
                                            {categoryIcons[category] || categoryIcons["All"]}
                                        </span>
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
                    <div className="flex justify-between items-center md:mb-4">
                        <h1 className="text-2xl">{categoryDisplayNames[selectedCategory] || selectedCategory}</h1>
                        
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
                    <p className="text-gray-500 text-xs md:text-sm mb-2">
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
                    
                    {/* Product Count */}
                    {/* <p className="text-gray-500 text-sm mb-6">
                        Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                    </p> */}
                    
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