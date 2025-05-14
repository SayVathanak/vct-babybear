// 'use client'
// import { useState, useEffect } from "react";
// import ProductCard from "@/components/ProductCard";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import { useAppContext } from "@/context/AppContext";
// import { MdFilterAlt } from 'react-icons/md';

// const AllProducts = () => {
//     const { products } = useAppContext();
//     const [selectedCategory, setSelectedCategory] = useState("All");
//     const [filteredProducts, setFilteredProducts] = useState([]);
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [sortOption, setSortOption] = useState("newest");
//     const [searchQuery, setSearchQuery] = useState("");
//     const [isSearchVisible, setIsSearchVisible] = useState(false);
    
//     // Category mapping for display names and icons
//     const categoryDisplayNames = {
//         "All": "All Products",
//         "PowderedMilk": "Formula & Powdered Milk",
//         "LiquidMilk": "Ready-to-Feed Milk",
//         "Bottles": "Bottles & Sippy Cups",
//         "Tumblers": "Toddler Tumblers & Cups",
//         "FeedingTools": "Feeding Sets & Utensils",
//         "Accessories": "Baby Essentials & Accessories",
//         "Vitamins": "Nutrition & Supplements",
//         "Diapers": "Diapers & Wipes",
//         "NurseryItems": "Nursery & Sleep Essentials"
//     };
    
//     // Commented out all the icon definitions
//     /*
//     const categoryIcons = {
//             "All": (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <rect x="3" y="3" width="7" height="7"></rect>
//                     <rect x="14" y="3" width="7" height="7"></rect>
//                     <rect x="14" y="14" width="7" height="7"></rect>
//                     <rect x="3" y="14" width="7" height="7"></rect>
//                 </svg>
//             ),
//             "PowderedMilk": (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M6 8h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"></path>
//                     <path d="M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"></path>
//                     <path d="M8 12h8"></path>
//                     <path d="M10 16h4"></path>
//                 </svg>
//             ),
//             // ... other icons
//     };
//     */
    
//     // Get unique categories from products and add "All" option
//     const allCategories = ["All", ...new Set(products.map(product => product.category))];
    
//     // Filter and sort products when category, sort option, or search query changes
//     useEffect(() => {
//         setIsLoading(true);
        
//         // Filter by category and search query
//         let result = [...products];
        
//         // Apply category filter
//         if (selectedCategory !== "All") {
//             result = result.filter(product => product.category === selectedCategory);
//         }
        
//         // Apply search filter
//         if (searchQuery.trim() !== "") {
//             const query = searchQuery.toLowerCase();
//             result = result.filter(product =>
//                 product.name.toLowerCase().includes(query) ||
//                 (product.description && product.description.toLowerCase().includes(query))
//             );
//         }
        
//         // Sort products
//         switch (sortOption) {
//             case "priceAsc":
//                 result.sort((a, b) => a.offerPrice - b.offerPrice);
//                 break;
//             case "priceDesc":
//                 result.sort((a, b) => b.offerPrice - a.offerPrice);
//                 break;
//             case "newest":
//                 // Assuming we have a createdAt field, otherwise this is a placeholder
//                 result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
//                 break;
//             case "popular":
//                 // Placeholder for popularity sorting - could be based on sales or views
//                 break;
//             default:
//                 break;
//         }
        
//         // Simulate loading for smooth transitions
//         setTimeout(() => {
//             setFilteredProducts(result);
//             setIsLoading(false);
//         }, 300);
//     }, [selectedCategory, sortOption, products, searchQuery]);

//     // Toggle sidebar
//     const toggleSidebar = () => {
//         setIsSidebarOpen(!isSidebarOpen);
//     };

//     // Toggle search visibility
//     const toggleSearch = () => {
//         setIsSearchVisible(!isSearchVisible);
//         // Clear search query when hiding the search box
//         if (isSearchVisible) {
//             setSearchQuery("");
//         }
//     };

//     // Handle search input
//     const handleSearchChange = (e) => {
//         setSearchQuery(e.target.value);
//     };

