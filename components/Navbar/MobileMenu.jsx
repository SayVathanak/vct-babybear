// components/Navbar/MobileMenu.jsx
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { FiX, FiChevronRight } from "react-icons/fi";
import { BsHouseDoor, BsBoxSeam, BsShop, BsBoxArrowInRight, BsBoxArrowRight } from "react-icons/bs";
import { useAppContext } from "@/context/AppContext";
import { assets, BoxIcon } from "@/assets/assets";
import { useClerk, UserButton } from "@clerk/nextjs";
import toast from "react-hot-toast";

// Custom Sign Out Modal Component
const SignOutModal = ({ isOpen, onClose, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="text-center mb-4">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 mb-3">
                                <BsBoxArrowRight className="h-6 w-6 text-sky-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Sign out from Baby Bear Store?
                            </h3>
                            <p className="text-sm text-gray-500 mt-2">
                                You'll need to sign in again to access your orders and account settings.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                                onClick={onClose}
                                className="sm:w-32 px-4 py-2 border border-sky-200 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="sm:w-32 px-4 py-2 bg-sky-300/70 hover:bg-sky-400/70 text-white rounded-md transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const MobileMenu = ({ isOpen, onClose }) => {
    const { isSeller, router, user } = useAppContext();
    const { openSignIn, signOut } = useClerk();
    const [showSignOutModal, setShowSignOutModal] = useState(false);

    const categories = [
        { id: "All", name: "All Products" },
        { id: "PowderedMilk", name: "Formula & Powdered Milk" },
        { id: "LiquidMilk", name: "Ready-to-Feed Milk" },
        { id: "Bottles", name: "Bottles & Sippy Cups" },
        { id: "FeedingTools", name: "Feeding Sets & Utensils" },
        { id: "BathBodyCare", name: "Bath & Body Care" },
        { id: "Vitamins", name: "Nutrition & Supplements" },
        { id: "NurseryItems", name: "Nursery & Sleep Essentials" },
        { id: "Toys", name: "Play & Learn" },
        { id: "Accessories", name: "Baby Essentials & Accessories" },
        { id: "Diapers", name: "Diapers & Wipes" },
        { id: "Tumblers", name: "Toddler Tumblers & Cups" },
    ];

    const handleSignOut = () => {
        // Close both modals
        setShowSignOutModal(false);
        onClose();
        
        // Small delay to ensure modals close, then sign out
        setTimeout(() => {
            signOut()
                .then(() => {
                    toast.success("You've been signed out successfully");
                })
                .catch((error) => {
                    console.error("Sign out error:", error);
                    toast.error("Failed to sign out. Please try again.");
                });
        }, 300);
    };

    const openSignOutModal = () => {
        setShowSignOutModal(true);
    };

    const closeSignOutModal = () => {
        setShowSignOutModal(false);
    };

    // Handle navigation with proper timing
    const handleNavigation = (url) => {
        // Close menu first
        onClose();
        
        // Small delay to ensure menu closes, then navigate
        setTimeout(() => {
            router.push(url);
        }, 100);
    };

    // Handle category navigation
    const handleCategoryClick = (categoryId) => {
        const url = `/all-products?category=${categoryId}`;
        handleNavigation(url);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/30 z-[50]"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="fixed top-0 left-0 w-72 h-full bg-white z-[50] overflow-hidden flex flex-col"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    {assets.logo ? (
                                        <Image
                                            className="cursor-pointer w-24"
                                            onClick={() => handleNavigation("/")}
                                            src={assets.logo}
                                            alt="logo"
                                            width={112}
                                            height={35}
                                        />
                                    ) : (
                                        <div
                                            className="cursor-pointer text-xl font-bold"
                                            onClick={() => handleNavigation("/")}
                                        >
                                            Baby Bear Store
                                        </div>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="p-1 rounded-md text-gray-500 hover:text-gray-700"
                                        aria-label="Close menu"
                                    >
                                        <FiX size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                {/* Main Navigation */}
                                <div className="p-5 pb-2 border-b border-gray-100">
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            onClick={() => handleNavigation("/")}
                                            className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <BsHouseDoor size={18} /> <span>Home</span>
                                        </button>
                                        <button
                                            onClick={() => handleNavigation("/all-products")}
                                            className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <BsShop size={18} /> <span>Shop</span>
                                        </button>
                                        <button
                                            onClick={() => handleNavigation("/my-orders")}
                                            className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <BsBoxSeam size={18} /> <span>Orders</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="p-5 pt-2">
                                    <div className="flex flex-col space-y-1">
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => handleCategoryClick(category.id)}
                                                className="flex items-center justify-between text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors text-left w-full"
                                            >
                                                <span>{category.name}</span>
                                                <FiChevronRight size={16} className="text-gray-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Account Section */}
                            <div className="px-5 pb-10 md:pb-20 pt-5 mt-auto border-t border-gray-100 bg-gray-50">
                                {isSeller && (
                                    <button
                                        onClick={() => handleNavigation("/seller")}
                                        className="flex items-center gap-3 text-gray-700 hover:text-sky-600 py-2 mb-3 w-full text-left"
                                    >
                                        <BoxIcon /> <span>Seller Dashboard</span>
                                    </button>
                                )}

                                {user ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <UserButton 
                                                afterSignOutUrl="/" 
                                                afterSignOutCallback={() => {
                                                    // Close mobile menu when signing out via UserButton
                                                    onClose();
                                                    toast.success("You've been signed out successfully");
                                                }}
                                            />
                                            <div>
                                                <div className="text-sm font-medium">{user.firstName || "User"}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[180px]">{user.email}</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={openSignOutModal}
                                            className="flex items-center justify-center gap-2 w-full bg-sky-300/70 hover:bg-white text-white hover:text-sky-400 px-3 py-2 rounded-md transition-colors font-medium"
                                        >
                                            <BsBoxArrowRight size={18} /> <span>Sign Out</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            openSignIn();
                                            onClose();
                                        }}
                                        className="flex items-center justify-center gap-2 w-full bg-sky-300/70 hover:bg-white text-white hover:text-sky-400 px-3 py-2 rounded-md transition-colors font-medium"
                                    >
                                        <BsBoxArrowInRight size={18} /> <span>Sign In</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Sign Out Modal */}
            <SignOutModal
                isOpen={showSignOutModal}
                onClose={closeSignOutModal}
                onConfirm={handleSignOut}
            />
        </>
    );
};

export default MobileMenu;