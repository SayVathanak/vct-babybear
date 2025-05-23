// components/Navbar/Navbar.jsx
"use client";
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import { FiMenu } from "react-icons/fi";

import Logo from "./Logo";
import SearchPanel from "./SearchPanel";
import MobileMenu from "./MobileMenu";
import CartPanel from "./CartPanel";
import CartNotification from "./CartNotification";
import NavActions from "./NavActions";

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showCartPanel, setShowCartPanel] = useState(false);

    const pathname = usePathname();
    const isAllProductsPage = pathname === "/all-products" || pathname.startsWith("/all-products?");

    const { showCartPopup, setShowCartPopup } = useAppContext();

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const toggleSearch = () => setSearchOpen(!searchOpen);

    return (
        <>
            <nav className="sticky top-0 z-[55] bg-white border-b border-gray-200 shadow-sm px-4 py-2 md:px-12 flex items-center justify-between">
                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleMobileMenu}
                        aria-label="Toggle menu"
                        className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors hover:bg-gray-100"
                    >
                        <FiMenu size={24} />
                    </button>
                </div>

                {/* Centered Logo */}
                <Logo />

                {/* Navigation Actions */}
                <NavActions
                    isAllProductsPage={isAllProductsPage}
                    searchOpen={searchOpen}
                    onToggleSearch={toggleSearch}
                    onShowCart={() => setShowCartPanel(true)}
                />

                {/* Search Panel */}
                <SearchPanel
                    isOpen={searchOpen}
                    onClose={() => setSearchOpen(false)}
                />
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