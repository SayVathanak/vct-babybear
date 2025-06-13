"use client";
import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { FaPlus, FaMinus } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { MdOutlineError } from "react-icons/md";
import toast from "react-hot-toast";

const ProductCard = ({ product }) => {
    const {
        currency,
        router,
        addToCart,
        cartItems,
        showCartPopup,
        setShowCartPopup,
        isAddingToCart,
        increaseQty,
        decreaseQty,
        handlePayClick,
        getCartCount,
        getCartAmount
    } = useAppContext();

    if (!product) return null;

    const currentQuantity = cartItems[product._id] || 0;
    const isInCart = currentQuantity > 0;
    const isAvailable = product.isAvailable !== false;

    // Calculate discount percentage
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
            toast.error("This product is currently not available");
            return;
        }

        addToCart(product._id);
        toast.success("Added to cart");
    };

    const handleCardClick = (e) => {
        if (e.target.closest('button') || e.target.closest('.quantity-selector')) {
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

    return (
        <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 w-full">
            {/* Product image container */}
            <div
                className={`cursor-pointer relative bg-white w-full aspect-square sm:h-48 flex items-center justify-center overflow-hidden ${!isAvailable ? 'opacity-70' : ''}`}
                onClick={handleCardClick}
            >
                {/* Discount badge */}
                {discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                        -{discountPercentage}%
                    </div>
                )}

                {/* Wishlist button */}
                <button
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white p-1.5 sm:p-2 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 z-10"
                    onClick={handleWishlist}
                    aria-label="Add to wishlist"
                >
                    <IoHeartOutline className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 hover:text-red-500 transition-colors" />
                </button>

                {/* Product image */}
                <Image
                    src={product.image?.[0] || "/fallback-image.jpg"}
                    alt={product.name || "Product Image"}
                    className="object-contain w-full h-full p-3 sm:p-4"
                    width={400}
                    height={400}
                />

                {/* Out of stock overlay */}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                        <div className="text-red-500 text-xs sm:text-sm font-medium flex items-center">
                            <MdOutlineError className="mr-1" />
                            <span className="hidden sm:inline">Out of Stock</span>
                            <span className="sm:hidden">Unavailable</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Product info section */}
            <div className="flex flex-col p-3 sm:p-4 flex-grow">
                {/* Product name */}
                <h3
                    className={`text-sm sm:text-base font-medium mb-2 line-clamp-2 cursor-pointer leading-relaxed ${!isAvailable ? 'text-gray-400' : 'text-gray-800'}`}
                    onClick={handleCardClick}
                >
                    {product.name}
                </h3>

                {/* Price and Add to Cart / Quantity Selector */}
                <div className="mt-auto">
                    {!isAvailable ? (
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-1 sm:gap-2 text-gray-400">
                                    <span className="text-base sm:text-lg font-semibold">
                                        {currency}{product.offerPrice || product.price}
                                    </span>
                                    {product.offerPrice && product.offerPrice < product.price && (
                                        <span className="text-xs sm:text-sm text-gray-400 line-through">
                                            {currency}{product.price}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                disabled
                                className="px-3 py-1.5 text-gray-400 text-xs sm:text-sm font-medium cursor-not-allowed rounded-lg"
                            >
                                <span className="hidden sm:inline">Unavailable</span>
                                <span className="sm:hidden">N/A</span>
                            </button>
                        </div>
                    ) : !isInCart ? (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-baseline gap-1 sm:gap-2 text-gray-900">
                                    <span className="text-base sm:text-lg font-semibold truncate">
                                        {currency}{product.offerPrice || product.price}
                                    </span>
                                    {product.offerPrice && product.offerPrice < product.price && (
                                        <span className="text-xs sm:text-sm text-gray-400 line-through">
                                            {currency}{product.price}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={isAddingToCart}
                                className={`p-2 sm:p-2.5 rounded-full text-sm font-medium flex items-center justify-center transition-all duration-200 flex-shrink-0 ${isAddingToCart
                                        ? "bg-gray-100 text-gray-400"
                                        : "bg-black text-white hover:bg-gray-800 active:scale-95"
                                    }`}
                                aria-label="Add to cart"
                            >
                                {isAddingToCart ? (
                                    <svg
                                        className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                ) : (
                                    <IoMdAdd className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[1fr_1.5fr] sm:grid-cols-[1fr_2fr] gap-2 sm:gap-3 items-center">
                            {/* Price column - 1fr on mobile, 1fr on desktop */}
                            <div className="flex flex-col min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2 text-gray-900">
                                    <span className="text-base sm:text-lg font-semibold truncate">
                                        {currency}{product.offerPrice || product.price}
                                    </span>
                                    {product.offerPrice && product.offerPrice < product.price && (
                                        <span className="text-xs sm:text-sm text-gray-400 line-through">
                                            {currency}{product.price}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Quantity selector column - 1.5fr on mobile, 2fr on desktop */}
                            <div className="quantity-selector flex items-center justify-between bg-gray-50 rounded-xl p-1">
                                <button
                                    onClick={(e) => decreaseQty(product._id, currentQuantity, e)}
                                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition-colors active:scale-95 flex-shrink-0"
                                    aria-label="Decrease quantity"
                                >
                                    <FaMinus className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                </button>
                                <span className="px-2 sm:px-3 font-semibold text-gray-800 text-sm sm:text-base min-w-0 text-center">
                                    {currentQuantity}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        increaseQty(product._id, 1, e);
                                    }}
                                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 rounded-lg transition-colors active:scale-95 flex-shrink-0"
                                    aria-label="Increase quantity"
                                >
                                    <FaPlus className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;