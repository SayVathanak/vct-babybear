// components/Navbar/NavActions.jsx - MOBILE KEYBOARD FIX
"use client";
import React from "react";
import { FiSearch, FiX, FiShoppingCart } from "react-icons/fi";
import { CiReceipt } from "react-icons/ci";
import { BsBag } from "react-icons/bs";
import { LuReceiptText } from "react-icons/lu";
import { useAppContext } from "@/context/AppContext";

const NavActions = ({ isAllProductsPage, isHomePage, searchOpen, onToggleSearch, onShowCart, searchInputRef }) => {
    const { getCartCount } = useAppContext();
    const cartCount = getCartCount();

    const showSearchButton = isHomePage;

    // FIXED: Better mobile keyboard handling
    const handleSearchClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (searchOpen) {
            // If search is open, close it
            onToggleSearch();
        } else {
            // If search is closed, open it and focus input
            onToggleSearch();
            
            // Multiple focus attempts for better mobile compatibility
            requestAnimationFrame(() => {
                if (searchInputRef?.current) {
                    // Method 1: Direct focus
                    searchInputRef.current.focus();
                    
                    // Method 2: iOS Safari specific
                    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                        searchInputRef.current.click();
                        searchInputRef.current.focus();
                    }
                    
                    // Method 3: Android Chrome specific
                    if (/Android/.test(navigator.userAgent)) {
                        setTimeout(() => {
                            searchInputRef.current.focus();
                            searchInputRef.current.select();
                        }, 100);
                    }
                }
            });
        }
    };

    return (
        <div className="flex items-center gap-5">
            {/* Search Toggle - Only shown on home page */}
            {showSearchButton && (
                <button
                    onClick={handleSearchClick}
                    onTouchEnd={handleSearchClick} // Additional mobile support
                    aria-label={searchOpen ? "Close search" : "Open search"}
                    className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors hover:bg-gray-100 touch-manipulation"
                    style={{ touchAction: 'manipulation' }} // Prevent iOS double-tap zoom
                >
                    {searchOpen ? <FiX size={22} /> : <FiSearch size={22} />}
                </button>
            )}

            {/* Cart Icon */}
            <div
                className="relative cursor-pointer transition-transform hover:scale-110 touch-manipulation"
                onClick={onShowCart}
                aria-label="Shopping cart"
                style={{ touchAction: 'manipulation' }}
            >
                <LuReceiptText size={22} />
                {cartCount > 0 && (
                    <span className="absolute -bottom-2 -right-2 bg-sky-300/90 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                    </span>
                )}
            </div>
        </div>
    );
};

export default NavActions;