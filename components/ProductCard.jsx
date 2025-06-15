"use client";
import React from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { FaPlus, FaMinus } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { IoHeartOutline } from "react-icons/io5";
import { MdOutlineError } from "react-icons/md";
import toast from "react-hot-toast";

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
        <div className="flex flex-col bg-white rounded-md overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 w-full h-full">
            <div
                className={`cursor-pointer relative bg-white w-full h-36 sm:h-48 flex items-center justify-center overflow-hidden ${!isAvailable ? 'opacity-70' : ''}`}
                onClick={handleCardClick}
            >
                {discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs z-10">
                        -{discountPercentage}%
                    </div>
                )}
                <button
                    className="absolute top-2 right-2 bg-white p-1.5 sm:p-2 rounded-full shadow-sm hover:shadow-md z-10"
                    onClick={handleWishlist}
                    aria-label="Add to wishlist"
                >
                    <IoHeartOutline className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 hover:text-red-500" />
                </button>
                <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-3">
                    {/* MODIFICATION: Image dimensions changed to 80x80 */}
                    <Image
                        src={product.image?.[0] || "/fallback-image.jpg"}
                        alt={product.name || "Product Image"}
                        className="object-contain max-w-full max-h-full"
                        width={80}
                        height={80}
                        priority={false}
                        style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                    />
                </div>
                {!isAvailable && (
                    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                        <div className="text-red-500 text-xs font-medium flex items-center">
                            <MdOutlineError className="mr-1" />
                            <span>Out of Stock</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col p-3 flex-grow">
                <div className="h-5 mb-2 flex items-start">
                    <h3
                        className={`text-xs sm:text-sm font-medium cursor-pointer w-full ${!isAvailable ? 'text-gray-400' : 'text-gray-800'}`}
                        onClick={handleCardClick}
                        title={product.name}
                    >
                        {truncateTitle(product.name)}
                    </h3>
                </div>

                <div className="mt-auto">
                    {!isAvailable ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1 text-gray-400">
                                <span className="text-sm sm:text-base">
                                    {currency}{product.offerPrice || product.price}
                                </span>
                                {product.offerPrice && product.offerPrice < product.price && (
                                    <span className="text-xs line-through">
                                        {currency}{product.price}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : !isInCart ? (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-baseline gap-1 sm:gap-2 text-gray-900">
                                    <span className="text-sm sm:text-base font-semibold truncate">
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
                                className={`p-1.5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${isAddingToCart
                                        ? "bg-gray-100 text-gray-400"
                                        : "bg-black text-white hover:bg-gray-800 active:scale-95"
                                    }`}
                                aria-label="Add to cart"
                            >
                                <IoMdAdd className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2">
                             <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-baseline gap-1 sm:gap-2 text-gray-900">
                                    <span className="text-sm sm:text-base font-semibold truncate">
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
                                onClick={handleViewItem}
                                className="px-3 py-1.5 rounded-full text-xs md:text-sm flex items-center justify-center transition-all duration-200 text-green-500 active:scale-95 flex-shrink-0"
                                aria-label="View item in cart"
                            >
                                Added
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
