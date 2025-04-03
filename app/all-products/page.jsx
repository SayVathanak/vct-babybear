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
  
  // Category icons mapping
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
  
  // Get unique categories
  const allCategories = ["All Product", ...new Set(products.map(product => product.category).filter(cat => cat !== "All"))];
  
  // Filter products based on criteria
  useEffect(() => {
    setIsLoading(true);
    
    const filterProducts = () => {
      // Start with all products
      let result = products;
      
      // Apply category filter
      if (selectedCategory !== "All Product") {
        result = result.filter(product => product.category === selectedCategory);
      }
      
      // Apply price filter
      result = result.filter(product => 
        product.offerPrice >= priceRange[0] && product.offerPrice <= priceRange[1]
      );
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(product => 
          product.name.toLowerCase().includes(query) || 
          (product.description && product.description.toLowerCase().includes(query))
        );
      }
      
      return result;
    };
    
    // Small delay for better UX
    const timer = setTimeout(() => {
      setFilteredProducts(filterProducts());
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedCategory, priceRange, searchQuery, products]);

  // Handler functions
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setIsSidebarOpen(false);
  };
  
  const handlePriceChange = (min, max) => {
    setPriceRange([min, max]);
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-50">
      <Navbar />
      
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside 
          className={`fixed md:sticky top-0 left-0 h-screen bg-white w-72 transform transition-transform duration-300 ease-in-out z-30 shadow-lg md:shadow-sm ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-6 h-full overflow-y-auto flex flex-col">
            {/* Sidebar Header */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-prata text-sky-800">Categories</h3>
              <button onClick={toggleSidebar} className="md:hidden text-sky-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>      
            <div className="w-12 h-0.5 bg-sky-200 rounded-full mb-6"></div>
            
            {/* Search Box */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm border border-sky-100"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 hover:text-sky-600">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Categories */}
            <div className="mb-8">
              <div className="flex flex-col space-y-2">
                {allCategories.map((category) => (
                  <button 
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`flex items-center text-left px-3 py-2.5 rounded-md transition-all ${
                      selectedCategory === category 
                        ? 'bg-sky-100 text-sky-700 font-medium' 
                        : 'hover:bg-sky-50 text-gray-700'
                    }`}
                  >
                    <span className="mr-3 text-sky-600">
                      {categoryIcons[category] || categoryIcons["All Product"]}
                    </span>
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Price Range Filter */}
            <div>
              <h4 className="text-lg font-medium font-prata mb-2 text-sky-800">Price Range</h4>
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
                      onChange={(e) => handlePriceChange(parseInt(e.target.value), priceRange[1])}
                      className="w-full border border-sky-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-sky-300 focus:outline-none"
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-sm text-gray-600 block mb-1">Max ($)</label>
                    <input 
                      type="number" 
                      min={priceRange[0]}
                      max="1000"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange(priceRange[0], parseInt(e.target.value))}
                      className="w-full border border-sky-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-sky-300 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="h-2 bg-sky-100 rounded-full mb-2 relative">
                  <div 
                    className="h-2 bg-sky-400 rounded-full absolute"
                    style={{
                      left: `${(priceRange[0] / 200) * 100}%`,
                      right: `${100 - (priceRange[1] / 200) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sky-700 text-xs">${priceRange[0]}</span>
                  <span className="text-sky-700 text-xs">${priceRange[1]}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 md:hidden z-20" 
            onClick={toggleSidebar}
          ></div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 px-4 md:px-8 lg:px-12 py-6 bg-white md:bg-sky-50">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-prata text-sky-800">{selectedCategory}</h1>
            
            {/* Mobile search */}
            <div className="md:hidden relative flex-1 mx-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-sm border border-sky-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-300"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
            
            {/* Sidebar toggle button */}
            <button 
              onClick={toggleSidebar} 
              className="md:hidden p-2 hover:bg-sky-50 rounded-md text-sky-700"
              aria-label="Toggle filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {/* Results info */}
          <div className="flex flex-wrap items-center justify-between mb-6">
            <p className="text-sky-700 text-sm">
              {searchQuery ? (
                <>Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} for "{searchQuery}"</>
              ) : (
                <>Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</>
              )}
            </p>
            <p className="md:hidden text-sky-700 text-sm">
              Price: ${priceRange[0]} - ${priceRange[1]}
            </p>
          </div>
          
          {/* Products Grid */}
          <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white p-4 rounded-lg shadow-sm">
                    <div className="bg-sky-100 h-40 md:h-48 rounded-lg mb-3"></div>
                    <div className="bg-sky-100 h-4 rounded w-3/4 mb-2"></div>
                    <div className="bg-sky-100 h-4 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product, index) => (
                  <div 
                    key={index} 
                    className="opacity-0 animate-fadeIn bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow" 
                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-sky-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 15h8"></path>
                  <path d="M9 9h.01"></path>
                  <path d="M15 9h.01"></path>
                </svg>
                <h3 className="text-lg font-medium text-sky-800 mb-2">No products found</h3>
                <p className="text-sky-600">
                  {searchQuery ? 
                    `No results for "${searchQuery}". Try a different search term or adjust your filters.` : 
                    'Try adjusting your filters to see products'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Mobile Filter Button */}
      <button 
        onClick={toggleSidebar}
        className="fixed bottom-6 left-6 md:hidden z-10 bg-sky-600 text-white p-3 rounded-full shadow-lg hover:bg-sky-700 transition-colors"
        aria-label="Open filters"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
      </button>
      
      <Footer />
      
      {/* Animation styles */}
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