'use client';
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { sendTelegramNotification } from "@/utils/telegram-config";
import { FaChevronDown, FaChevronUp, FaTag, FaMapMarkerAlt, FaLock, FaTimes, FaCheck, FaCreditCard, FaMoneyBillWave, FaUpload, FaSpinner } from "react-icons/fa";

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
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [loading, setLoading] = useState(false); // For placing order
  const [promoCode, setPromoCode] = useState("");
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  // New states for ABA payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("COD"); // 'COD' or 'ABA'
  const [transactionProof, setTransactionProof] = useState(null); // File object
  const [transactionProofPreview, setTransactionProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false); // For image upload simulation
  const fileInputRef = useRef(null);

  const isFreeDelivery = getCartCount() > 1;
  const deliveryFee = isFreeDelivery ? 0 : 1.5;

  const sendOrderNotifications = async (orderDetails) => {
    try {
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

  const validateOrderForm = () => {
    if (!selectedAddress) return false;
    if (getCartCount() <= 0) return false;
    if (selectedPaymentMethod === "ABA" && !transactionProof) {
      toast.error("Please upload transaction proof for ABA payment.");
      return false;
    }
    return true;
  };

  const calculateDiscount = (subtotal) => {
    if (!appliedPromo) return 0;
    let discount = 0;
    if (appliedPromo.discountType === 'percentage') {
      discount = (subtotal * appliedPromo.discountValue) / 100;
      if (appliedPromo.maxDiscountAmount && discount > appliedPromo.maxDiscountAmount) {
        discount = appliedPromo.maxDiscountAmount;
      }
    } else {
      discount = Math.min(appliedPromo.discountValue, subtotal);
    }
    return Number(discount.toFixed(2));
  };

  const calculateOrderAmounts = () => {
    const subtotal = Number(getCartAmount().toFixed(2));
    const discount = calculateDiscount(subtotal);
    const total = Number((subtotal + deliveryFee - discount).toFixed(2));
    return { subtotal, discount, deliveryFee: Number(deliveryFee.toFixed(2)), total };
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

  const handleTransactionProofChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        toast.error("File size should be less than 2MB.");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error("Only JPG, PNG, or GIF images are allowed.");
        return;
      }
      setTransactionProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransactionProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulate image upload - in a real app, you'd upload to a service (S3, Cloudinary)
  // and get a URL back. For this example, we'll just pass the filename.
  const uploadTransactionProof = async (file) => {
    setUploadingProof(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setUploadingProof(false);
    // In a real app, this would return a URL or an identifier for the uploaded image.
    // For now, we'll use the filename.
    return file.name; // Placeholder for actual image URL/identifier
  };


  const createOrder = async () => {
    if (!validateOrderForm()) {
      // ValidateOrderForm already shows a toast for ABA proof
      if (!selectedAddress) toast.error('Please select a delivery address');
      if (getCartCount() <= 0) toast.error('Your cart is empty');
      return;
    }

    try {
      setLoading(true);

      let cartItemsArray = Object.keys(cartItems).map((key) => ({
        product: key,
        quantity: cartItems[key]
      }));
      cartItemsArray = cartItemsArray.filter(item => item.quantity > 0);

      const token = await getToken();
      const { subtotal, discount, deliveryFee, total } = calculateOrderAmounts();
      
      let paymentTransactionImageFilename = null;
      if (selectedPaymentMethod === "ABA" && transactionProof) {
        // In a real app, you would call an upload service here and get a URL.
        // For now, we'll just use the filename as a placeholder.
        // You might want to show a loading indicator for the upload itself.
        paymentTransactionImageFilename = await uploadTransactionProof(transactionProof);
        if (!paymentTransactionImageFilename) {
          toast.error("Failed to upload transaction proof. Please try again.");
          setLoading(false);
          return;
        }
      }

      const orderPayload = {
        address: selectedAddress._id,
        items: cartItemsArray,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discount: discount,
        amount: total,
        paymentMethod: selectedPaymentMethod, // Add payment method
        paymentTransactionImage: paymentTransactionImageFilename, // Add transaction image filename/URL
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
          const productsDetails = cartItemsArray.map(item => {
            const product = products.find(p => p._id === item.product);
            return {
              productName: product ? product.name : `Product ID: ${item.product}`,
              quantity: item.quantity,
              price: product ? (product.offerPrice || product.price) : 0
            };
          });

          await sendOrderNotifications({
            orderId: data.orderId || `ORD-${Date.now()}`,
            address: selectedAddress,
            items: productsDetails,
            currency,
            subtotal,
            discount,
            deliveryFee,
            total,
            promoCode: appliedPromo ? appliedPromo.code : null,
            paymentMethod: selectedPaymentMethod // For notification
          });
        } catch (notificationError) {
          console.error("Failed to send notifications:", notificationError);
        }

        toast.success(data.message || "Order placed successfully!");
        setCartItems({});
        setTransactionProof(null);
        setTransactionProofPreview(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        router.push('/order-placed');
      } else {
        toast.error(data.message || "Failed to place order");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user]);

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
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 transition-colors rounded-md"
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

      {/* Promo Code Section */}
      {/* ... (promo code section remains the same) ... */}
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
                      <FaSpinner className="animate-spin h-5 w-5 text-white" />
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


      {/* Payment Method Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium uppercase text-gray-700 mb-3">Payment Method</h3>
        <div className="space-y-3">
          {/* COD Option */}
          <label
            htmlFor="payment_cod"
            className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
              selectedPaymentMethod === "COD" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              id="payment_cod"
              name="paymentMethod"
              value="COD"
              checked={selectedPaymentMethod === "COD"}
              onChange={() => setSelectedPaymentMethod("COD")}
              className="sr-only"
            />
            <FaMoneyBillWave className={`mr-3 h-5 w-5 ${selectedPaymentMethod === "COD" ? "text-blue-600" : "text-gray-400"}`} />
            <span className="text-sm font-medium text-gray-800">Cash on Delivery (COD)</span>
          </label>

          {/* ABA Option */}
          <label
            htmlFor="payment_aba"
            className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
              selectedPaymentMethod === "ABA" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              id="payment_aba"
              name="paymentMethod"
              value="ABA"
              checked={selectedPaymentMethod === "ABA"}
              onChange={() => setSelectedPaymentMethod("ABA")}
              className="sr-only"
            />
            <FaCreditCard className={`mr-3 h-5 w-5 ${selectedPaymentMethod === "ABA" ? "text-blue-600" : "text-gray-400"}`} />
            <span className="text-sm font-medium text-gray-800">ABA Bank Transfer</span>
          </label>
        </div>

        {selectedPaymentMethod === "ABA" && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white">
            <p className="text-xs text-gray-600 mb-1">Please transfer to the following ABA account and upload a screenshot of your transaction.</p>
            <div className="bg-gray-50 p-2 rounded text-center mb-3">
                <p className="text-sm font-medium text-gray-700">ABA Account: <span className="font-bold text-blue-600">000 123 456</span></p>
                <p className="text-sm font-medium text-gray-700">Account Name: <span className="font-bold text-blue-600">Your Store Name</span></p>
            </div>
            
            <label htmlFor="transaction-proof-upload" className="block text-sm font-medium text-gray-700 mb-1">
              Upload Transaction Proof <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="transaction-proof-upload"
              ref={fileInputRef}
              onChange={handleTransactionProofChange}
              accept="image/png, image/jpeg, image/gif"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {transactionProofPreview && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <img src={transactionProofPreview} alt="Transaction proof preview" className="max-h-32 rounded-md border border-gray-200" />
              </div>
            )}
            {uploadingProof && (
                <div className="flex items-center text-sm text-blue-600 mt-2">
                    <FaSpinner className="animate-spin mr-2" />
                    <span>Uploading proof...</span>
                </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Max file size: 2MB. Allowed types: JPG, PNG, GIF.</p>
          </div>
        )}
      </div>


      {/* Order Summary Details */}
      <div className="space-y-3 border-t border-b border-gray-200 py-5 mb-6">
        <div className="flex justify-between text-gray-600">
          <p>Subtotal ({getCartCount()} items)</p>
          <p className="font-medium">{currency}{subtotal.toFixed(2)}</p>
        </div>
        {appliedPromo && discount > 0 && (
          <div className="flex justify-between text-gray-600">
            <p className="flex items-center">
              <FaTag className="text-green-600 mr-1 text-xs" /> Discount
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
        onClick={createOrder} // Validation is now inside createOrder
        disabled={loading || uploadingProof || (selectedPaymentMethod === "ABA" && !transactionProof)}
        className={`w-full py-3 rounded-md flex items-center justify-center transition-all duration-300 text-base font-medium ${
          (loading || uploadingProof || (selectedPaymentMethod === "ABA" && !transactionProof))
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800"
        }`}
        type="button"
      >
        {loading || uploadingProof ? (
          <>
            <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5" />
            {loading ? "Processing..." : "Uploading..."}
          </>
        ) : (
          <>
            Place Order
          </>
        )}
      </button>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 flex items-center justify-center">
          <FaLock className="mr-1" /> Secure checkout
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
