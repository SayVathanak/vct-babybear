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
  CiStar,
  CiSquareChevLeft,
  CiSquareChevRight
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

      {/* Products Horizontal Scroll */}
      <div className="relative group">
        {/* Left scroll button */}
        <button
          onClick={() => scrollLeft(containerRef)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50 -ml-4"
        >
          <CiSquareChevLeft className="text-xl text-gray-600" />
        </button>

        {/* Right scroll button */}
        <button
          onClick={() => scrollRight(containerRef)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50 -mr-4"
        >
          <CiSquareChevRight className="text-xl text-gray-600" />
        </button>

        {/* Scrollable container */}
        <div 
          ref={containerRef}
          className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide"
          style={{
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
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
        </div>
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

        <div className="max-w-7xl md:mx-auto px-4 w-full">
          {/* Category Navigation Buttons */}
          <div className="w-full overflow-x-auto mb-2">
            <div className="flex space-x-4 py-2 min-w-max">
              {categoryButtons.map((button, index) => (
                <Link href={button.link} key={index}>
                  <button className="px-4 py-2 rounded-sm bg-sky-50 text-sky-300 transition-all flex items-center gap-2 hover:text-sky-400 whitespace-nowrap">
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

      {/* Custom CSS for scrollbar hiding - This is crucial for the scroll to work */}
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
        
        /* Add some padding to prevent content cutoff */
        .group:hover .opacity-0 {
          opacity: 1;
        }
      `}</style>
    </>
  );
};

export default HomeProducts;