'use client';
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sendTelegramNotification } from "@/utils/telegram-config";
import { FaChevronDown, FaChevronUp, FaTag, FaMapMarkerAlt, FaLock, FaTimes, FaCheck } from "react-icons/fa";
import { useClerk } from "@clerk/nextjs";

const OrderSummary = () => {
  const {
    currency,
    router,
    getCartCount,
    getCartAmount,
    getToken,
    user,
    cartItems,
    setCartItems,
    products
  } = useAppContext();
  
  const { openSignIn, session } = useClerk();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  // Determine if delivery is free (more than 1 item)
  const isFreeDelivery = getCartCount() > 1;
  const deliveryFee = isFreeDelivery ? 0 : 1.5;

  const sendOrderNotifications = async (orderDetails) => {
    try {
      // Only send Telegram notification
      const telegramResult = await sendTelegramNotification(orderDetails);
      
      if (!telegramResult.success) {
        console.error("Failed to send Telegram notification:", telegramResult.error);
      } else {
        console.log("Telegram notification sent successfully");
      }
    
      return { success: telegramResult.success };
    } catch (error) {
      console.error("Error sending notifications:", error);
      return { success: false, error };
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/get-address', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch addresses");
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  // Function to validate if all required fields are filled
  const validateOrderForm = () => {
    // Check if address is selected
    if (!selectedAddress) {
      return false;
    }

    // Check if cart has items
    const cartItemsCount = getCartCount();
    if (cartItemsCount <= 0) {
      return false;
    }

    return true;
  };

  // Calculate discount based on applied promo code
  const calculateDiscount = (subtotal) => {
    if (!appliedPromo) return 0;

    let discount = 0;
    if (appliedPromo.discountType === 'percentage') {
      discount = (subtotal * appliedPromo.discountValue) / 100;
      // Apply max discount if defined
      if (appliedPromo.maxDiscountAmount && discount > appliedPromo.maxDiscountAmount) {
        discount = appliedPromo.maxDiscountAmount;
      }
    } else { // fixed amount
      discount = Math.min(appliedPromo.discountValue, subtotal); // Can't discount more than the subtotal
    }

    return Number(discount.toFixed(2));
  };

  // Calculate total amount for display and order creation
  const calculateOrderAmounts = () => {
    const subtotal = Number(getCartAmount().toFixed(2));
    const discount = calculateDiscount(subtotal);
    const total = Number((subtotal + deliveryFee - discount).toFixed(2));
    
    return {
      subtotal,
      discount,
      deliveryFee: Number(deliveryFee.toFixed(2)),
      total
    };
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    try {
      setApplyingPromo(true);
      setPromoError("");
      const token = await getToken();
      
      const { data } = await axios.post('/api/promo/validate', {
        code: promoCode,
        cartAmount: getCartAmount()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setAppliedPromo(data.promoCode);
        setPromoCode("");
        setPromoExpanded(false);
        toast.success(data.message || "Promo code applied successfully!");
      } else {
        setPromoError(data.message || "Invalid promo code");
        toast.error(data.message || "Invalid promo code");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to apply promo code";
      setPromoError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoError("");
    toast.success("Promo code removed");
  };

  // Check if user's email is verified
  const checkEmailVerification = async () => {
    if (!session) {
      openSignIn(); // Open sign-in if no session exists
      return false;
    }
    
    // Check if the primary email is verified
    const primaryEmailId = session.user.primaryEmailAddressId;
    const primaryEmail = session.user.emailAddresses?.find(
      email => email.id === primaryEmailId
    );
    
    if (!primaryEmail || !primaryEmail.verification.status === "verified") {
      // Open verification flow if email is not verified
      try {
        await session.user.verifyEmailAddress(primaryEmailId);
        toast.success("Please verify your email to continue");
      } catch (error) {
        console.error("Error requesting email verification:", error);
        toast.error("Failed to send verification email. Please try again.");
      }
      return false;
    }
    
    return true;
  };

  const createOrder = async () => {
    try {
      setLoading(true);

      // Check if user is logged in and email is verified
      if (!user) {
        setLoading(false);
        openSignIn();
        return;
      }
      
      // Check email verification
      const isEmailVerified = await checkEmailVerification();
      if (!isEmailVerified) {
        setLoading(false);
        return;
      }

      if (!selectedAddress) {
        setLoading(false);
        return toast.error('Please select a delivery address');
      }

      let cartItemsArray = Object.keys(cartItems).map((key) => ({
        product: key,
        quantity: cartItems[key]
      }));
      cartItemsArray = cartItemsArray.filter(item => item.quantity > 0);

      if (cartItemsArray.length === 0) {
        setLoading(false);
        return toast.error("Your cart is empty");
      }

      const token = await getToken();

      // Calculate all order amounts - ensuring they're consistent
      const { subtotal, discount, deliveryFee, total } = calculateOrderAmounts();

      // Create a proper order payload with all necessary information
      const orderPayload = {
        address: selectedAddress._id,
        items: cartItemsArray,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discount: discount,
        amount: total,
        // Explicitly include promo code details if applicable
        ...(appliedPromo && { 
          promoCodeId: appliedPromo._id,
          promoCode: {
            id: appliedPromo._id,
            code: appliedPromo.code,
            discountType: appliedPromo.discountType,
            discountValue: appliedPromo.discountValue,
            discountAmount: discount
          }
        })
      };

      const { data } = await axios.post('/api/order/create', orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        try {
          // Use existing product data from the context
          const productsDetails = cartItemsArray.map(item => {
            const product = products.find(p => p._id === item.product);
            return {
              productName: product ? product.name : `Product ID: ${item.product}`,
              quantity: item.quantity,
              price: product ? (product.offerPrice || product.price) : 0
            };
          });

          // Send Telegram notification only
          await sendOrderNotifications({
            orderId: data.orderId || `ORD-${Date.now()}`,
            address: selectedAddress,
            items: productsDetails,
            currency,
            subtotal,
            discount,
            deliveryFee,
            total,
            promoCode: appliedPromo ? appliedPromo.code : null
          });
        } catch (notificationError) {
          console.error("Failed to send notifications:", notificationError);
        }

        toast.success(data.message || "Order placed successfully!");
        setCartItems({});
        setLoading(false);
        router.push('/order-placed');
      } else {
        setLoading(false);
        toast.error(data.message || "Failed to place order");
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "An error occurred");
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateOrderForm()) {
      return toast.error("Please select a delivery address");
    }
    await createOrder();
  };

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user]);

  // Get calculated amounts for display
  const { subtotal, discount, deliveryFee: fee, total: totalAmount } = calculateOrderAmounts();

  return (
    <div className="w-full md:w-96 border border-gray-200 bg-gray-50 shadow-sm p-6 sticky top-24 h-fit">
      <h2 className="text-xl text-gray-800 mb-6 uppercase font-medium">
        Order Summary
      </h2>
      
      {/* Delivery Address Section */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <FaMapMarkerAlt className="text-gray-500 mr-2" />
          <h3 className="text-sm font-medium uppercase text-gray-700">Delivery Address</h3>
        </div>
        
        <div className="relative w-full text-sm">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            type="button"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="text-gray-700 truncate flex-1 text-left font-kantumruy">
              {selectedAddress
                ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.state}`
                : "Select delivery address"}
            </span>
            {isDropdownOpen ? <FaChevronUp className="ml-2 text-gray-500" /> : <FaChevronDown className="ml-2 text-gray-500" />}
          </button>

          {isDropdownOpen && (
            <ul 
              className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto z-10"
              role="listbox"
            >
              {userAddresses.length > 0 ? userAddresses.map((address, index) => (
                <li
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 border-gray-100"
                  onClick={() => handleAddressSelect(address)}
                  role="option"
                  aria-selected={selectedAddress?._id === address._id}
                >
                  <p className="font-medium text-gray-800">{address.fullName}</p>
                  <p className="text-gray-600 text-sm mt-1">{address.area}, {address.state}</p>
                </li>
              )) : (
                <li className="px-4 py-3 text-gray-500 italic">No addresses found</li>
              )}
              <li
                onClick={() => router.push("/add-address")}
                className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center text-blue-600 font-medium"
              >
                + Add New Address
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Promo Code Section (Collapsible) */}
      <div className="mb-6">
        {!appliedPromo ? (
          <>
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => setPromoExpanded(!promoExpanded)}
              type="button"
            >
              <div className="flex items-center">
                <FaTag className="text-gray-500 mr-2" />
                <h3 className="text-sm font-medium uppercase text-gray-700">Apply Promo Code</h3>
              </div>
              {promoExpanded ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
            </button>
            
            {promoExpanded && (
              <div className="mt-3">
                <div className="flex">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-grow outline-none p-3 text-gray-700 border border-gray-200 rounded-l-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button 
                    className="bg-black text-white px-4 py-3 rounded-r-md hover:bg-gray-800 transition-colors disabled:bg-gray-300"
                    type="button"
                    onClick={applyPromoCode}
                    disabled={applyingPromo || !promoCode.trim()}
                  >
                    {applyingPromo ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : "Apply"}
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-500 text-xs mt-2">{promoError}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between bg-green-50 p-3 border border-green-200 rounded-md">
            <div className="flex items-center">
              <FaTag className="text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-800">{appliedPromo.code}</p>
                <p className="text-xs text-gray-600">
                  {appliedPromo.discountType === 'percentage' 
                    ? `${appliedPromo.discountValue}% off${appliedPromo.maxDiscountAmount ? ` (up to ${currency}${appliedPromo.maxDiscountAmount})` : ''}`
                    : `${currency}${appliedPromo.discountValue} off`
                  }
                </p>
              </div>
            </div>
            <button 
              className="text-gray-500 hover:text-red-500"
              onClick={removePromoCode}
              type="button"
              aria-label="Remove promo code"
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>

      {/* Order Summary Details */}
      <div className="space-y-3 border-t border-b border-gray-200 py-5 mb-6">
        <div className="flex justify-between text-gray-600">
          <p>Subtotal ({getCartCount()} items)</p>
          <p className="font-medium">{currency}{subtotal.toFixed(2)}</p>
        </div>
        
        {/* Display discount if promo applied */}
        {appliedPromo && discount > 0 && (
          <div className="flex justify-between text-gray-600">
            <p className="flex items-center">
              <FaTag className="text-green-600 mr-1 text-xs" /> 
              Discount
            </p>
            <p className="font-medium text-green-600">-{currency}{discount.toFixed(2)}</p>
          </div>
        )}
        
        <div className="flex justify-between text-gray-600">
          <p>Delivery Fee</p>
          {isFreeDelivery ? (
            <p className="font-medium">
              <span className="line-through text-gray-400 mr-2">{currency}1.50</span>
              <span className="text-green-600">Free</span>
            </p>
          ) : (
            <p className="font-medium">{currency}{fee.toFixed(2)}</p>
          )}
        </div>
        
        <div className="flex justify-between text-lg text-gray-800 border-t border-gray-200 pt-3 mt-3">
          <p>Total</p>
          <p>{currency}{totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={!validateOrderForm() || loading}
        className={`w-full py-2 rounded-md flex items-center justify-center transition-all duration-300 ${
          validateOrderForm() && !loading
            ? "bg-black text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
        type="button"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            Place Order
          </>
        )}
      </button>
      
      {/* Trust indicators */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 flex items-center justify-center">
          <FaLock className="mr-1" /> Secure checkout
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;