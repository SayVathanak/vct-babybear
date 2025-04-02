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
  const { openSignIn } = useClerk();

  if (!product) return null;

  const currentQuantity = cartItems[product._id] || 0;
  const isInCart = currentQuantity > 0;

  const handleAddToCart = () => {
    addToCart(product._id);
    setShowCartPopup(true);
  };

  const increaseQty = () => {
    addToCart(product._id);
  };

  const decreaseQty = () => {
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

  return (
    <>
      <div className="flex flex-col items-start gap-0.5 max-w-[200px] w-full cursor-pointer">
        {/* Product image and details (unchanged) */}
        <div className="cursor-pointer group relative bg-transparent w-full h-52 flex items-center justify-center">
          <Image
            onClick={() => {
              router.push("/product/" + product._id);
              scrollTo(0, 0);
            }}
            src={product.image?.[0] || "/fallback-image.jpg"}
            alt={product.name || "Product Image"}
            className="group-hover:scale-105 transition object-cover w-4/5 h-4/5 md:w-full md:h-full"
            width={800}
            height={800}
          />
          <button className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md">
            <Image
              className="h-3 w-3"
              src={assets.heart_icon}
              alt="heart_icon"
            />
          </button>
        </div>

        <p className="md:text-base font-medium pt-2 w-full truncate">
          {product.name}
        </p>
        <p className="w-full text-xs text-gray-500/70 max-sm:hidden truncate">
          {product.description || "No description available"}
        </p>

        <div className="flex flex-col items-start justify-between w-full mt-1 gap-2">
          <p className="text-base font-medium">
            {currency}
            {product.offerPrice || product.price}
            <span className="text-xs font-normal text-sky-200 line-through ml-2">
              ${product.price}
            </span>
          </p>

          {!isInCart ? (
            <button
              onClick={handleAddToCart}
              className="add-to-cart-btn w-full px-4 py-2 text-white bg-sky-300/70 rounded-sm text-sm flex items-center justify-center"
            >
              <FaShoppingCart className="mr-2" size={12} />
              Add to Cart
            </button>
          ) : (
            <div className="quantity-selector w-full flex items-center justify-between border rounded-md">
              <button
                onClick={decreaseQty}
                className="px-4 py-2 text-gray-600 flex-1 text-center"
              >
                <FaMinus className="w-2.5 h-2.5 inline-block" />
              </button>
              <span className="px-4 py-2 flex-1 text-center">{currentQuantity}</span>
              <button
                onClick={increaseQty}
                className="px-4 py-2 text-gray-600 flex-1 text-center"
              >
                <FaPlus className="w-2.5 h-2.5 inline-block" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart popup - now using context data */}
      {showCartPopup && getCartCount() > 0 && (
        <div className="cart-popup fixed left-0 right-0 bottom-0 bg-white shadow-lg z-50 border-t-2 border-dashed border-gray-200">
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
    </>
  );
};

export default ProductCard;