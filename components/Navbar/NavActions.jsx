// components/Navbar/NavActions.jsx
import React from "react";
import { FiSearch, FiX, FiShoppingCart } from "react-icons/fi";
import { useAppContext } from "@/context/AppContext";

const NavActions = ({ isAllProductsPage, searchOpen, onToggleSearch, onShowCart }) => {
    const { getCartCount } = useAppContext();
    const cartCount = getCartCount();

    return (
        <div className="flex items-center gap-5">
            {/* Search Toggle */}
            {!isAllProductsPage && (
                <button
                    onClick={onToggleSearch}
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