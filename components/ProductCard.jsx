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
        increaseQty,
        decreaseQty,
    } = useAppContext();

    if (!product) return null;

    const currentQuantity = cartItems[product._id] || 0;
    const isInCart = currentQuantity > 0;
    const isAvailable = product.isAvailable !== false;

    // Stock quantity - default to 0 if not provided
    const stockQuantity = product.stockQuantity || product.stock || 0;
    const isLowStock = stockQuantity > 0 && stockQuantity <= 5;
    const isOutOfStock = stockQuantity <= 0;

    const calculateDiscount = () => {
        if (!product.price || !product.offerPrice) return 0;
        const discount = ((product.price - product.offerPrice) / product.price) * 100;
        return Math.round(discount);
    };

    const discountPercentage = calculateDiscount();

    const handleAddToCart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!isAvailable || isOutOfStock) {
            toast.error("This product is currently not available");
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

    // Determine stock status for display
    const getStockStatus = () => {
        if (isOutOfStock || !isAvailable) return 'out-of-stock';
        if (isLowStock) return 'low-stock';
        return 'in-stock';
    };

    const stockStatus = getStockStatus();

    return (
        <div className="flex flex-col bg-white overflow-hidden transition-all duration-300 w-full h-full min-h-[150]">
            {/* Image Container - Square aspect ratio without auto-crop */}
            <div
                className={`cursor-pointer relative bg-white w-full aspect-square flex items-center justify-center overflow-hidden ${!isAvailable || isOutOfStock ? 'opacity-70' : ''}`}
                onClick={handleCardClick}
            >
                {/* Discount Badge */}
                {discountPercentage > 0 && (
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium z-20 shadow-sm">
                        -{discountPercentage}%
                    </div>
                )}
                
                {/* Stock Quantity Overlay - Bottom Left */}
                <div className="absolute bottom-0 left-0 sm:bottom-2 sm:left-2 z-20">
                    {stockStatus === 'out-of-stock' ? (
                        <div className="bg-white opacity-0 text-red-500 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs shadow-sm">
                            Out of Stock
                        </div>
                    ) : stockStatus === 'low-stock' ? (
                        <div className="bg-white opacity-90 text-red-400 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs shadow-sm">
                            Only {stockQuantity} left
                        </div>
                    ) : (
                        <div className="bg-white opacity-90 text-green-500 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs shadow-sm">
                            {stockQuantity} in stock
                        </div>
                    )}
                </div>
                
                {/* Wishlist Button */}
                <button
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white p-1 sm:p-1.5 md:p-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200 z-20"
                    onClick={handleWishlist}
                    aria-label="Add to wishlist"
                >
                    <IoHeartOutline className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 hover:text-red-500 transition-colors" />
                </button>
                
                {/* Image Container with consistent sizing */}
                <div className="relative w-full h-full p-4">
                    <Image
                        src={product.image?.[0] || "/fallback-image.jpg"}
                        alt={product.name || "Product Image"}
                        fill
                        className="object-contain transition-transform duration-200 hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        quality={85}
                        priority={false}
                    />
                </div>
                
                {/* Out of Stock Overlay */}
                {(!isAvailable || isOutOfStock) && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                        <div className="text-red-500 text-xs sm:text-sm font-medium flex items-center px-2 py-1 bg-white rounded-lg shadow-sm">
                            <MdOutlineError className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Out of Stock</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Container - Fixed structure for consistent alignment */}
            <div className="flex flex-col p-2.5 sm:p-3 md:p-4 flex-grow">
                {/* Product Title - Fixed height container for consistent alignment */}
                <div className="mb-2 sm:mb-3 h-10 sm:h-12 md:h-12 flex items-start">
                    <h3
                        className={`text-sm md:text-base cursor-pointer w-full line-clamp-2 leading-tight ${!isAvailable || isOutOfStock ? 'text-gray-400' : 'text-gray-800 hover:text-gray-600'} transition-colors`}
                        onClick={handleCardClick}
                        title={product.name}
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.2'
                        }}
                    >
                        {product.name}
                    </h3>
                </div>

                {/* Price and Action Section - Positioned at bottom */}
                <div className="mt-auto">
                    {(!isAvailable || isOutOfStock) ? (
                        /* Out of Stock State */
                        <div className="flex items-center justify-between">
                            <div className="flex flex-row sm:items-baseline gap-0.5 sm:gap-2 text-gray-400">
                                <span className="text-sm sm:text-base md:text-lg">
                                    {currency}{product.offerPrice || product.price}
                                </span>
                                {product.offerPrice && product.offerPrice < product.price && (
                                    <span className="text-xs sm:text-sm line-through">
                                        {currency}{product.price}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : !isInCart ? (
                        /* Add to Cart State */
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-row sm:items-baseline gap-0.5 sm:gap-2 min-w-0 flex-1">
                                <span className="text-md sm:text-base md:text-lg text-gray-900 truncate">
                                    {currency}{product.offerPrice || product.price}
                                </span>
                                {product.offerPrice && product.offerPrice < product.price && (
                                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                                        {currency}{product.price}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={isAddingToCart || isOutOfStock}
                                className={`p-2 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${isAddingToCart || isOutOfStock
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-sky-300/70 text-white active:scale-95"
                                    }`}
                                aria-label="Add to cart"
                            >
                                <IoMdAdd className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        /* In Cart State */
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-row sm:items-baseline gap-0.5 sm:gap-2 min-w-0 flex-1">
                                <span className="text-sm sm:text-base text-gray-900 truncate">
                                    {currency}{product.offerPrice || product.price}
                                </span>
                                {product.offerPrice && product.offerPrice < product.price && (
                                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                                        {currency}{product.price}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleViewItem}
                                className="p-2 rounded-full flex items-center justify-center bg-green-400/80 text-white text-xs md:text-sm"
                                aria-label="View item in cart"
                            >
                                <GoCheck className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;