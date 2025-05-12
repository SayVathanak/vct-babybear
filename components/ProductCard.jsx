"use client";
import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { FaShoppingCart, FaChevronLeft, FaPlus, FaMinus } from "react-icons/fa";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
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
    const isAvailable = product.isAvailable !== false; // If undefined, treat as available

    // Calculate discount percentage
    const calculateDiscount = () => {
        if (!product.price || !product.offerPrice) return 0;
        const discount = ((product.price - product.offerPrice) / product.price) * 100;
        return Math.round(discount);
    };

    const discountPercentage = calculateDiscount();

    const handleAddToCart = (e) => {
        e.stopPropagation(); // Prevent event bubbling
        e.preventDefault(); // Prevent default behavior

        if (!isAvailable) {
            toast.error("This product is currently not available");
            return;
        }

        addToCart(product._id);
        toast.success("Added to cart");
    };

    // Handle card click to navigate to product detail
    const handleCardClick = (e) => {
        // Only navigate if not clicking on interactive elements
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
        <div className="group flex flex-col rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition duration-300">
            {/* Product image container */}
            <div
                className={`cursor-pointer relative bg-white w-full h-52 flex items-center justify-center overflow-hidden ${!isAvailable ? 'opacity-70' : ''
                    }`}
                onClick={handleCardClick}
            >
                {/* Discount badge */}
                {discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                        {discountPercentage}% OFF
                    </div>
                )}

                {/* Product image */}
                <Image
                    src={product.image?.[0] || "/fallback-image.jpg"}
                    alt={product.name || "Product Image"}
                    className="group-hover:scale-105 transition-transform duration-500 object-contain w-4/5 h-4/5"
                    width={800}
                    height={800}
                />

                {/* Out of stock overlay */}
                {/* {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
            <span className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium transform rotate-[-20deg]">
              Out of Stock
            </span>
          </div>
        )} */}

                {/* Wishlist button */}
                <button
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={handleWishlist}
                    aria-label="Add to wishlist"
                >
                    <Image
                        className="h-3 w-3"
                        src={assets.heart_icon}
                        alt="Add to wishlist"
                    />
                </button>
            </div>

            {/* Product info section */}
            <div className="flex flex-col p-3 flex-grow">
                {/* Category */}
                {/* <p className="text-xs text-gray-500 mb-1">
          {product.category || "General"}
        </p> */}

                {/* Product name */}
                <h3
                    className={`text-sm md:text-base font-medium mb-1 line-clamp-2 cursor-pointer hover:text-sky-600 transition ${!isAvailable ? 'text-gray-400' : 'text-gray-800'
                        }`}
                    onClick={handleCardClick}
                >
                    {product.name}
                </h3>

                {/* Product description - hidden on small screens */}
                <p className="w-full text-xs text-gray-500 max-sm:hidden line-clamp-1 mb-2">
                    {product.description || "No description available"}
                </p>

                {/* Price and availability */}
                <div className="flex items-center justify-between mb-3 mt-auto">
                    <div className="flex flex-col">
                        <div className={`flex items-center ${!isAvailable ? 'text-gray-400' : 'text-gray-900'}`}>
                            <span className="text-base font-medium">
                                {currency}
                                {product.offerPrice || product.price}
                            </span>
                            {product.offerPrice < product.price && (
                                <span className="text-xs font-normal text-red-400 line-through ml-2">
                                    ${product.price}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Availability indicator */}
                    {isAvailable ? (
                        <div className="text-green-600 text-xs flex items-center">
                            <IoMdCheckmarkCircleOutline className="mr-1" />
                            <span>In Stock</span>
                        </div>
                    ) : (
                        <div className="text-red-500 text-xs flex items-center">
                            <MdOutlineError className="mr-1" />
                            <span>Out of Stock</span>
                        </div>
                    )}
                </div>

                {/* Add to cart or quantity selector */}
                <div className="w-full h-[38px]">
                    {!isAvailable ? (
                        <button
                            disabled
                            className="w-full px-4 py-2 text-gray-400 bg-gray-100 border border-gray-200 rounded-md text-sm flex items-center justify-center cursor-not-allowed"
                        >
                            Not Available
                        </button>
                    ) : !isInCart ? (
                        <button
                            onClick={handleAddToCart}
                            disabled={isAddingToCart}
                            className={`w-full px-4 py-2 text-white rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${isAddingToCart
                                ? "bg-sky-300/70 opacity-70"
                                : "bg-sky-500 active:bg-sky-600 focus:bg-sky-600"
                                }`}
                        >
                            {isAddingToCart ? (
                                <span className="flex items-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Adding...
                                </span>
                            ) : (
                                <>
                                    <FaShoppingCart className="mr-2" size={12} />
                                    Add to Cart
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="quantity-selector w-full h-full flex items-center justify-between border border-sky-200 rounded-md bg-white">
                            <button
                                onClick={(e) => decreaseQty(product._id, currentQuantity, e)}
                                className="px-4 py-2 text-sky-500 flex-1 text-center active:bg-sky-100"
                                aria-label="Decrease quantity"
                            >
                                <FaMinus className="w-2.5 h-2.5 inline-block" />
                            </button>
                            <span className="px-4 py-2 flex-1 text-center font-medium">{currentQuantity}</span>
                            <button
                                onClick={(e) => increaseQty(product._id, e)}
                                className="px-4 py-2 text-sky-500 flex-1 text-center active:bg-sky-100"
                                aria-label="Increase quantity"
                            >
                                <FaPlus className="w-2.5 h-2.5 inline-block" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;