//     return (
//         <div className="min-h-screen flex flex-col">
//             <Navbar />
            
//             {/* Main Content Area */}
//             <div className="flex flex-1 relative">
//                 {/* Sidebar Overlay - Mobile only */}
//                 <div
//                     className={`fixed inset-0 bg-black transition-opacity duration-300 md:hidden z-20 ${
//                         isSidebarOpen ? 'opacity-50 visible' : 'opacity-0 invisible'
//                     }`}
//                     onClick={toggleSidebar}
//                 ></div>
                
//                 {/* Sidebar */}
//                 <div
//                     className={`fixed md:sticky top-0 left-0 h-screen bg-white md:bg-gray-50 w-72 transform transition-transform duration-300 ease-in-out z-30 shadow-lg md:shadow-none ${
//                         isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
//                     }`}
//                 >
//                     <div className="p-6 h-full overflow-y-auto flex flex-col">
//                         {/* Sidebar Header */}
//                         <div className="flex justify-between items-center mt-12 sm:mt-0 mb-2">
//                             <h3 className="text-xl md:text-3xl md:mt-0">CATEGORIES</h3>
//                             <button onClick={toggleSidebar} className="md:hidden">
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                     <line x1="18" y1="6" x2="6" y2="18"></line>
//                                     <line x1="6" y1="6" x2="18" y2="18"></line>
//                                 </svg>
//                             </button>
//                         </div>

//                         {/* <div className="h-1 bg-black w-full my-4 rounded-full bg-gradient-to-r from-blue-300 via-blue-600 to-purple-600 shadow-sm"></div> */}
//                         <div className="h-px w-full my-4 bg-gray-200"></div>
                        
//                         {/* Category Section - Updated to remove icon spaces and make text even */}
//                         <div className="mb-8">
//                             <div className="flex flex-col space-y-2">
//                                 {allCategories.map((category, index) => (
//                                     <button
//                                         key={index}
//                                         onClick={() => {
//                                             setSelectedCategory(category);
//                                             setIsSidebarOpen(false);
//                                         }}
//                                         className={`flex items-center text-left py-3 rounded-md transition-all duration-300 ease-in-out cursor-pointer
//                                             ${selectedCategory === category
//                                                 ? 'text-blue-600'
//                                                 : 'hover:text-blue-400'}
//                                         `}
//                                     >
//                                         {/* Icon section removed */}
//                                         {categoryDisplayNames[category] || category}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
                
//                 {/* Main Content */}
//                 <div className="flex-1 px-4 md:px-8 lg:px-12 py-6">
//                     {/* Header with Title, Search Icon and Menu Icon */}
//                     <div className="flex justify-between items-center">
//                         <h1 className="text-2xl">{categoryDisplayNames[selectedCategory] || selectedCategory}</h1>
                        
//                         <div className="flex items-center space-x-3">
//                             {/* Mobile menu button */}
//                             <button
//                                 onClick={toggleSidebar}
//                                 className="md:hidden rounded-md underline underline-offset-4 text-gray-500"
//                             >
//                                 FILTERS
//                             </button>
//                             {/* Search Icon Button */}
//                             <button
//                                 onClick={toggleSearch}
//                                 className="p-2 rounded-md transition-colors"
//                                 aria-label="Toggle search"
//                             >
//                                 <svg
//                                     xmlns="http://www.w3.org/2000/svg"
//                                     className="h-5 w-5 text-gray-600"
//                                     viewBox="0 0 24 24"
//                                     fill="none"
//                                     stroke="currentColor"
//                                     strokeWidth="2"
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                 >
//                                     <circle cx="11" cy="11" r="8"></circle>
//                                     <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
//                                 </svg>
//                             </button>
//                         </div>
//                     </div>
//                     {/* Product Count */}
//                     <p className="text-gray-400 font-light text-xs md:text-sm mb-2">
//                         Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
//                     </p>
                    
