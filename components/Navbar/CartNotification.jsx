
// components/Navbar/CartNotification.jsx
import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiShoppingCart, FiX, FiCheck } from "react-icons/fi";

const CartNotification = ({ isVisible, onClose, onViewCart }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed top-20 right-4 z-50 bg-white shadow-lg border border-gray-200 rounded-lg p-4 max-w-sm"
                    initial={{ opacity: 0, y: -20, x: 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -20, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <FiCheck className="text-green-600" size={16} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-1">Added to cart!</h4>
                            <p className="text-sm text-gray-600 mb-3">Item has been added to your cart.</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={onViewCart}
                                    className="flex items-center gap-1 bg-sky-300/70 hover:bg-sky-400/70 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                                >
                                    <FiShoppingCart size={14} />
                                    View Cart
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close notification"
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CartNotification;