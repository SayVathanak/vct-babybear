"use client";
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { FaShoppingCart, FaChevronLeft, FaPlus, FaMinus } from "react-icons/fa";

// Create a global state to manage cart popup visibility and items
// This should be moved to your AppContext or a separate CartContext
// For demonstration, I'll use a simple approach with component state
let globalCartItems = [];
let showGlobalCart = false;
let setGlobalCartVisibility = null;

const ProductCard = ({ product }) => {
    const { currency, router, addToCart, cart } = useAppContext();
    const [quantity, setQuantity] = useState(0);
    const [showQuantitySelector, setShowQuantitySelector] = useState(false);
    
    // Initialize the global cart visibility setter if not already set
    const [, forceUpdate] = useState({});
    useEffect(() => {
        if (!setGlobalCartVisibility) {
            setGlobalCartVisibility = (visible) => {
                showGlobalCart = visible;
                forceUpdate({});
            };
        }
    }, []);

    if (!product) return null; // Prevent errors if product is undefined

    const handleAddToCart = () => {
        if (!showQuantitySelector) {
            // Show quantity selector
            setShowQuantitySelector(true);
            setQuantity(1);
            
            // Add the product to cart
            addToCart(product._id);
            
            // Update global cart items
            const existingItemIndex = globalCartItems.findIndex(item => item.id === product._id);
            if (existingItemIndex >= 0) {
                globalCartItems[existingItemIndex].quantity += 1;
            } else {
                globalCartItems.push({
                    id: product._id,
                    price: product.offerPrice || product.price,
                    quantity: 1
                });
            }
            
            // Show the global cart popup
            setGlobalCartVisibility(true);
        }
    };

    const increaseQty = () => {
        setQuantity(prev => {
            const newQuantity = prev + 1;
            
            // Add one more of this product to cart
            addToCart(product._id);
            
            // Update global cart items
            updateGlobalCartItems(product._id, newQuantity);
            
            return newQuantity;
        });
    };
    
    const decreaseQty = () => {
        setQuantity(prev => {
            const newQuantity = prev - 1;
            
            // If quantity becomes 0, revert back to "Add to cart" button
            if (newQuantity <= 0) {
                setShowQuantitySelector(false);
                
                // Remove this product from global cart items
                globalCartItems = globalCartItems.filter(item => item.id !== product._id);
                
                // Hide global cart if empty
                if (globalCartItems.length === 0) {
                    setGlobalCartVisibility(false);
                }
                
                return 0;
            }
            
            // Update global cart items
            updateGlobalCartItems(product._id, newQuantity);
            
            return newQuantity;
        });
    };

    const updateGlobalCartItems = (productId, newQuantity) => {
        const existingItemIndex = globalCartItems.findIndex(item => item.id === productId);
        
        if (existingItemIndex >= 0) {
            globalCartItems[existingItemIndex].quantity = newQuantity;
        }
        
        // Force update to reflect changes
        forceUpdate({});
    };

    const handlePayClick = () => {
        // Navigate to cart page
        router.push("/cart");
    };

    // Reset state when changing products
    useEffect(() => {
        setShowQuantitySelector(false);
        
        // Check if this product is in the global cart and set quantity accordingly
        const existingItem = globalCartItems.find(item => item.id === product._id);
        if (existingItem) {
            setQuantity(existingItem.quantity);
            setShowQuantitySelector(true);
        } else {
            setQuantity(0);
        }
    }, [product._id]);

    // Calculate total items in the global cart
    const totalItems = globalCartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate total price in the global cart
    const totalPrice = globalCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <>
            <div className="flex flex-col items-start gap-0.5 max-w-[200px] w-full cursor-pointer">
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

                <p className="md:text-base font-medium pt-2 w-full truncate">{product.name}</p>
                <p className="w-full text-xs text-gray-500/70 max-sm:hidden truncate">
                    {product.description || "No description available"}
                </p>

                <div className="flex flex-col items-start justify-between w-full mt-1 gap-2">
                    <p className="text-base font-medium">
                        {currency}{product.offerPrice || product.price}
                        <span className="text-xs font-normal text-sky-200 line-through ml-2">
                            ${product.price}
                        </span>
                    </p>
                    
                    {!showQuantitySelector ? (
                        // Show "Add to Cart" button when not in quantity selector mode
                        <button
                            onClick={handleAddToCart}
                            className="add-to-cart-btn w-full px-4 py-2.5 text-white bg-sky-200/70 rounded-sm text-sm flex items-center justify-center"
                        >
                            <FaShoppingCart className="mr-2" size={12} />
                            Add to Cart
                        </button>
                    ) : (
                        // Show quantity selector without Add button
                        <div className="quantity-selector w-full flex items-center justify-between border rounded-md">
    <button 
        onClick={decreaseQty} 
        className="px-4 py-2 text-gray-600 hover:bg-gray-100 flex-1 text-center"
    >
        <FaMinus className="w-3 h-3 inline-block" />
    </button>
    <span className="px-4 py-2 flex-1 text-center">{quantity}</span>
    <button 
        onClick={increaseQty} 
        className="px-4 py-2 text-gray-600 hover:bg-gray-100 flex-1 text-center"
    >
        <FaPlus className="w-3 h-3 inline-block" />
    </button>
</div>
                    )}
                </div>
            </div>

            {/* Global Cart popup at bottom of screen - shared across all products */}
            {showGlobalCart && totalItems > 0 && (
                <div className="cart-popup fixed left-0 right-0 bottom-0 bg-white shadow-lg z-50 border-t border-gray-200">
                    <div className="p-4 max-w-md mx-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="bg-sky-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                                    <span className="text-xs font-semibold">{totalItems}</span>
                                </div>
                                <span className="text-sm font-medium">Items</span>
                            </div>
                            
                            <div className="text-sm font-medium">
                                Total: {currency}{totalPrice.toFixed(2)}
                            </div>
                        </div>
                        
                        <div className="mt-3 flex gap-2">
                            <button 
                                onClick={() => setGlobalCartVisibility(false)}
                                className="flex-1 px-4 py-2 border border-sky-200 text-sky-500 rounded-md hover:bg-sky-50 text-sm font-medium flex items-center justify-center"
                            >
                                <FaChevronLeft className="mr-2" size={12} />
                                Continue
                            </button>
                            
                            <button 
                                onClick={handlePayClick} 
                                className="flex-1 px-4 py-2 bg-sky-200/70 text-white rounded-md hover:bg-sky-300/70 text-sm font-medium flex items-center justify-center"
                            >
                                <FaShoppingCart className="mr-2" size={12} />
                                Pay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductCard;