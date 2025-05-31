// components/Navbar/SearchPanel.jsx - MOBILE KEYBOARD & CLICK OUTSIDE FIX
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

    // FIXED: Better click outside detection that doesn't interfere with search button
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Don't close if clicking on the search button or its icon
            const searchButton = event.target.closest('button[aria-label*="search" i]');
            if (searchButton) return;
            
            // Don't close if clicking inside the search panel
            if (searchResultsRef.current && searchResultsRef.current.contains(event.target)) {
                return;
            }
            
            // Don't close if clicking on input or its related elements
            if (event.target.closest('input[type="text"]')) {
                return;
            }
            
            // Close the search panel
            onClose();
        };

        if (isOpen) {
            // Use a small delay to prevent immediate closing when opening
            const timer = setTimeout(() => {
                document.addEventListener("mousedown", handleClickOutside);
                document.addEventListener("touchstart", handleClickOutside);
            }, 100);
            
            return () => {
                clearTimeout(timer);
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("touchstart", handleClickOutside);
            };
        }
    }, [isOpen, onClose]);

    // FIXED: Auto-focus when panel opens with better mobile support
    useEffect(() => {
        if (isOpen && searchInputRef?.current) {
            // Multiple focus attempts for better mobile compatibility
            const focusInput = () => {
                const input = searchInputRef.current;
                if (!input) return;

                // Method 1: Standard focus
                input.focus();
                
                // Method 2: iOS specific handling
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    input.setAttribute('readonly', true);
                    input.focus();
                    input.removeAttribute('readonly');
                    
                    // Force iOS keyboard
                    setTimeout(() => {
                        input.click();
                        input.focus();
                    }, 50);
                }
                
                // Method 3: Android handling
                if (/Android/.test(navigator.userAgent)) {
                    input.focus();
                    setTimeout(() => {
                        input.setSelectionRange(0, 0);
                        input.focus();
                    }, 100);
                }
            };

            // Multiple attempts with different timings
            requestAnimationFrame(focusInput);
            setTimeout(focusInput, 50);
            setTimeout(focusInput, 150);
        }
    }, [isOpen, searchInputRef]);

    const handleProductClick = (productId) => {
        router.push(`/product/${productId}`);
        onClose();
    };

    // FIXED: Prevent input blur on mobile when clicking inside panel
    const handlePanelClick = (e) => {
        e.stopPropagation();
    };

    return (
        <motion.div
            ref={searchResultsRef}
            className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-[60]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={handlePanelClick}
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
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        // FIXED: Mobile keyboard optimizations
                        inputMode="search"
                        enterKeyHint="search"
                        style={{ 
                            fontSize: '16px', // Prevents iOS zoom
                            lineHeight: '1.2',
                            WebkitAppearance: 'none' // Remove iOS styling
                        }}
                        // Prevent losing focus on mobile
                        onBlur={(e) => {
                            // Don't blur if clicking inside the search panel
                            const relatedTarget = e.relatedTarget;
                            if (relatedTarget && searchResultsRef.current?.contains(relatedTarget)) {
                                e.target.focus();
                            }
                        }}
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>

                {/* Search Results */}
                {filteredProducts.length > 0 ? (
                    <>
                        <div className="flex overflow-x-auto gap-4 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 border-b border-gray-200">
                            {(showAllResults ? filteredProducts : filteredProducts.slice(0, 10)).map((product) => (
                                <div
                                    key={product._id}
                                    className="bg-white rounded-lg shadow-sm transition-all cursor-pointer border border-gray-100 flex-shrink-0 w-48 touch-manipulation"
                                    onClick={() => handleProductClick(product._id)}
                                    style={{ touchAction: 'manipulation' }}
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
                                    className="text-sky-600 text-sm font-medium px-4 py-2 rounded-md transition-colors touch-manipulation"
                                    style={{ touchAction: 'manipulation' }}
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
                                    className="px-3 py-1.5 text-sm bg-gray-50 rounded-md text-gray-700 transition-colors touch-manipulation"
                                    style={{ touchAction: 'manipulation' }}
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