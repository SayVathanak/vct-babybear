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
  CiShop
} from "react-icons/ci";

const HomeProducts = () => {
  const { products, router } = useAppContext();
  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortOption, setSortOption] = useState("name");

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
          // Fix: Use product.name instead of product.title
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

      {/* Category Navigation Buttons */}
      <div className="w-full overflow-x-auto mb-2">
        <div className="flex space-x-4 py-2 min-w-max">
          {categoryButtons.map((button, index) => (
            <Link href={button.link} key={index}>
              <button className="px-4 py-2 rounded-sm bg-sky-50 text-sky-300 transition-all flex items-center gap-2">
                <span className="p-1 rounded-sm">{button.icon}</span> {button.name}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products Section */}
      {/* <h2 className="text-2xl text-blue-500 self-start mb-6 flex items-center gap-2">
        <CiShop className="text-2xl" /> Let's start shopping
      </h2> */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 pb-10 w-full">
        {sortedProducts.length > 0 ? (
          sortedProducts.slice(0, 10).map((product, index) => (
            <ProductCard key={product._id || index} product={product} />
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-8">Loading Products...</p>
        )}
      </div>

      <button
        onClick={() => {
          router.push("/all-products");
        }}
        className="px-12 py-3 text-sm font-medium rounded-full bg-sky-300 text-white transition-all shadow-md mb-12 flex items-center gap-2"
      >
        <CiShoppingCart className="text-lg" /> View All Products
      </button>
    </div>
  );
};

export default HomeProducts;