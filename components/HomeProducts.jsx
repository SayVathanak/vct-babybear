import React, { useState, useEffect, useRef } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import {
  CiShoppingCart,
  CiPillsBottle1,
  CiBandage,
  CiApple,
  CiMedicalCross,
  CiHeart,
  CiFilter,
  CiShop,
  CiGrid41,
  CiStar
} from "react-icons/ci";

const HomeProducts = () => {
  const { products, router } = useAppContext();
  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortOption, setSortOption] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  
  // Refs for scroll containers
  const newArrivalsRef = useRef(null);
  const recommendedRef = useRef(null);

  const categoryButtons = [
    { name: 'Baby Milk', icon: <CiPillsBottle1 className="text-xl" />, link: '/all-products' },
    { name: 'Baby Hygiene', icon: <CiMedicalCross className="text-xl" />, link: '/all-products' },
    { name: 'Diapers', icon: <CiBandage className="text-xl" />, link: '/all-products' },
    { name: 'Baby Food', icon: <CiApple className="text-xl" />, link: '/all-products' },
    { name: 'Feeding Essentials', icon: <CiShoppingCart className="text-xl" />, link: '/all-products' },
    { name: 'Bath & Care', icon: <CiHeart className="text-xl" />, link: '/all-products' }
  ];

  useEffect(() => {
    if (products && products.length > 0) {
      const sorted = [...products].sort((a, b) => {
        if (sortOption === "name") {
          return a.name?.localeCompare(b.name || '') || 0;
        } else if (sortOption === "price-low") {
          return (a.offerPrice || a.price || 0) - (b.offerPrice || b.price || 0);
        } else if (sortOption === "price-high") {
          return (b.offerPrice || b.price || 0) - (a.offerPrice || a.price || 0);
        } else if (sortOption === "newest") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        return 0;
      });
      setSortedProducts(sorted);
    }
  }, [products, sortOption]);

  const scrollLeft = (containerRef) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = (containerRef) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  const ProductScrollSection = ({ 
    title, 
    products, 
    seeAllLink, 
    containerRef,
    showFilters: showFiltersSection = false
  }) => (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl text-gray-900 flex items-center gap-2">
          {title}
        </h2>
        <div className="flex items-center gap-4">
          <Link href={seeAllLink} className="text-sm">
            See all
          </Link>
          {showFiltersSection && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
            >
              <CiFilter className="text-lg" />
            </button>
          )}
        </div>
      </div>

      {/* Products Horizontal Scroll with Peek Out Effect */}
      <div className="relative group">
        {/* Container with peek out effect */}
        <div className="overflow-hidden">
          <div 
            ref={containerRef}
            className="flex gap-3 pb-4 overflow-x-auto scrollbar-hide peek-scroll-container"
            style={{
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              // Add padding to show peek out effect
              paddingRight: '60px', // Space to show partial next card
              marginRight: '-60px'  // Negative margin to maintain container width
            }}
          >
            {products.length > 0 ? (
              products.map((product, index) => (
                <div key={product._id || index} className="flex-shrink-0 w-48 sm:w-52">
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <div className="flex-none w-full flex flex-col items-center justify-center py-16">
                <CiGrid41 className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">
                  {title === "New arrivals" ? "Loading Products..." : "No recommendations available"}
                </p>
              </div>
            )}
            
            {/* Add extra space at the end to ensure last item is fully visible */}
            <div className="flex-shrink-0 w-4"></div>
          </div>
        </div>
        
        {/* Optional: Visual indicator for more content */}
        {products.length > 2 && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-white via-white/80 to-transparent w-16 h-full flex items-center justify-end pr-2 pointer-events-none">
            <div className="w-1 h-8 bg-gray-200 rounded-full opacity-50"></div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col items-center pt-6 md:pt-12 w-full overflow-hidden">
        {/* Scrolling Text Animation */}
        <div className="w-full overflow-hidden py-3 mb-2">
          <div className="marquee-container">
            <div className="animate-marquee">
              <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
                Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
              </p>
              <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
                Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
              </p>
              <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
                Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
              </p>
              <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
                Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
              </p>
              <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
                Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl md:mx-auto w-full px-4">
          {/* Category Navigation Buttons */}
          <div className="w-full overflow-x-auto mb-2">
            <div className="flex space-x-2 py-2 min-w-max">
              {categoryButtons.map((button, index) => (
                <Link href={button.link} key={index}>
                  <button className="px-4 py-2 rounded-sm bg-sky-50 text-sky-300 transition-all flex items-center gap-2 whitespace-nowrap">
                    <span className="p-1 rounded-sm">{button.icon}</span> 
                    {button.name}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSortOption("name")}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${sortOption === "name"
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-sky-300"
                    }`}
                >
                  Name
                </button>
                <button
                  onClick={() => setSortOption("price-low")}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${sortOption === "price-low"
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-sky-300"
                    }`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => setSortOption("price-high")}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${sortOption === "price-high"
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-sky-300"
                    }`}
                >
                  Price: High to Low
                </button>
                <button
                  onClick={() => setSortOption("newest")}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${sortOption === "newest"
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-sky-300"
                    }`}
                >
                  Newest
                </button>
              </div>
            </div>
          )}

          {/* New Arrivals Section */}
          <ProductScrollSection
            title="New arrivals"
            products={sortedProducts.slice(0, 10)}
            seeAllLink="/all-products"
            containerRef={newArrivalsRef}
            showFilters={true}
          />

          {/* Recommended Section */}
          <div className="border-t border-gray-100 pt-4">
            <ProductScrollSection
              title="Recommended for you"
              products={sortedProducts.slice(10, 15)}
              seeAllLink="/recommendations"
              containerRef={recommendedRef}
            />
          </div>
        </div>
      </div>

      {/* Custom CSS for scrollbar hiding and peek effect */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Ensure smooth scrolling works */
        .scrollbar-hide {
          scroll-behavior: smooth;
        }
        
        /* Peek scroll container specific styles */
        .peek-scroll-container {
          /* Ensure the scrolling behavior is smooth */
          scroll-snap-type: x mandatory;
        }
        
        .peek-scroll-container > div {
          /* Optional: Add scroll snap for better UX */
          scroll-snap-align: start;
        }
        
        /* Add some padding to prevent content cutoff */
        .group:hover .opacity-0 {
          opacity: 1;
        }
        
        /* Responsive peek out adjustments */
        @media (max-width: 640px) {
          .peek-scroll-container {
            padding-right: 40px !important;
            margin-right: -40px !important;
          }
        }
      `}</style>
    </>
  );
};

export default HomeProducts;