//                     {/* Animated Search Box - shows/hides based on isSearchVisible */}
//                     <div
//                         className={`transition-all duration-300 ease-in-out overflow-hidden mb-4 md:mb-6 ${
//                             isSearchVisible ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
//                         }`}
//                     >
//                         <div className="relative">
//                             <input
//                                 type="text"
//                                 placeholder="Search products..."
//                                 value={searchQuery}
//                                 onChange={handleSearchChange}
//                                 className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-300"
//                             />
//                             <svg
//                                 xmlns="http://www.w3.org/2000/svg"
//                                 className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//                                 viewBox="0 0 24 24"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 strokeWidth="2"
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                             >
//                                 <circle cx="11" cy="11" r="8"></circle>
//                                 <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
//                             </svg>
//                         </div>
//                     </div>
                    
//                     {/* Products Grid with Loading State */}
//                     <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
//                         {isLoading ? (
//                             <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
//                                 {[...Array(8)].map((_, index) => (
//                                     <div key={index} className="animate-pulse">
//                                         <div className="bg-gray-200 h-60 rounded-lg mb-3"></div>
//                                         <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
//                                         <div className="bg-gray-200 h-4 rounded w-1/2"></div>
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : filteredProducts.length > 0 ? (
//                             <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
//                                 {filteredProducts.map((product, index) => (
//                                     <div
//                                         key={index}
//                                         className="opacity-0 animate-fadeIn"
//                                         style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
//                                     >
//                                         <ProductCard product={product} />
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : (
//                             <div className="text-center py-16">
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
//                                     <circle cx="12" cy="12" r="10"></circle>
//                                     <path d="M8 15h8"></path>
//                                     <path d="M9 9h.01"></path>
//                                     <path d="M15 9h.01"></path>
//                                 </svg>
//                                 <h3 className="text-lg font-medium text-gray-600 mb-2">No products found</h3>
//                                 <p className="text-gray-500">Try changing the filter or search keyword.</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
            
//             {/* Mobile Floating Action Button for Filter */}
//             <button
//                 onClick={toggleSidebar}
//                 className="fixed bottom-6 right-6 md:hidden z-10 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
//             >
//                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
//                 </svg>
//             </button>
            
//             <Footer />
            
//             {/* Add global styles for animations */}
//             <style jsx global>{`
//                 @keyframes fadeIn {
//                     from { opacity: 0; transform: translateY(10px); }
//                     to { opacity: 1; transform: translateY(0); }
//                 }
//                 .animate-fadeIn {
//                     animation: fadeIn 0.5s ease-out;
//                 }
//             `}</style>
//         </div>
//     );
// };

// export default AllProducts;

"use client";
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import ProductFilter from "@/components/ProductFilter";

const AllProducts = () => {
    const { products } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortOption, setSortOption] = useState("newest");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
    const [selectedBrands, setSelectedBrands] = useState([]);

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

    // Apply filters and sorting
    useEffect(() => {
        setIsLoading(true);

        // Start with all products
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

        // Simulate loading for smooth transitions
        setTimeout(() => {
            setFilteredProducts(result);
            setIsLoading(false);
        }, 300);
    }, [selectedCategory, sortOption, products, searchQuery, priceRange, selectedBrands]);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-medium text-blue-500">Baby Essentials</h1>

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:block">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="newest">Newest</option>
                                <option value="priceAsc">Price: Low to High</option>
                                <option value="priceDesc">Price: High to Low</option>
                                <option value="popular">Popularity</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden px-3 py-2 border border-gray-300 rounded-md text-sm flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm0 8a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm0 8a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1z" />
                            </svg>
                            Filters
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
                        className={`lg:w-64 shrink-0 bg-white lg:bg-transparent fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto p-6 overflow-y-auto shadow-lg lg:shadow-none transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-6 lg:hidden">
                            <h2 className="text-lg font-medium">Filters</h2>
                            <button onClick={() => setIsSidebarOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
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
                                    onChange={(e) => setSearchQuery(e.target.value)}
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