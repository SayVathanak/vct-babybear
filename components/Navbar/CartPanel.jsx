// components/Navbar/CartPanel.jsx
import React, { useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiShoppingCart, FiPlus, FiMinus } from "react-icons/fi";
import { useAppContext } from "@/context/AppContext";
import { useClerk } from "@clerk/nextjs";
import InstallButton from "../InstallButton";

const CartPanel = ({ isOpen, onClose }) => {
    const cartPanelRef = useRef(null);
    const {
        user,
        currency,
        products,
        cartItems,
        getCartCount,
        increaseQty,
        decreaseQty,
        handlePayClick,
        router,
    } = useAppContext();
    const { openSignIn } = useClerk();

    const cartCount = getCartCount();

    // Calculate cart total
    const calculateCartTotal = useCallback(() => {
        if (!cartItems) return 0;
        return Object.entries(cartItems).reduce((sum, [productId, quantity]) => {
            const product = products.find((p) => p._id === productId);
            return sum + (product ? (product.offerPrice || product.price) * quantity : 0);
        }, 0);
    }, [cartItems, products]);

    // Get cart items with product details
    const getCartItemsWithDetails = useCallback(() => {
        if (!cartItems || !products || products.length === 0) return [];
        return Object.entries(cartItems)
            .map(([productId, quantity]) => {
                const product = products.find((p) => p._id === productId);
                return product ? { product, quantity } : null;
            })
            .filter(Boolean);
    }, [cartItems, products]);

    const handleCheckout = () => {
        if (user) {
            onClose();
            handlePayClick();
        } else {
            openSignIn();
        }
    };

    const cartItemsWithDetails = getCartItemsWithDetails();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/30 z-50"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        ref={cartPanelRef}
                        className="fixed top-0 right-0 w-80 sm:w-96 max-w-full h-full bg-white shadow-xl flex flex-col overflow-hidden"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-dashed border-gray-300 flex justify-between items-center">
                            <h2 className="text-lg font-medium font-playfair flex-1 text-center">RECEIPT</h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="Close cart"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                            {cartCount > 0 ? (
                                <div className="space-y-2">
                                    <div className="mt-2 space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                                        {cartItemsWithDetails.length > 0 ? (
                                            cartItemsWithDetails.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center text-xs border-b border-dashed border-gray-300 pb-2 pt-1"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="truncate max-w-[180px]">{item.product.name}</span>
                                                            <span className="ml-2">
                                                                {currency}{((item.product.offerPrice || item.product.price) * item.quantity).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    decreaseQty(item.product._id, item.quantity);
                                                                }}
                                                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                                            >
                                                                <FiMinus size={12} />
                                                            </button>
                                                            <span className="mx-2 min-w-[20px] text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    increaseQty(item.product._id);
                                                                }}
                                                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                                            >
                                                                <FiPlus size={12} />
                                                            </button>
                                                            <span className="ml-2 text-gray-500">
                                                                @ {currency}{(item.product.offerPrice || item.product.price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <p>Your cart is empty</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total */}
                                    <div className="mt-4 border-t border-dashed border-gray-300 pt-3 pb-1">
                                        <div className="flex justify-between font-medium">
                                            <span>Total:</span>
                                            <span>{currency}{calculateCartTotal().toFixed(2)}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            <p>Delivery calculated at checkout</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <div className="mb-4 text-gray-300">
                                        <FiShoppingCart size={48} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-1">Your cart is empty</h3>
                                    <p className="text-gray-500 mb-4 text-xs">Discover our quality products for your little one</p>
                                    <button
                                        onClick={() => {
                                            router.push("/all-products");
                                            onClose();
                                        }}
                                        className="bg-sky-300/70 hover:bg-sky-400/70 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Checkout Button */}
                        {cartCount > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-sky-300/70 hover:bg-sky-400/70 text-white font-medium py-3 rounded-md transition-colors"
                                >
                                    {user ? "Proceed to Checkout" : "Sign In to Checkout"}
                                </button>
                                <div className="text-xs text-gray-500 text-center mt-2">
                                    <InstallButton/>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CartPanel;
