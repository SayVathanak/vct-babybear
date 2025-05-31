// components/Navbar/NavActions.jsx (example modification)
import React from "react";
import { FiSearch, FiX, FiShoppingCart } from "react-icons/fi";
import { useAppContext } from "@/context/AppContext";

const NavActions = ({ isAllProductsPage, isHomePage, searchOpen, onToggleSearch, onShowCart }) => {
    const { getCartCount } = useAppContext();
    const cartCount = getCartCount();

    const showSearchButton = isHomePage;

    // This part is new:
    const handleSearchClick = (event) => {
        // Prevent default touch behavior if it interferes with click
        // event.preventDefault(); // Use with caution, can break other things
        onToggleSearch();
    };

    return (
        <div className="flex items-center gap-5">
            {/* Search Toggle - Only shown on home page */}
            {showSearchButton && (
                <button
                    onClick={handleSearchClick} // Use the new handler
                    // Also add onTouchStart for iOS specific tap handling
                    onTouchStart={handleSearchClick} // This can sometimes prevent the 300ms delay or tap issues
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

