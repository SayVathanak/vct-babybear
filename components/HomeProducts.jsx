import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
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
import { AiOutlineLoading } from "react-icons/ai";
import { FiChevronRight } from "react-icons/fi";

// Enhanced debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// Animation variants
const sectionVariants = {
  hidden: { 
    opacity: 0, 
    y: 30 // Reduced for mobile
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5, // Faster for mobile
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    x: 30 // Reduced for mobile
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4, // Faster for mobile
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const categoryButtonVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

const ProductScrollSection = ({
  title,
  products,
  seeAllLink,
  sectionId,
  index
}) => {
  const containerRef = useRef(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { 
    once: true, 
    margin: "-50px 0px" // Reduced margin for mobile
  });

  // Parallax effect for section headers (disabled on mobile for performance)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -25]); // Reduced effect
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  // Save and restore scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = debounce(() => {
      if (container) {
        sessionStorage.setItem(`scrollPos-${sectionId}`, container.scrollLeft);
      }
    }, 200);

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sectionId]);

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
    <motion.div 
      ref={sectionRef}
      className="pt-4 md:pt-6 px-0"
      variants={sectionVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      style={{ 
        y: window.innerWidth > 768 ? y : 0, // Disable parallax on mobile
        opacity: window.innerWidth > 768 ? opacity : 1 
      }}
    >
      <motion.div 
        className="flex items-center justify-between mb-4 md:mb-6"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.15
            }
          }
        }}
      >
        <motion.h2 
          className="text-lg sm:text-xl md:text-2xl text-sky-300 opacity-80 flex items-center gap-2"
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { 
              opacity: 1, 
              x: 0,
              transition: {
                duration: 0.5,
                ease: "easeOut"
              }
            }
          }}
        >
          {title}
        </motion.h2>
        
        <motion.div
          variants={{
            hidden: { opacity: 0, x: 20 },
            visible: { 
              opacity: 1, 
              x: 0,
              transition: {
                duration: 0.5,
                ease: "easeOut"
              }
            }
          }}
        >
          <Link href={seeAllLink}>
            <motion.div
              className="font-prata text-xs sm:text-sm text-sky-300 hover:text-sky-200 flex items-center gap-1 group"
              whileTap={{ opacity: 0.8 }}
            >
              <span>See all</span>
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronRight className="text-xs sm:text-sm group-hover:text-sky-200" />
              </motion.div>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>

      <div className="relative group mx-0">
        <div className="overflow-x-auto px-0">
          <motion.div
            ref={containerRef}
            className="flex gap-3 md:gap-4 pb-2"
            style={{ scrollSnapType: 'x mandatory' }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 0.1
                }
              }
            }}
          >
            <AnimatePresence>
              {products && products.length > 0 ? (
                products.map((product, idx) => (
                  <motion.div 
                    key={product._id || idx} 
                    className="flex-shrink-0 w-36 xs:w-40 sm:w-44 md:w-52" 
                    style={{ scrollSnapAlign: 'start' }}
                    variants={cardVariants}
                    layout
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: idx * 0.08,
                        duration: 0.4,
                        ease: "easeOut"
                      }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="flex-none w-full flex flex-col items-center justify-center py-12 md:py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 mx-4 md:mx-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    animate={{ 
                      rotate: 360
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" }
                    }}
                  >
                    <AiOutlineLoading className="text-4xl md:text-6xl text-gray-300 mb-3 md:mb-4" />
                  </motion.div>
                  <motion.p 
                    className="text-gray-500 text-base md:text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Loading Products...
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex-shrink-0 w-4 md:w-1"></div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const HomeProducts = () => {
  const { products } = useAppContext();
  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortOption, setSortOption] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [productSections, setProductSections] = useState([]);
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true });

  const categoryButtons = [
    { name: 'Baby Milk', icon: <CiPillsBottle1 className="text-sm sm:text-base md:text-xl" />, link: '/all-products?category=PowderedMilk' },
    { name: 'Bath & Body', icon: <CiHeart className="text-sm sm:text-base md:text-xl" />, link: '/all-products?category=BathBodyCare' },
    { name: 'Vitamins', icon: <CiApple className="text-sm sm:text-base md:text-xl" />, link: '/all-products?category=Vitamins' },
    { name: 'Hygiene', icon: <CiMedicalCross className="text-sm sm:text-base md:text-xl" />, link: '/all-products?category=Accessories' },
    { name: 'Diapers', icon: <CiBandage className="text-sm sm:text-base md:text-xl" />, link: '/all-products?category=Diapers' },
    { name: 'Feeding', icon: <CiShoppingCart className="text-sm sm:text-base md:text-xl" />, link: '/all-products?category=FeedingTools' },
  ];

  const getProductsByCategory = (categories) => {
    if (!products || !Array.isArray(products)) return [];
    const cats = Array.isArray(categories) ? categories : [categories];
    return products.filter(product => 
      product && product.category && cats.includes(product.category)
    );
  };

  // Create product sections with actual products
  useEffect(() => {
    if (products && products.length > 0) {
      const sections = [
        { 
          id: 'baby-formula', 
          title: "Baby Formula", 
          categories: ['PowderedMilk'], 
          seeAllLink: "/all-products?category=PowderedMilk",
          products: getProductsByCategory(['PowderedMilk']).slice(0, 10)
        },
        { 
          id: 'feeding-essentials', 
          title: "Feeding Essentials", 
          categories: ['FeedingTools', 'Bottles'], 
          seeAllLink: "/all-products?category=FeedingTools",
          products: getProductsByCategory(['FeedingTools', 'Bottles']).slice(0, 10)
        },
        { 
          id: 'play-learn', 
          title: "Play & Learn", 
          categories: ['Toys', 'Accessories'], 
          seeAllLink: "/all-products?category=Toys",
          products: getProductsByCategory(['Toys', 'Accessories']).slice(0, 10)
        },
        { 
          id: 'bath-care', 
          title: "Bath & Body Care", 
          categories: ['BathBodyCare', 'NurseryItems', 'Diapers'], 
          seeAllLink: "/all-products?category=BathBodyCare",
          products: getProductsByCategory(['BathBodyCare', 'NurseryItems', 'Diapers']).slice(0, 10)
        },
        { 
          id: 'on-the-go', 
          title: "On-the-Go", 
          categories: ['Tumblers', 'Bottles'], 
          seeAllLink: "/all-products?category=Tumblers",
          products: getProductsByCategory(['Tumblers', 'Bottles']).slice(0, 10)
        },
        { 
          id: 'parent-favorites', 
          title: "Parent Favorites", 
          categories: ['PowderedMilk', 'LiquidMilk', 'Vitamins', 'Diapers'], 
          seeAllLink: "/all-products",
          products: getProductsByCategory(['PowderedMilk', 'LiquidMilk', 'Vitamins', 'Diapers']).slice(0, 10)
        },
      ];
      
      // Filter out sections with no products
      const sectionsWithProducts = sections.filter(section => section.products.length > 0);
      setProductSections(sectionsWithProducts);
    }
  }, [products]);

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

  return (
    <>
      <motion.div 
        className="w-full bg-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Enhanced Marquee - Mobile Optimized */}
        <motion.div 
          className="w-full overflow-hidden py-3 md:py-4 font-prata"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="whitespace-nowrap animate-marquee">
            <motion.span 
              className="text-sm sm:text-base md:text-lg text-sky-300/70 mx-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Premium USA-imported milk and baby essentials for your family.
            </motion.span>
            <motion.span 
              className="text-sm sm:text-base md:text-lg text-sky-300/70 mx-2"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              Pure, nutritious, and trusted by parents everywhere.
            </motion.span>
            <motion.span 
              className="text-sm sm:text-base md:text-lg text-sky-300/70 mx-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Premium USA-imported milk and baby essentials for your family.
            </motion.span>
            <motion.span 
              className="text-sm sm:text-base md:text-lg text-sky-300/70 mx-2"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              Pure, nutritious, and trusted by parents everywhere.
            </motion.span>
          </div>
        </motion.div>

        {/* Enhanced Category Buttons - Mobile Optimized */}
        <motion.div 
          ref={headerRef}
          className="w-full px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="w-full overflow-x-auto -mx-4 px-4">
            <motion.div 
              className="flex space-x-2 sm:space-x-3 pb-4 md:pb-6 min-w-max"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
              initial="hidden"
              animate={isHeaderInView ? "visible" : "hidden"}
            >
              {categoryButtons.map((button, index) => (
                <Link href={button.link} key={index}>
                  <motion.div
                    className="px-3 sm:px-4 md:px-6 py-2 md:py-3 border border-sky-200 rounded-lg md:rounded-xl transition-all flex items-center gap-2 md:gap-3 whitespace-nowrap cursor-pointer bg-white hover:bg-sky-50 hover:border-sky-300 active:scale-95"
                    variants={categoryButtonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <motion.span 
                      className="p-1 text-sky-400 rounded-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {button.icon}
                    </motion.span>
                    <span className="text-xs sm:text-sm md:text-base text-sky-300">
                      {button.name}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Product Sections */}
        <div className="w-full pb-6 md:pb-8">
          {productSections.length > 0 ? (
            productSections.map((section, index) => (
              <ProductScrollSection
                key={section.id}
                sectionId={section.id}
                title={section.title}
                products={section.products}
                seeAllLink={section.seeAllLink}
                index={index}
              />
            ))
          ) : (
            <motion.div 
              className="flex flex-col items-center justify-center py-12 md:py-16 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ 
                  rotate: 360
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" }
                }}
              >
                <AiOutlineLoading className="text-4xl md:text-6xl text-gray-300 mb-3 md:mb-4" />
              </motion.div>
              <motion.p 
                className="text-gray-500 text-base md:text-lg text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {products ? 'Loading Products' : 'Loading products...'}
              </motion.p>
            </motion.div>
          )}
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 40s linear infinite;
        }
        
        /* Mobile-optimized scrollbar styling */
        .overflow-x-auto::-webkit-scrollbar {
          height: 3px;
        }
        @media (min-width: 768px) {
          .overflow-x-auto::-webkit-scrollbar {
            height: 4px;
          }
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(125, 211, 252, 0.1);
          border-radius: 2px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: rgba(125, 211, 252, 0.3);
          border-radius: 2px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(125, 211, 252, 0.5);
        }
        
        /* Touch-friendly scrolling */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        /* Custom breakpoint for extra small screens */
        @media (min-width: 475px) {
          .xs\\:w-40 {
            width: 10rem;
          }
        }
      `}</style>
    </>
  );
};

export default HomeProducts;