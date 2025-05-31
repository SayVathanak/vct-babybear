// components/Navbar/MobileMenu.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { FiX, FiChevronRight } from "react-icons/fi";
import { BsHouseDoor, BsBoxSeam, BsShop, BsBoxArrowInRight, BsBoxArrowRight } from "react-icons/bs";
import { useAppContext } from "@/context/AppContext";
import { assets, BoxIcon } from "@/assets/assets";
import { useClerk, UserButton } from "@clerk/nextjs";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";

const MobileMenu = ({ isOpen, onClose }) => {
    const { isSeller, router, user } = useAppContext();
    const { openSignIn, signOut } = useClerk();

    const categories = [
        { id: "All", name: "All Products" },
        { id: "PowderedMilk", name: "Formula & Powdered Milk" },
        { id: "LiquidMilk", name: "Ready-to-Feed Milk" },
        { id: "Bottles", name: "Bottles & Sippy Cups" },
        { id: "Tumblers", name: "Toddler Tumblers & Cups" },
        { id: "FeedingTools", name: "Feeding Sets & Utensils" },
        { id: "Accessories", name: "Baby Essentials & Accessories" },
        { id: "Vitamins", name: "Nutrition & Supplements" },
        { id: "Diapers", name: "Diapers & Wipes" },
        { id: "NurseryItems", name: "Nursery & Sleep Essentials" },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="fixed top-0 left-0 w-72 h-full bg-white z-50 overflow-hidden flex flex-col"
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
                                        onClick={() => {
                                            router.push("/");
                                            onClose();
                                        }}
                                        src={assets.logo}
                                        alt="logo"
                                        width={112}
                                        height={35}
                                    />
                                ) : (
                                    <div
                                        className="cursor-pointer text-xl font-bold"
                                        onClick={() => {
                                            router.push("/");
                                            onClose();
                                        }}
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
                                    <Link
                                        href="/"
                                        onClick={onClose}
                                        className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        <BsHouseDoor size={18} /> <span>Home</span>
                                    </Link>
                                    <Link
                                        href="/all-products"
                                        onClick={onClose}
                                        className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        <BsShop size={18} /> <span>Shop</span>
                                    </Link>
                                    <Link
                                        href="/my-orders"
                                        onClick={onClose}
                                        className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        <BsBoxSeam size={18} /> <span>Orders</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="p-5 pt-2">
                                <div className="flex flex-col space-y-1">
                                    {categories.map((category) => (
                                        <Link
                                            href={`/all-products?category=${category.id}`}
                                            key={category.id}
                                            onClick={onClose}
                                            className="flex items-center justify-between text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                                        >
                                            <span>{category.name}</span>
                                            <FiChevronRight size={16} className="text-gray-400" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Account Section */}
                        <div className="p-5 pb-10 mt-auto border-t border-gray-100 bg-gray-50">
                            {isSeller && (
                                <button
                                    onClick={() => {
                                        router.push("/seller");
                                        onClose();
                                    }}
                                    className="flex items-center gap-3 text-gray-700 hover:text-sky-600 py-2 mb-3 w-full"
                                >
                                    <BoxIcon /> <span>Seller Dashboard</span>
                                </button>
                            )}

                            {user ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 mb-3">
                                        <UserButton afterSignOutUrl="/" />
                                        <div>
                                            <div className="text-sm font-medium">{user.firstName || "User"}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[180px]">{user.email}</div>
                                        </div>
                                    </div>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button className="flex items-center justify-center gap-2 w-full bg-sky-300/70 hover:bg-white text-white hover:text-sky-400 px-3 py-2 rounded-md transition-colors font-medium">
                                                <BsBoxArrowRight size={18} /> <span>Sign Out</span>
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="sm:max-w-md">
                                            <AlertDialogHeader>
                                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 mb-3">
                                                    <BsBoxArrowRight className="h-6 w-6 text-sky-600" />
                                                </div>
                                                <AlertDialogTitle className="text-center">Sign out from Baby Bear Store?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-center">
                                                    You'll need to sign in again to access your orders and account settings.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                                                <AlertDialogCancel className="sm:w-32 border-sky-200 text-gray-600">
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => {
                                                        signOut();
                                                        onClose();
                                                        toast.success("You've been signed out successfully");
                                                    }}
                                                    className="sm:w-32 bg-sky-300/70 hover:bg-sky-400/70"
                                                >
                                                    Sign Out
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
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
    );
};

export default MobileMenu;
