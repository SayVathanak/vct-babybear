// components/Navbar/NavActions.jsx - FIXED VERSION
"use client";
import React from "react";
import { FiSearch, FiX, FiShoppingCart } from "react-icons/fi";
import { useAppContext } from "@/context/AppContext";

const NavActions = ({ isAllProductsPage, isHomePage, searchOpen, onToggleSearch, onShowCart, searchInputRef }) => {
    const { getCartCount } = useAppContext();
    const cartCount = getCartCount();

    const showSearchButton = isHomePage;

    // CRITICAL FIX: Direct focus in the click handler
    const handleSearchClick = (event) => {
        onToggleSearch();
        
        // IMMEDIATE focus - must be synchronous with user interaction
        if (!searchOpen && searchInputRef?.current) {
            // Use setTimeout with minimal delay to ensure DOM is updated
            // but still maintain user gesture context
            setTimeout(() => {
                searchInputRef.current.focus();
                searchInputRef.current.click(); // Additional iOS workaround
            }, 10); // Minimal delay
        }
    };

    return (
        <div className="flex items-center gap-5">
            {/* Search Toggle - Only shown on home page */}
            {showSearchButton && (
                <button
                    onClick={handleSearchClick}
                    // Remove onTouchStart as it can interfere
                    aria-label="Search"
                    className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors hover:bg-gray-100"
                >
                    {searchOpen ? <FiX size={22} /> : <FiSearch size={22} />}
                </button>
            )}

            {/* Cart Icon */}
            <div
                className="relative cursor-pointer transition-transform hover:scale-110"
                onClick={onShowCart}
                aria-label="Shopping cart"
            >
                <FiShoppingCart size={22} />
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