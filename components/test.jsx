import React, { useState, useEffect } from "react";
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

    const categoryButtons = [
        { name: 'Baby Milk', icon: <CiPillsBottle1 className="text-xl" />, link: '/all-products', color: 'bg-blue-50 text-blue-600 border-blue-200' },
        { name: 'Baby Hygiene', icon: <CiMedicalCross className="text-xl" />, link: '/all-products', color: 'bg-green-50 text-green-600 border-green-200' },
        { name: 'Diapers', icon: <CiBandage className="text-xl" />, link: '/all-products', color: 'bg-purple-50 text-purple-600 border-purple-200' },
        { name: 'Baby Food', icon: <CiApple className="text-xl" />, link: '/all-products', color: 'bg-orange-50 text-orange-600 border-orange-200' },
        { name: 'Feeding Essentials', icon: <CiShoppingCart className="text-xl" />, link: '/all-products', color: 'bg-pink-50 text-pink-600 border-pink-200' },
        { name: 'Bath & Care', icon: <CiHeart className="text-xl" />, link: '/all-products', color: 'bg-red-50 text-red-600 border-red-200' }
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

    return (
        <div className="min-h-screen bg-gray-50">
            <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .snap-x {
          scroll-snap-type: x mandatory;
        }
        .snap-start {
          scroll-snap-align: start;
        }
      `}</style>
            {/* Hero Section with Scrolling Text */}
            <div className="bg-gradient-to-r from-sky-400 to-blue-500 text-white">
                <div className="w-full overflow-hidden py-4">
                    <div className="marquee-container">
                        <div className="animate-marquee">
                            <p className="whitespace-nowrap pr-10 text-lg font-medium">
                                Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
                            </p>
                            <p className="whitespace-nowrap pr-10 text-lg font-medium">
                                Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
                            </p>
                            <p className="whitespace-nowrap pr-10 text-lg font-medium">
                                Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Categories Section */}
                <div className="py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
                        <Link href="/categories" className="text-sky-600 hover:text-sky-700 text-sm font-medium">
                            See all
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categoryButtons.map((button, index) => (
                            <Link href={button.link} key={index}>
                                <div className={`${button.color} border rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer group`}>
                                    <div className="flex flex-col items-center text-center space-y-2">
                                        <div className="p-2 rounded-lg bg-white/50 group-hover:bg-white/80 transition-colors">
                                            {button.icon}
                                        </div>
                                        <span className="text-sm font-medium">{button.name}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* New Arrivals Section */}
                <div className="py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <CiStar className="text-yellow-500" />
                            New arrivals
                        </h2>
                        <div className="flex items-center gap-4">
                            <Link href="/all-products" className="text-sky-600 hover:text-sky-700 text-sm font-medium">
                                See all
                            </Link>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
                            >
                                <CiFilter className="text-lg" />
                                Filter
                            </button>
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

                    {/* Products Horizontal Scroll */}
                    <div className="relative mb-8">
                        <div className="flex overflow-x-auto scrollbar-hide gap-4 pb-4 snap-x snap-mandatory">
                            {sortedProducts.length > 0 ? (
                                sortedProducts.slice(0, 10).map((product, index) => (
                                    <div key={product._id || index} className="flex-none w-48 sm:w-56 snap-start">
                                        <ProductCard product={product} />
                                    </div>
                                ))
                            ) : (
                                <div className="flex-none w-full flex flex-col items-center justify-center py-16">
                                    <CiGrid41 className="text-6xl text-gray-300 mb-4" />
                                    <p className="text-gray-500 text-lg">Loading Products...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* View All Products Button */}
                    {sortedProducts.length > 0 && (
                        <div className="text-center">
                            <button
                                onClick={() => router.push("/all-products")}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-full transition-colors duration-200 shadow-sm hover:shadow-md"
                            >
                                <CiShoppingCart className="text-lg" />
                                View All Products
                            </button>
                        </div>
                    )}
                </div>

                {/* Recommended Section */}
                <div className="py-8 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Recommended for you</h2>
                        <Link href="/recommendations" className="text-sky-600 hover:text-sky-700 text-sm font-medium">
                            See all
                        </Link>
                    </div>

                    <div className="relative">
                        <div className="flex overflow-x-auto scrollbar-hide gap-4 pb-4 snap-x snap-mandatory">
                            {sortedProducts.length > 0 ? (
                                sortedProducts.slice(10, 15).map((product, index) => (
                                    <div key={product._id || index} className="flex-none w-48 sm:w-56 snap-start">
                                        <ProductCard product={product} />
                                    </div>
                                ))
                            ) : (
                                <div className="flex-none w-full text-center py-8">
                                    <p className="text-gray-500">No recommendations available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeProducts;