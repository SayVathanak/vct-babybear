// components/Navbar/SearchPanel.jsx - FIXED VERSION
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiShoppingCart } from "react-icons/fi";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";

const SearchPanel = ({ isOpen, onClose, searchInputRef }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showAllResults, setShowAllResults] = useState(false);

    const searchResultsRef = useRef(null);
    const { products, router, currency } = useAppContext();

    // Categories for quick access
    const categories = [
        { id: "All", name: "All Products" },
        { id: "PowderedMilk", name: "Formula & Powdered Milk" },
        { id: "LiquidMilk", name: "Ready-to-Feed Milk" },
        { id: "Bottles", name: "Bottles & Sippy Cups" },
        { id: "Tumblers", name: "Toddler Tumblers & Cups" },
    ];

    // Debounced search
    const debouncedSearch = useCallback(
        (value) => {
            if (value.trim()) {
                const filtered = products.filter(
                    (p) =>
                        p.name.toLowerCase().includes(value.toLowerCase()) ||
                        (p.description && p.description.toLowerCase().includes(value.toLowerCase()))
                );
                setFilteredProducts(filtered);
            } else {
                setFilteredProducts([]);
            }
        },
        [products]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            debouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, debouncedSearch]);

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
            setFilteredProducts([]);
            setShowAllResults(false);
        }
    }, [isOpen]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchResultsRef.current &&
                !searchResultsRef.current.contains(event.target) &&
                !event.target.closest('button[aria-label="Search"]')
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen, onClose]);

    const handleProductClick = (productId) => {
        router.push(`/product/${productId}`);
        onClose();
    };

    return (
        <motion.div
            ref={searchResultsRef}
            className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-[60]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="container mx-auto max-w-7xl px-4 py-4">
                {/* Search Input */}
                <div className="relative mb-4">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search products..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
                        // iOS specific attributes
                        inputMode="search"
                        style={{ fontSize: '16px' }} // Prevents iOS zoom
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>

                {/* Search Results */}
                {filteredProducts.length > 0 ? (
                    <>
                        <div className="flex overflow-x-auto gap-4 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 border-b border-gray-200">
                            {(showAllResults ? filteredProducts : filteredProducts.slice(0, 10)).map((product) => (
                                <div
                                    key={product._id}
                                    className="bg-white rounded-lg shadow-sm transition-all cursor-pointer border border-gray-100 flex-shrink-0 w-48"
                                    onClick={() => handleProductClick(product._id)}
                                >
                                    <div className="p-2">
                                        <div className="relative aspect-square bg-gray-50 rounded-md mb-2 overflow-hidden">
                                            {product.image && product.image[0] ? (
                                                <Image
                                                    src={product.image[0]}
                                                    alt={product.name}
                                                    fill
                                                    className="object-contain"
                                                    sizes="(max-width: 768px) 50vw, 20vw"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                                                    <FiShoppingCart size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-medium line-clamp-2 h-10">{product.name}</h3>
                                        <div className="flex items-center mt-1">
                                            <span className="text-sm font-semibold text-sky-700">
                                                {currency}{product.offerPrice?.toFixed(2) || product.price?.toFixed(2)}
                                            </span>
                                            {product.price && product.offerPrice && product.price > product.offerPrice && (
                                                <span className="text-xs text-gray-400 line-through ml-2">
                                                    {currency}{product.price?.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length > 10 && !showAllResults && (
                            <div className="flex justify-center mt-3">
                                <button
                                    onClick={() => setShowAllResults(true)}
                                    className="text-sky-600 text-sm font-medium px-4 py-2 rounded-md transition-colors"
                                >
                                    View all {filteredProducts.length} results
                                </button>
                            </div>
                        )}
                    </>
                ) : searchTerm ? (
                    <div className="text-center py-12">
                        <div className="mb-3 text-gray-400">
                            <FiSearch size={36} className="mx-auto" />
                        </div>
                        <p className="text-gray-600 mb-1">No products found for "{searchTerm}"</p>
                        <p className="text-gray-500 text-sm">Try different keywords or browse categories</p>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p className="mb-2">Start typing to search products</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {categories.slice(0, 5).map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        router.push(`/all-products?category=${category.id}`);
                                        onClose();
                                    }}
                                    className="px-3 py-1.5 text-sm bg-gray-50 rounded-md text-gray-700 transition-colors"
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SearchPanel;

// BottomNavbar.jsx - FIXED VERSION
'use client'
import React, { useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { 
  Home, 
  Package, 
  Search, 
  ShoppingCart, 
  User,
  X
} from 'lucide-react';

export default function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Don't show navbar on seller pages
  if (pathname.startsWith('/seller')) {
    return null;
  }

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      active: pathname === '/'
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      path: '/all-products',
      active: pathname === '/all-products'
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      action: () => {
        setShowSearch(true);
        // IMMEDIATE focus for iOS
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.click();
          }
        }, 50);
      },
      active: false
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      path: '/cart',
      active: pathname === '/cart'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/my-orders',
      active: pathname === '/my-orders' || pathname === '/add-address',
      isProfile: true
    }
  ];

  const handleNavClick = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      router.push(item.path);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/all-products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute top-0 left-0 right-0 bg-white p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
              <div className="flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  inputMode="search"
                  style={{ fontSize: '16px' }} // Prevent iOS zoom
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Search for baby products, brands, categories...</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
                  item.active 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {item.isProfile && user ? (
                  <div className="w-6 h-6 relative">
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-6 h-6",
                        }
                      }}
                    />
                  </div>
                ) : (
                  <Icon size={20} />
                )}
                <span className="text-xs font-medium">{item.label}</span>
                
                {/* Active indicator */}
                {item.active && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Safe area for devices with home indicator */}
        <div className="h-2 bg-white"></div>
      </nav>

      {/* Spacer to prevent content from being hidden behind navbar */}
      <div className="h-20 md:hidden"></div>
    </>
  );
}