'use client'
import React from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useAppContext } from "@/context/AppContext";
import { FaChevronLeft, FaTimes } from "react-icons/fa";

const Cart = () => {
  const { products, router, cartItems, addToCart, updateCartQuantity, getCartCount } = useAppContext();

  const decreaseQuantity = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateCartQuantity(productId, currentQuantity - 1);
    }
  };

  const isCartEmpty = getCartCount() === 0;

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
                          {/* Quantity */}
                          <div className="flex items-center mb-2 sm:mb-0">
                            <span className="text-xs sm:text-sm md:text-base uppercase tracking-wider mr-3 sm:mr-4 text-gray-600">
                              Quantity
                            </span>
                            <div className="flex items-center">
                              <button
                                className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-sm md:text-base"
                                onClick={() => decreaseQuantity(product._id, cartItems[itemId])}
                                disabled={cartItems[itemId] <= 1}
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="mx-3 text-sm md:text-base">{cartItems[itemId]}</span>
                              <button
                                className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-sm md:text-base"
                                onClick={() => addToCart(product._id)}
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
                            <span className="text-sm md:text-lg ml-2">
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
                className="group flex items-center text-black"
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
