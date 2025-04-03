"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { FaShoppingCart, FaChevronLeft, FaChevronUp, FaChevronDown } from "react-icons/fa";
import { useClerk } from "@clerk/nextjs";

const CartPopup = () => {
  const {
    currency,
    showCartPopup,
    setShowCartPopup,
    handlePayClick,
    getCartCount,
    cartItems,
    products,
    user,
  } = useAppContext();

  const { openSignIn } = useClerk();
  const [expanded, setExpanded] = useState(false);
  const cartItemsContainerRef = useRef(null);

  // Get the first two products in the cart for the collapsed view
  const firstCartItems = Object.entries(cartItems).slice(0, 2);

  const collapsedItems = firstCartItems.map(([productId, quantity]) => {
    const product = products.find((p) => p._id === productId);
    return product ? { name: product.name, quantity, price: (product.offerPrice || product.price) * quantity } : null;
  }).filter(Boolean);

  // Calculate total items in cart
  const totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  // Calculate remaining items beyond the first two
  const remainingItems = totalItems - firstCartItems.reduce((sum, [, qty]) => sum + qty, 0);

  // Calculate total price
  const totalPrice = Object.entries(cartItems).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p._id === productId);
    return sum + (product ? (product.offerPrice || product.price) * quantity : 0);
  }, 0);

  useEffect(() => {
    // Scroll to the bottom when cartItems changes and cart is expanded
    if (expanded && cartItemsContainerRef.current) {
      cartItemsContainerRef.current.scrollTop = cartItemsContainerRef.current.scrollHeight;
    }
  }, [cartItems, expanded]);

  if (!showCartPopup || getCartCount() <= 0) return null;

  const handleCheckout = () => {
    if (user) {
      setShowCartPopup(false);
      handlePayClick();
    } else {
      openSignIn();
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="cart-popup fixed bottom-0 bg-white shadow-lg z-50 border-t-2 border-dashed border-transparent animate-slideUp rounded-t-md w-full max-w-md mx-auto left-0 right-0">
      <div className="p-4 bg-white text-gray-800 font-mono text-sm relative">
        <div className="border-b border-dashed border-gray-400 pb-2 flex justify-between items-center">
          <h3 className="font-playfair text-center flex-1">RECEIPT</h3>
          <button onClick={toggleExpanded} className="text-gray-600 hover:text-gray-800 transition-colors">
            {expanded ? <FaChevronDown size={14} /> : <FaChevronUp size={14} />}
          </button>
        </div>

        {expanded ? (
          <>
            <div
              ref={cartItemsContainerRef}
              className="mt-2 space-y-2 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
            >
              {Object.entries(cartItems).map(([productId, quantity]) => {
                const product = products.find((p) => p._id === productId);
                if (!product) return null;
                return (
                  <div
                    key={productId}
                    className="flex justify-between text-xs border-b border-dashed border-gray-300 pb-1"
                  >
                    <span>{product.name} x{quantity}</span>
                    <span>
                      {currency}
                      {((product.offerPrice || product.price) * quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between text-sm border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span>{currency}{totalPrice.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <div className="mt-2 border-b border-dashed border-gray-300 pb-2">
            {collapsedItems.length > 0 ? (
              <>
                {collapsedItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{currency}{item.price.toFixed(2)}</span>
                  </div>
                ))}
                {remainingItems > 0 && (
                  <div className="text-xs text-gray-500 text-right">+ {remainingItems} more</div>
                )}
              </>
            ) : (
              <div className="text-xs text-center text-gray-500">Your cart is empty</div>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowCartPopup(false)}
            className="flex-1 px-4 py-2 border border-sky-200 text-sky-300/70 rounded-md flex items-center justify-center"
          >
            <FaChevronLeft className="mr-2" size={12} />
            Continue
          </button>

          <button
            onClick={handleCheckout}
            className="flex-1 px-4 py-2 bg-sky-300/70 text-white rounded-md hover:bg-sky-300/70 flex items-center justify-center"
          >
            <FaShoppingCart className="mr-2" size={12} />
            Checkout
          </button>
        </div>
      </div>

      <style jsx>{`
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CartPopup;
