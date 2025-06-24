"use client";
import React from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { FaPlus, FaMinus } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { IoHeartOutline } from "react-icons/io5";
import { MdOutlineError } from "react-icons/md";
import toast from "react-hot-toast";
import { GoCheck } from "react-icons/go";

const ProductCard = ({ product }) => {
    const {
        currency,
        router,
        addToCart,
        cartItems,
        setShowCartPanel,
        isAddingToCart,
    } = useAppContext();

    if (!product) return null;

    const currentQuantity = cartItems[product._id] || 0;
    const isInCart = currentQuantity > 0;
    // Ensure product.stock is checked for availability
    const isAvailable = product.isAvailable !== false && product.stock > 0;

    const calculateDiscount = () => {
        if (!product.price || !product.offerPrice) return 0;
        const discount = ((product.price - product.offerPrice) / product.price) * 100;
        return Math.round(discount);
    };

    const discountPercentage = calculateDiscount();

    const handleAddToCart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!isAvailable) {
            toast.error("This product is currently out of stock");
            return;
        }
        // --- INVENTORY: Prevent adding more items than available in stock ---
        if (currentQuantity >= product.stock) {
            toast.error("No more items in stock to add");
            return;
        }
        addToCart(product._id);
        toast.success("Added to cart");
    };

    const handleCardClick = (e) => {
        if (e.target.closest('button')) {
            return;
        }
        router.push("/product/" + product._id);
        scrollTo(0, 0);
    };

    const handleWishlist = (e) => {
        e.stopPropagation();
        e.preventDefault();
        toast.success("Added to wishlist");
    };

    const handleViewItem = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setShowCartPanel(true);
    };

    const truncateTitle = (title, maxLength = 20) => {
        if (title.length > maxLength) {
            return title.substring(0, maxLength) + '...';
        }
        return title;
    };

    return (
        <div className="flex flex-col bg-white overflow-hidden transition-all duration-300 w-full h-full min-h-[150]">
            {/* Image Container */}
            <div
                className={`cursor-pointer relative bg-white w-full flex items-center justify-center overflow-hidden ${!isAvailable ? 'opacity-70' : ''}`}
                onClick={handleCardClick}
            >
                {discountPercentage > 0 && (
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium z-10 shadow-sm">
                        -{discountPercentage}%
                    </div>
                )}
                
                <button
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white p-1 sm:p-1.5 md:p-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200 z-10"
                    onClick={handleWishlist}
                    aria-label="Add to wishlist"
                >
                    <IoHeartOutline className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 hover:text-red-500 transition-colors" />
                </button>
                
                <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-3 md:p-4">
                    <Image
                        src={product.image?.[0] || "/fallback-image.jpg"}
                        alt={product.name || "Product Image"}
                        className="object-contain max-w-full max-h-full transition-transform duration-200"
                        width={120}
                        height={120}
                        priority={false}
                        style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                    />
                </div>
                
                {!isAvailable && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                        <div className="text-red-500 text-xs sm:text-sm font-medium flex items-center px-2 py-1 bg-white rounded-lg shadow-sm">
                            <MdOutlineError className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Out of Stock</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="flex flex-col p-2.5 sm:p-3 md:p-4 flex-grow">
                <div className="mb-2 sm:mb-3 flex items-start">
                    <h3
                        className={`text-xs md:text-base font-medium cursor-pointer w-full line-clamp-1 ${!isAvailable ? 'text-gray-400' : 'text-gray-800 hover:text-gray-600'} transition-colors`}
                        onClick={handleCardClick}
                        title={product.name}
                    >
                        <span className="block sm:hidden">{truncateTitle(product.name, 25)}</span>
                        <span className="hidden md:block">{truncateTitle(product.name, 30)}</span>
                    </h3>
                </div>

                {/* Price and Action Section */}
                <div className="mt-auto">
                    {!isAvailable ? (
                        /* Out of Stock State */
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 text-gray-400">
                                <span className="text-sm sm:text-base md:text-lg">{currency}{product.offerPrice || product.price}</span>
                                {product.offerPrice < product.price && <span className="text-xs sm:text-sm line-through">{currency}{product.price}</span>}
                            </div>
                        </div>
                    ) : !isInCart ? (
                        /* Add to Cart State */
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 min-w-0 flex-1">
                                <span className="text-sm sm:text-base md:text-lg text-gray-900 truncate">{currency}{product.offerPrice || product.price}</span>
                                {product.offerPrice < product.price && <span className="text-xs sm:text-sm text-gray-400 line-through">{currency}{product.price}</span>}
                            </div>
                            <div className="flex flex-col items-center flex-shrink-0">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart}
                                    className={`p-2 rounded-full flex items-center justify-center transition-all duration-200 ${isAddingToCart ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-sky-300/70 text-white active:scale-95"}`}
                                    aria-label="Add to cart"
                                >
                                    <IoMdAdd className="h-4 w-4 md:h-5 md:w-5" />
                                </button>
                                {/* --- INVENTORY: Stock Quantity Display --- */}
                                <span className={`text-[10px] text-gray-500 mt-1 whitespace-nowrap ${product.stock <= 10 ? 'text-amber-600 font-semibold' : ''}`}>
                                    {product.stock} in stock
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* In Cart State */
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 min-w-0 flex-1">
                                <span className="text-sm sm:text-base text-gray-900 truncate">{currency}{product.offerPrice || product.price}</span>
                                {product.offerPrice < product.price && <span className="text-xs sm:text-sm text-gray-400 line-through">{currency}{product.price}</span>}
                            </div>
                             <div className="flex flex-col items-center flex-shrink-0">
                                <button
                                    onClick={handleViewItem}
                                    className="p-2 rounded-full flex items-center justify-center bg-green-400/80 text-white text-xs md:text-sm"
                                    aria-label="View item in cart"
                                >
                                    <GoCheck className="h-4 w-4 md:h-5 md:w-5" />
                                </button>
                                {/* --- INVENTORY: Stock Quantity Display --- */}
                                <span className={`text-[10px] text-gray-500 mt-1 whitespace-nowrap ${product.stock <= 10 ? 'text-amber-600 font-semibold' : ''}`}>
                                    {product.stock} in stock
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;

