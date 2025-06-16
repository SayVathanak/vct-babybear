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
  CiGrid41,
} from "react-icons/ci";

// Debounce utility to limit how often a function can run
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const ProductScrollSection = ({
  title,
  products,
  seeAllLink,
  sectionId // Unique ID for saving scroll position
}) => {
  const containerRef = useRef(null);

  // Effect to save the scroll position to sessionStorage on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = debounce(() => {
      if (container) {
        sessionStorage.setItem(`scrollPos-${sectionId}`, container.scrollLeft);
      }
    }, 200);

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [sectionId]);

  // Effect to restore the scroll position
  useEffect(() => {
    if (!products || products.length === 0) return;

    const savedScrollPos = sessionStorage.getItem(`scrollPos-${sectionId}`);
    if (containerRef.current && savedScrollPos) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = parseInt(savedScrollPos, 10);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sectionId, products]);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-medium flex items-center gap-2">
          {title}
        </h2>
        <Link href={seeAllLink} className="font-prata text-sm text-sky-300 hover:underline">
          See all
        </Link>
      </div>

      <div className="relative group">
        <div className="overflow-x-auto scrollbar-hide">
          {/* MODIFICATION: Added padding for peek-out effect and adjusted gap */}
          <div
            ref={containerRef}
            className="flex gap-1.5 pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {products.length > 0 ? (
              products.map((product, index) => (
                // MODIFICATION: Card width is now responsive for the peek-out effect.
                <div key={product._id || index} className="flex-shrink-0 w-[45%] sm:w-52" style={{ scrollSnapAlign: 'start' }}>
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <div className="flex-none w-full flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg">
                <CiGrid41 className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">
                  Loading products...
                </p>
              </div>
            )}
            {/* Padding element to ensure the last card can be scrolled fully into view */}
            <div className="flex-shrink-0 w-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};


const HomeProducts = () => {
  const { products } = useAppContext();
  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortOption, setSortOption] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const categoryButtons = [
    { name: 'Baby Milk', icon: <CiPillsBottle1 className="text-md md:text-xl" />, link: '/all-products?category=PowderedMilk' },
    { name: 'Hygiene', icon: <CiMedicalCross className="text-md md:text-xl" />, link: '/all-products?category=Accessories' },
    { name: 'Diapers', icon: <CiBandage className="text-md md:text-xl" />, link: '/all-products?category=Diapers' },
    { name: 'Vitamins', icon: <CiApple className="text-md md:text-xl" />, link: '/all-products?category=Vitamins' },
    { name: 'Feeding', icon: <CiShoppingCart className="text-md md:text-xl" />, link: '/all-products?category=FeedingTools' },
    { name: 'Bath & Body Care', icon: <CiHeart className="text-md md:text-xl" />, link: '/all-products?category=BathBodyCare' }
  ];

  const getProductsByCategory = (categories) => {
    if (!products) return [];
    const cats = Array.isArray(categories) ? categories : [categories];
    return products.filter(product => cats.includes(product.category));
  };

  useEffect(() => {
    if (products && products.length > 0) {
      const sorted = [...products].sort((a, b) => {
        switch (sortOption) {
          case "name":
            return a.name?.localeCompare(b.name || '') || 0;
          case "price-low":
            return (a.offerPrice || a.price || 0) - (b.offerPrice || b.price || 0);
          case "price-high":
            return (b.offerPrice || b.price || 0) - (a.offerPrice || a.price || 0);
          case "newest":
          default:
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
      });
      setSortedProducts(sorted);
    }
  }, [products, sortOption]);

  const productSections = [
    { id: 'parent-favorites', title: "Parent Favorites", categories: ['PowderedMilk', 'LiquidMilk', 'Vitamins', 'Diapers'], seeAllLink: "/all-products" },
    { id: 'feeding-essentials', title: "Feeding Essentials", categories: ['FeedingTools', 'Bottles'], seeAllLink: "/all-products?category=FeedingTools" },
    { id: 'play-learn', title: "Play & Learn", categories: ['Toys', 'Accessories'], seeAllLink: "/all-products?category=Toys" },
    { id: 'bath-care', title: "Bath & Body Care", categories: ['BathBodyCare', 'NurseryItems', 'Diapers'], seeAllLink: "/all-products?category=BathBodyCare" },
    { id: 'on-the-go', title: "On-the-Go", categories: ['Tumblers', 'Bottles'], seeAllLink: "/all-products?category=Tumblers" },
    { id: 'new-arrivals', title: "New Arrivals", products: sortedProducts.slice(0, 10), seeAllLink: "/all-products" }
  ];

  return (
    <>
      <div className="w-full bg-white overflow-hidden">
        <div className="w-full overflow-hidden py-3 font-prata">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-md md:text-lg text-sky-200 mx-2">
              Premium USA-imported milk and baby essentials for your family.
            </span>
            <span className="text-md md:text-lg text-sky-200 mx-2">
              Pure, nutritious, and trusted by parents everywhere.
            </span>
            <span className="text-md md:text-lg text-sky-200 mx-2">
              Premium USA-imported milk and baby essentials for your family.
            </span>
            <span className="text-md md:text-lg text-sky-200 mx-2">
              Pure, nutritious, and trusted by parents everywhere.
            </span>
          </div>
        </div>
        {/* MODIFICATION: Removed max-w-7xl and mx-auto to allow full-width scroll on mobile */}
        <div className="w-full">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 py-4 sm:px-6 lg:px-8 min-w-max">
              {categoryButtons.map((button, index) => (
                <Link href={button.link} key={index}>
                  <div className="px-4 py-2 border rounded-full bg-white transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer">
                    <span className="p-0.5 md:p-1 rounded-md bg-white">{button.icon}</span>
                    <span className="font-medium text-xs md:text-sm">{button.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {productSections.map(section => (
            <ProductScrollSection
              key={section.id}
              sectionId={section.id}
              title={section.title}
              products={section.products || getProductsByCategory(section.categories).slice(0, 10)}
              seeAllLink={section.seeAllLink}
            />
          ))}

        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </>
  );
};

export default HomeProducts;
