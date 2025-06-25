"use client";
import React from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { FaPlus, FaMinus } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { MdOutlineError } from "react-icons/md";
import toast from "react-hot-toast";
import { GoCheck } from "react-icons/go";
import { HiOutlineShoppingBag } from "react-icons/hi2";

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

    const renderStockBadge = () => {
        if (isOutOfStock) {
            return (
                <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
                    Out of Stock
                </div>
            );
        }
        
        if (isLowStock) {
            return (
                <div className="absolute top-3 left-3 px-2 py-1 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-medium rounded-full shadow-lg animate-pulse">
                    Only {stock} left!
                </div>
            );
        }
        
        return null;
    };

    const renderDiscountBadge = () => {
        if (discountPercentage > 0) {
            return (
                <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                    {discountPercentage}% OFF
                </div>
            );
        }
        return null;
    };

    return (
        <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:-translate-y-1">
            {/* Image Container */}
            <div
                className={`cursor-pointer relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden ${(!isAvailable || isOutOfStock) ? 'opacity-60' : ''}`}
                onClick={handleCardClick}
            >
                {/* Stock Badge */}
                {renderStockBadge()}
                
                {/* Discount Badge */}
                {renderDiscountBadge()}
                
                {/* Wishlist Button */}
                <button
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-20 group-hover:scale-110"
                    onClick={handleWishlist}
                    aria-label="Add to wishlist"
                >
                    <IoHeartOutline className="h-4 w-4 text-gray-600 hover:text-red-500 transition-colors duration-300" />
                </button>
                
                {/* Product Image */}
                <div className="relative w-full h-full flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-500">
                    <Image
                        src={product.image?.[0] || "/fallback-image.jpg"}
                        alt={product.name || "Product Image"}
                        className="object-contain max-w-full max-h-full drop-shadow-sm"
                        width={240}
                        height={240}
                        quality={90}
                        priority={false}
                        sizes="(max-width: 640px) 200px, (max-width: 768px) 240px, 280px"
                        style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                    />
                </div>
                
                {/* Out of Stock Overlay */}
                {(!isAvailable || isOutOfStock) && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="text-red-500 font-semibold flex items-center px-4 py-2 bg-white rounded-full shadow-lg">
                            <MdOutlineError className="mr-2 h-5 w-5" />
                            <span>Unavailable</span>
                        </div>
                    </div>
                )}

                {/* Quick Add Button - Shows on Hover */}
                {!isOutOfStock && !isInCart && (
                    <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <button
                            onClick={handleAddToCart}
                            disabled={isAddingToCart}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <HiOutlineShoppingBag className="h-5 w-5" />
                            Quick Add
                        </button>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-3">
                {/* Product Title */}
                <div className="min-h-[3rem] flex items-start">
                    <h3
                        className={`text-sm font-semibold cursor-pointer w-full line-clamp-2 leading-tight ${(!isAvailable || isOutOfStock) ? 'text-gray-400' : 'text-gray-800 hover:text-blue-600'} transition-colors duration-300`}
                        onClick={handleCardClick}
                        title={product.name}
                    >
                        {product.name}
                    </h3>
                </div>

                {/* Stock Status */}
                <div className="flex items-center min-h-[1.5rem]">
                    {stock > 5 && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            {stock} in stock
                        </span>
                    )}
                    {isLowStock && (
                        <span className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mr-1 animate-pulse"></div>
                            Only {stock} left
                        </span>
                    )}
                </div>

                {/* Price and Action Section */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                        {/* Current Price */}
                        <div className="flex items-baseline gap-2">
                            <span className={`text-lg font-bold ${(!isAvailable || isOutOfStock) ? 'text-gray-400' : 'text-gray-900'}`}>
                                {currency}{product.offerPrice || product.price}
                            </span>
                            {product.offerPrice && product.offerPrice < product.price && (
                                <span className="text-sm text-gray-400 line-through">
                                    {currency}{product.price}
                                </span>
                            )}
                        </div>
                        
                        {/* Savings */}
                        {product.offerPrice && product.offerPrice < product.price && (
                            <span className="text-xs text-green-600 font-medium">
                                Save {currency}{product.price - product.offerPrice}
                            </span>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center">
                        {(!isAvailable || isOutOfStock) ? (
                            <button
                                disabled
                                className="p-3 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed"
                            >
                                <IoMdAdd className="h-5 w-5" />
                            </button>
                        ) : !isInCart ? (
                            <button
                                onClick={handleAddToCart}
                                disabled={isAddingToCart}
                                className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                aria-label="Add to cart"
                            >
                                {isAddingToCart ? (
                                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <IoMdAdd className="h-5 w-5" />
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleViewItem}
                                className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                                aria-label="View in cart"
                            >
                                <GoCheck className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* In Cart Indicator */}
                {isInCart && (
                    <div className="flex items-center justify-center py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg">
                        <GoCheck className="h-4 w-4 mr-1" />
                        Added to Cart
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;