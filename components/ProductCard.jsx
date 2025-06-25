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
    const stock = product.stock || 0;
    const isLowStock = stock > 0 && stock <= 5;
    const isOutOfStock = stock === 0;

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

    const truncateTitle = (title, maxLength = 18) => {
        if (title.length > maxLength) {
            return title.substring(0, maxLength) + '...';
        }
        return title;
    };

    const renderStockIndicator = () => {
        if (isOutOfStock) {
            return (
                <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full leading-none">
                    Out of stock
                </span>
            );
        }
        
        if (isLowStock) {
            return (
                <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-full leading-none">
                    Only {stock} left
                </span>
            );
        }
        
        if (stock > 5) {
            return (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full leading-none">
                    {stock} in stock
                </span>
            );
        }
        
        return null;
    };

    return (
        <div className="group flex flex-col bg-white overflow-hidden transition-all duration-300 w-full h-full">
            {/* Image Container - Fixed aspect ratio for consistency */}
            <div
                className={`cursor-pointer relative bg-white w-full aspect-square flex items-center justify-center overflow-hidden ${(!isAvailable || isOutOfStock) ? 'opacity-70' : ''}`}
                onClick={handleCardClick}
            >
                {/* Discount Badge - Compact positioning */}
                {discountPercentage > 0 && (
                    <div className="absolute top-1 left-1 bg-red-500 text-white px-1 py-0.5 rounded text-[10px] font-medium z-10">
                        -{discountPercentage}%
                    </div>
                )}
                
                {/* Wishlist Button - Compact sizing */}
                <button
                    className="absolute top-1 right-1 bg-white p-1 rounded-full shadow-sm hover:shadow-md transition-all duration-200 z-10"
                    onClick={handleWishlist}
                    aria-label="Add to wishlist"
                >
                    <IoHeartOutline className="h-3 w-3 text-gray-600 hover:text-red-500 transition-colors" />
                </button>
                
                {/* Image Container - Minimal padding for compact design */}
                <div className="relative w-full h-full flex items-center justify-center p-2">
                    <Image
                        src={product.image?.[0] || "/fallback-image.jpg"}
                        alt={product.name || "Product Image"}
                        className="object-contain max-w-full max-h-full transition-transform duration-200"
                        width={150}
                        height={150}
                        quality={80}
                        priority={false}
                        sizes="150px"
                        style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                    />
                </div>
                
                {/* Out of Stock Overlay */}
                {(!isAvailable || isOutOfStock) && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                        <div className="text-red-500 text-[10px] font-medium flex items-center px-1.5 py-1 bg-white rounded shadow-sm">
                            <MdOutlineError className="mr-1 h-3 w-3" />
                            <span>Out of Stock</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Container - Compact spacing */}
            <div className="flex flex-col p-2 flex-grow justify-between">
                {/* Product Title - Single line with ellipsis */}
                <div className="mb-1">
                    <h3
                        className={`text-xs font-medium cursor-pointer line-clamp-2 leading-tight ${(!isAvailable || isOutOfStock) ? 'text-gray-400' : 'text-gray-800 hover:text-gray-600'} transition-colors`}
                        onClick={handleCardClick}
                        title={product.name}
                    >
                        {truncateTitle(product.name, 35)}
                    </h3>
                </div>

                {/* Stock Indicator - Minimal spacing */}
                <div className="mb-1 min-h-[14px] flex items-center">
                    {renderStockIndicator()}
                </div>

                {/* Price and Action Section - Compact layout */}
                <div className="mt-auto">
                    {(!isAvailable || isOutOfStock) ? (
                        /* Out of Stock State */
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5 text-gray-400">
                                <span className="text-sm font-medium">
                                    {currency}{product.offerPrice || product.price}
                                </span>
                                {product.offerPrice && product.offerPrice < product.price && (
                                    <span className="text-[10px] line-through">
                                        {currency}{product.price}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : !isInCart ? (
                        /* Add to Cart State */
                        <div className="flex items-center justify-between gap-1">
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                    {currency}{product.offerPrice || product.price}
                                </span>
                                {product.offerPrice && product.offerPrice < product.price && (
                                    <span className="text-[10px] text-gray-400 line-through">
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
                                <IoMdAdd className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        /* In Cart State */
                        <div className="flex items-center justify-between gap-1">
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                    {currency}{product.offerPrice || product.price}
                                </span>
                                {product.offerPrice && product.offerPrice < product.price && (
                                    <span className="text-[10px] text-gray-400 line-through">
                                        {currency}{product.price}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleViewItem}
                                className="p-2 rounded-full flex items-center justify-center bg-green-400/80 text-white flex-shrink-0"
                                aria-label="View item in cart"
                            >
                                <GoCheck className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;