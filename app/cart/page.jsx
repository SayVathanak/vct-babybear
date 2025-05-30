'use client'
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import { useAppContext } from "@/context/AppContext";
import { FaChevronLeft, FaTimes } from "react-icons/fa";

const Cart = () => {
  const { products, router, cartItems, updateCartQuantity, getCartCount } = useAppContext();
  // Initialize inputQuantities with empty object to start
  const [inputQuantities, setInputQuantities] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Only sync inputQuantities with cartItems once on initial load
  // and when cartItems changes
  useEffect(() => {
    if (cartItems) {
      const newInputQuantities = {};
      Object.keys(cartItems).forEach(itemId => {
        // Ensure all values are strings for input fields
        newInputQuantities[itemId] = cartItems[itemId].toString();
      });
      setInputQuantities(newInputQuantities);
      setIsInitialized(true);
    }
  }, [cartItems]);

  const decreaseQuantity = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1;
      updateCartQuantity(productId, newQuantity);
      setInputQuantities({
        ...inputQuantities,
        [productId]: newQuantity.toString()
      });
    }
  };

  const increaseQuantity = (productId, currentQuantity) => {
    const newQuantity = currentQuantity + 1;
    updateCartQuantity(productId, newQuantity);
    setInputQuantities({
      ...inputQuantities,
      [productId]: newQuantity.toString()
    });
  };

  const handleQuantityChange = (productId, value) => {
    // Always store input value as string
    setInputQuantities({
      ...inputQuantities,
      [productId]: value
    });
  };

  const handleQuantityBlur = (productId) => {
    // When input field loses focus, update the cart
    const inputValue = inputQuantities[productId];
    const newQuantity = parseInt(inputValue);

    if (!isNaN(newQuantity) && newQuantity > 0) {
      updateCartQuantity(productId, newQuantity);
      // Ensure the displayed value is consistent
      setInputQuantities({
        ...inputQuantities,
        [productId]: newQuantity.toString()
      });
    } else {
      // Reset the input field if value is invalid
      setInputQuantities({
        ...inputQuantities,
        [productId]: (cartItems[productId] || 0).toString()
      });
    }
  };

  const handleKeyPress = (e, productId) => {
    // Update cart when Enter key is pressed
    if (e.key === 'Enter') {
      handleQuantityBlur(productId);
    }
  };

  const isCartEmpty = getCartCount() === 0;

  // Don't render inputs until we have initialized values
  if (!isInitialized) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Loading cart...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-6 sm:gap-10 px-4 sm:px-6 md:px-16 lg:px-32 pt-8 sm:pt-14 mb-16 sm:mb-20">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6 sm:mb-8 border-b border-gray-200 pb-4 sm:pb-6">
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-500 uppercase">
              Your <span className="text-black">Cart</span>
            </p>
            <p className="text-base sm:text-lg md:text-xl text-gray-500/80">{getCartCount()} Items</p>
          </div>

          {isCartEmpty ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-6">Your cart is currently empty.</p>
              <button
                onClick={() => router.push('/all-products')}
                className="inline-flex items-center px-6 py-2 border border-gray-300 hover:border-black transition-colors"
              >
                <FaChevronLeft className="mr-2" size={12} />
                <span className="text-sm uppercase tracking-wide">Start Shopping</span>
              </button>
            </div>
          ) : (
            <div>
              {Object.keys(cartItems).map((itemId) => {
                const product = products.find(product => product._id === itemId);

                if (!product || cartItems[itemId] <= 0) return null;

                return (
                  <div key={itemId} className="mb-8 sm:mb-10 pb-8 sm:pb-10 border-b border-gray-200">
                    <div className="flex flex-row items-start justify-start md:justify-between">
                      {/* Product Image - Left */}
                      <div className="w-24 sm:w-28 md:w-36 h-32 sm:h-40 bg-gray-50 mr-4 sm:mr-6 md:mr-8 flex-shrink-0 flex items-center justify-center rounded">
                        <Image
                          src={product.image[0]}
                          alt={product.name}
                          className="w-20 sm:w-24 md:w-28 h-auto object-contain mix-blend-multiply"
                          width={112}
                          height={140}
                        />
                      </div>

                      {/* Product Details - Right */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-sm md:text-xl uppercase font-medium tracking-wider line-clamp-2">{product.name}</h2>
                            <p className="mt-1 sm:mt-2 text-gray-600">${product.offerPrice}</p>
                          </div>
                          <button
                            onClick={() => updateCartQuantity(product._id, 0)}
                            aria-label="Remove item"
                            className="text-gray-400 hover:text-black transition-colors ml-2"
                          >
                            <FaTimes size={16} />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center mt-4 sm:mt-6 sm:space-x-8 md:space-x-12">
                          {/* Improved Quantity Section */}
                          <div className="flex items-center mb-2 sm:mb-0">
                            <span className="text-xs sm:text-sm md:text-base uppercase tracking-wider mr-3 sm:mr-4 text-gray-600">
                              Quantity
                            </span>
                            <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                              <button
                                className="w-8 h-8 flex items-center justify-center text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
                                onClick={() => decreaseQuantity(product._id, cartItems[itemId])}
                                disabled={cartItems[itemId] <= 1}
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={inputQuantities[itemId] || ""}
                                onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                                onBlur={() => handleQuantityBlur(product._id)}
                                onKeyPress={(e) => handleKeyPress(e, product._id)}
                                className="w-12 h-8 text-center border-x border-gray-200 focus:outline-none"
                                aria-label="Quantity"
                              />
                              <button
                                className="w-8 h-8 flex items-center justify-center text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
                                onClick={() => increaseQuantity(product._id, cartItems[itemId])}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div className="mt-2 sm:mt-0">
                            <span className="text-xs sm:text-sm md:text-base uppercase tracking-wider mr-2 sm:mr-4 text-gray-600">
                              Subtotal
                            </span>
                            <span className="text-sm md:text-lg ml-2 font-medium">
                              ${(product.offerPrice * cartItems[itemId]).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isCartEmpty && (
            <div className="mt-4 sm:mt-6">
              <button
                onClick={() => router.push('/all-products')}
                className="group flex items-center text-black hover:text-gray-700 transition-colors"
              >
                <FaChevronLeft className="mr-1" size={12} />
                <span className="text-sm uppercase tracking-wide">Continue Shopping</span>
              </button>

              <p className="mt-2 text-xs md:text-sm text-sky-500 font-kantumruy">
                សេវាដឹកជញ្ជូនឥតគិតថ្លៃរាល់ការជាវទំនិញចាប់ពី ២​ ឡើង
              </p>
            </div>
          )}

        </div>

        <div className="w-full md:w-auto md:min-w-[320px] lg:min-w-[384px]">
          <OrderSummary />
        </div>
      </div>
    </>
  );
};

export default Cart;