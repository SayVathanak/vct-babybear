// components/Navbar/Navbar.jsx - MOBILE KEYBOARD & SEARCH FIX
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

    // FIXED: Better search toggle with proper mobile keyboard handling
    const toggleSearch = () => {
        setSearchOpen(prevSearchOpen => {
            const newSearchOpen = !prevSearchOpen;
            
            // If opening search, focus the input after state update
            if (newSearchOpen) {
                // Use multiple methods to ensure focus works on mobile
                requestAnimationFrame(() => {
                    if (searchInputRef?.current) {
                        const input = searchInputRef.current;
                        
                        // Method 1: Standard focus
                        input.focus();
                        
                        // Method 2: iOS Safari specific
                        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                            setTimeout(() => {
                                input.click();
                                input.focus();
                            }, 50);
                        }
                        
                        // Method 3: Android Chrome specific  
                        if (/Android/.test(navigator.userAgent)) {
                            setTimeout(() => {
                                input.focus();
                                input.click();
                            }, 100);
                        }
                    }
                });
            }
            
            return newSearchOpen;
        });
    };

    // FIXED: Prevent body scroll when search is open on mobile
    useEffect(() => {
        if (searchOpen) {
            document.body.style.overflow = 'hidden';
            // Prevent iOS Safari from bouncing
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [searchOpen]);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-[55] bg-white border-b border-gray-200 shadow-sm px-4 pt-3 pb-2 md:px-12 flex items-center justify-between">
                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleMobileMenu}
                        aria-label="Toggle menu"
                        className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors touch-manipulation"
                        style={{ touchAction: 'manipulation' }}
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

                {/* FIXED: Search Panel with proper AnimatePresence */}
                <AnimatePresence>
                    {searchOpen && (
                        <SearchPanel
                            isOpen={searchOpen}
                            onClose={() => setSearchOpen(false)}
                            searchInputRef={searchInputRef}
                        />
                    )}
                </AnimatePresence>
            </nav>

            {/* FIXED: Add overlay when search is open on mobile */}
            {searchOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-25 z-[50] md:hidden"
                    onClick={() => setSearchOpen(false)}
                />
            )}

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