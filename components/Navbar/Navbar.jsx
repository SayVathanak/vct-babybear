"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { usePathname, useRouter } from "next/navigation";
import { FiMenu } from "react-icons/fi";
import { CiMenuFries } from "react-icons/ci";
import { GoArrowLeft } from "react-icons/go";
import { AnimatePresence } from "framer-motion";

import Logo from "./Logo";
import SearchPanel from "./SearchPanel";
import MobileMenu from "./MobileMenu";
import CartPanel from "./CartPanel";
import CartNotification from "./CartNotification";
import NavActions from "./NavActions";

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // MODIFICATION: State for CartPanel is now managed in AppContext.
    // This allows other components (like ProductCard) to open the panel.
    const { 
        showCartPopup, 
        setShowCartPopup, 
        searchOpen, 
        setSearchOpen,
        showCartPanel,     // Get state from context
        setShowCartPanel   // Get setter from context
    } = useAppContext();

    const searchInputRef = useRef(null);
    const router = useRouter();
    const pathname = usePathname();
    const isHomePage = pathname === "/";

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const handleGoBack = () => router.back();

    const toggleSearch = () => {
        setSearchOpen(prev => !prev);
    };

    useEffect(() => {
        if (searchOpen) {
            document.body.style.overflow = 'hidden';
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
            <nav className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-between bg-white border-gray-200 px-4 pt-3 pb-2 md:px-12">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleMobileMenu}
                        aria-label="Toggle menu"
                        className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors"
                    >
                       <div className="transform -scale-x-100">
                          <CiMenuFries size={24} />
                        </div>
                    </button>
                    {!isHomePage && (
                        <button onClick={handleGoBack} aria-label="Go back" className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors">
                            <GoArrowLeft size={24} />
                        </button>
                    )}
                </div>
                <Logo />
                <NavActions
                    onToggleSearch={toggleSearch}
                    onShowCart={() => setShowCartPanel(true)} // This function now updates the context state
                    searchInputRef={searchInputRef}
                />
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

            {searchOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-25 z-[50] md:hidden"
                    onClick={() => setSearchOpen(false)}
                />
            )}

            <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            
            {/* The CartPanel now uses state from the global context */}
            <CartPanel isOpen={showCartPanel} onClose={() => setShowCartPanel(false)} />

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
