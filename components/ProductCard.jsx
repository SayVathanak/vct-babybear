"use client";
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { FaShoppingCart, FaChevronLeft, FaPlus, FaMinus } from "react-icons/fa";
import { useClerk } from "@clerk/nextjs";
import toast from "react-hot-toast";

const ProductCard = ({ product }) => {
  const {
    currency,
    router,
    addToCart,
    cartItems,
    updateCartQuantity,
    getCartCount,
    getCartAmount,
    user
  } = useAppContext();

  const [showCartPopup, setShowCartPopup] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { openSignIn } = useClerk();

  // Close cart popup after certain time
  useEffect(() => {
    let timer;
    if (showCartPopup) {
      timer = setTimeout(() => {
        setShowCartPopup(false);
      }, 5000); // Auto close after 5 seconds
    }
    return () => clearTimeout(timer);
  }, [showCartPopup]);

  if (!product) return null;

  const currentQuantity = cartItems[product._id] || 0;
  const isInCart = currentQuantity > 0;

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault(); // Prevent default behavior
    
    setIsAddingToCart(true);
    
    // Show loading state briefly
    setTimeout(() => {
      addToCart(product._id);
      setShowCartPopup(true);
      setIsAddingToCart(false);
    }, 300);
  };

  const increaseQty = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault(); // Prevent default behavior
    addToCart(product._id);
  };

  const decreaseQty = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault(); // Prevent default behavior
    updateCartQuantity(product._id, currentQuantity - 1);
  };

  const handlePayClick = () => {
    if (user) {
      router.push("/cart");
    } else {
      toast.error("Please login to continue purchasing");
      openSignIn();
    }
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

          {!isInCart ? (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`add-to-cart-btn w-full px-4 py-2 text-white bg-sky-300/70 rounded-sm text-sm flex items-center justify-center transition-all ${
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
            <div className="quantity-selector w-full flex items-center justify-between border rounded-md">
              <button
                onClick={decreaseQty}
                className="px-4 py-2 text-gray-600 flex-1 text-center hover:bg-gray-100"
              >
                <FaMinus className="w-2.5 h-2.5 inline-block" />
              </button>
              <span className="px-4 py-2 flex-1 text-center">{currentQuantity}</span>
              <button
                onClick={increaseQty}
                className="px-4 py-2 text-gray-600 flex-1 text-center hover:bg-gray-100"
              >
                <FaPlus className="w-2.5 h-2.5 inline-block" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart popup - now using context data */}
      {showCartPopup && getCartCount() > 0 && (
        <div className="cart-popup fixed left-0 right-0 bottom-0 bg-white shadow-lg z-50 border-t-2 border-dashed border-gray-200 animate-slideUp">
          <div className="p-4 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm">
                  Quantity: {getCartCount()} Items
                </span>
              </div>

              <div className="text-sm">
                Total: {currency}
                {getCartAmount().toFixed(2)}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowCartPopup(false)}
                className="flex-1 px-4 py-2 border border-sky-200 text-sky-500 rounded-md hover:bg-sky-50 text-sm font-medium flex items-center justify-center"
              >
                <FaChevronLeft className="mr-2" size={12} />
                Continue
              </button>

              <button
                onClick={handlePayClick}
                className="flex-1 px-4 py-2 bg-sky-300/70 text-white rounded-md hover:bg-sky-200/70 text-sm font-medium flex items-center justify-center"
              >
                <FaShoppingCart className="mr-2" size={12} />
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ProductCard;