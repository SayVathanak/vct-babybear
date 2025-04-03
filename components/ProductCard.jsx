"use client";
import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { FaShoppingCart, FaChevronLeft, FaPlus, FaMinus } from "react-icons/fa";
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

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault(); // Prevent default behavior
    addToCart(product._id);
  };

  // Handle card click to navigate to product detail
  const handleCardClick = () => {
    router.push("/product/" + product._id);
    scrollTo(0, 0);
  };

  return (
    <>
      <div className="flex flex-col items-start gap-0.5 max-w-[200px] w-full">
        {/* Product image and details */}
        <div className="cursor-pointer group relative bg-transparent w-full h-52 flex items-center justify-center" onClick={handleCardClick}>
          <Image
            src={product.image?.[0] || "/fallback-image.jpg"}
            alt={product.name || "Product Image"}
            className="group-hover:scale-105 transition object-cover w-4/5 h-4/5 md:w-full md:h-full"
            width={800}
            height={800}
          />
          <button 
            className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toast.success("Added to wishlist");
            }}
          >
            <Image
              className="h-3 w-3"
              src={assets.heart_icon}
              alt="heart_icon"
            />
          </button>
        </div>

        <p className="md:text-base font-medium pt-2 w-full truncate cursor-pointer" onClick={handleCardClick}>
          {product.name}
        </p>
        <p className="w-full text-xs text-gray-500/70 max-sm:hidden truncate cursor-pointer" onClick={handleCardClick}>
          {product.description || "No description available"}
        </p>

        <div className="flex flex-col items-start justify-between w-full mt-1 gap-2">
          <p className="text-base font-medium cursor-pointer" onClick={handleCardClick}>
            {currency}
            {product.offerPrice || product.price}
            <span className="text-xs font-normal text-sky-200 line-through ml-2">
              ${product.price}
            </span>
          </p>

          <div className="w-full h-[38px]"> {/* Set a fixed height that matches your button height */}
          {!isInCart ? (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`add-to-cart-btn w-full px-4 py-2 text-white bg-sky-300/70 rounded-md text-sm flex items-center justify-center transition-all ${
                isAddingToCart ? "opacity-70" : "hover:bg-sky-400/70"
              }`}
            >
              {isAddingToCart ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
            <div className="quantity-selector w-full h-full flex items-center justify-between border rounded-md">
              <button 
                onClick={(e) => decreaseQty(product._id, currentQuantity, e)}
                className="px-4 py-2 text-gray-600 flex-1 text-center"
              >
                <FaMinus className="w-2.5 h-2.5 inline-block" />
              </button>
              <span className="px-4 py-2 flex-1 text-center">{currentQuantity}</span>
              <button
                onClick={(e) => increaseQty(product._id, e)}
                className="px-4 py-2 text-gray-600 flex-1 text-center"
              >
                <FaPlus className="w-2.5 h-2.5 inline-block" />
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default ProductCard;