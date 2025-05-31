// components/Navbar/Navbar.jsx - FIXED VERSION
"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import { FiMenu } from "react-icons/fi";
import { AnimatePresence } from "framer-motion";

import Logo from "./Logo";
import SearchPanel from "./SearchPanel";
import MobileMenu from "./MobileMenu";
import CartPanel from "./CartPanel";
import CartNotification from "./CartNotification";
import NavActions from "./NavActions";

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showCartPanel, setShowCartPanel] = useState(false);
    const { showCartPopup, setShowCartPopup, searchOpen, setSearchOpen } = useAppContext();

    const searchInputRef = useRef(null);

    const pathname = usePathname();
    const isAllProductsPage = pathname === "/all-products" || pathname.startsWith("/all-products?");
    const isHomePage = pathname === "/";

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    const toggleSearch = () => {
        setSearchOpen(prevSearchOpen => !prevSearchOpen);
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-[55] bg-white border-b border-gray-200 shadow-sm px-4 pt-3 pb-2 md:px-12 flex items-center justify-between">
                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleMobileMenu}
                        aria-label="Toggle menu"
                        className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors"
                    >
                        <FiMenu size={24} />
                    </button>
                </div>

                {/* Centered Logo */}
                <Logo />

                {/* Navigation Actions - Pass searchInputRef */}
                <NavActions
                    isAllProductsPage={isAllProductsPage}
                    isHomePage={isHomePage}
                    searchOpen={searchOpen}
                    onToggleSearch={toggleSearch}
                    onShowCart={() => setShowCartPanel(true)}
                    searchInputRef={searchInputRef}
                />

                {/* Search Panel - Render without AnimatePresence for immediate display */}
                {searchOpen && (
                    <SearchPanel
                        isOpen={searchOpen}
                        onClose={() => setSearchOpen(false)}
                        searchInputRef={searchInputRef}
                    />
                )}
            </nav>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            {/* Cart Panel */}
            <CartPanel
                isOpen={showCartPanel}
                onClose={() => setShowCartPanel(false)}
            />

            {/* Cart Notification */}
            <CartNotification
                isVisible={showCartPopup}
                onClose={() => setShowCartPopup(false)}
                onViewCart={() => {
                    setShowCartPopup(false);
                    setShowCartPanel(true);
                }}
            />
        </>
    );
};

export default Navbar;