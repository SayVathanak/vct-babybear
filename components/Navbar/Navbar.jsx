// components/Navbar/Navbar.jsx - No significant changes needed here from previous, just re-confirming the setup
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
        setSearchOpen(prevSearchOpen => {
            const newState = !prevSearchOpen;
            if (newState) { // If search is being opened
                // The crucial part: attempt to focus after the panel has mounted/animated in
                setTimeout(() => {
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                        // This might also help for iOS:
                        // If focus doesn't open keyboard, manually try to trigger it (less reliable)
                        // This is more for older Androids, but sometimes helps with iOS too.
                        // searchInputRef.current.setSelectionRange(0, 0);
                    }
                }, 100); // 100ms usually gives enough time for rendering
            }
            return newState;
        });
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-[55] bg-white border-b border-gray-200 shadow-sm px-4 pt-3 pb-2 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleMobileMenu}
                        aria-label="Toggle menu"
                        className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors"
                    >
                        <FiMenu size={24} />
                    </button>
                </div>

                <Logo />

                <NavActions
                    isAllProductsPage={isAllProductsPage}
                    isHomePage={isHomePage}
                    searchOpen={searchOpen}
                    onToggleSearch={toggleSearch}
                    onShowCart={() => setShowCartPanel(true)}
                />

                <AnimatePresence>
                    {searchOpen && (
                        <SearchPanel
                            isOpen={searchOpen}
                            onClose={() => setSearchOpen(false)}
                            searchInputRef={searchInputRef} // Pass the ref down
                        />
                    )}
                </AnimatePresence>
            </nav>

            <MobileMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            <CartPanel
                isOpen={showCartPanel}
                onClose={() => setShowCartPanel(false)}
            />

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
