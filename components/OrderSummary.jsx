'use client';

import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { sendTelegramNotification } from "@/utils/telegram-config";
import {
  FaChevronDown,
  FaChevronUp,
  FaTag,
  FaMapMarkerAlt,
  FaLock,
  FaTimes,
  FaCheck,
  FaCreditCard,
  FaMoneyBillWave,
  FaUpload,
  FaSpinner,
  FaCopy,
  FaQrcode
} from "react-icons/fa";

// --- Configuration ---
// This URL must point to your running Python backend server.
const API_BASE_URL = "http://127.0.0.1:5000";

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

  // State management
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Promo code states
  const [promoCode, setPromoCode] = useState("");
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  // Payment states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("COD");
  const [transactionProofFile, setTransactionProofFile] = useState(null);
  const [transactionProofPreview, setTransactionProofPreview] = useState(null);
  const [transactionProofUrl, setTransactionProofUrl] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef(null);

  // KHQR Payment states
  const [khqrData, setKhqrData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrPaymentStatus, setQrPaymentStatus] = useState('IDLE'); // IDLE, PENDING, PAID, FAILED
  const [qrTransactionHash, setQrTransactionHash] = useState(null);
  const pollingIntervalRef = useRef(null);

  // Constants
  const isFreeDelivery = getCartCount() > 1;
  const deliveryFee = isFreeDelivery ? 0 : 1.5;

  // Notification handler
  const sendOrderNotifications = async (orderDetails) => {
    try {
      const telegramResult = await sendTelegramNotification(orderDetails);
      if (!telegramResult.success) {
        console.error("Failed to send Telegram notification:", telegramResult.error);
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  };

  // Fetch user addresses
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

  // Address selection handler
  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  // Copy text handler
  const handleCopyText = async (textToCopy, message) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(message || `Copied: ${textToCopy}`);
    } catch (err) {
      toast.error('Failed to copy.');
    }
  };

  // Discount and amounts calculation
  const calculateDiscount = useCallback((subtotal) => {
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
  }, [appliedPromo]);

  const calculateOrderAmounts = useCallback(() => {
    const subtotal = Number(getCartAmount().toFixed(2));
    const discount = calculateDiscount(subtotal);
    const total = Number((subtotal + deliveryFee - discount).toFixed(2));
    return { subtotal, discount, deliveryFee: Number(deliveryFee.toFixed(2)), total };
  }, [getCartAmount, calculateDiscount, deliveryFee]);

  const { subtotal, discount: calculatedDiscountValue, deliveryFee: fee, total: totalAmount } = calculateOrderAmounts();

  // Promo code application
  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
        setPromoError("Please enter a promo code");
        return;
    }
    setApplyingPromo(true);
    setPromoError("");
    try {
        const token = await getToken();
        const { data } = await axios.post('/api/promo/validate', { code: promoCode, cartAmount: getCartAmount() }, { headers: { Authorization: `Bearer ${token}` } });
        if (data.success) {
            setAppliedPromo(data.promoCode);
            setPromoCode("");
            setPromoExpanded(false);
            toast.success("Promo code applied!");
        } else {
            setPromoError(data.message);
            toast.error(data.message);
        }
    } catch (error) {
        const msg = error.response?.data?.message || "Failed to apply promo code";
        setPromoError(msg);
        toast.error(msg);
    } finally {
        setApplyingPromo(false);
    }
  };

  // Remove promo code
  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoError("");
    toast.success("Promo code removed");
  };

  // ---- ABA Transaction Proof Logic ----
  const resetTransactionProof = () => {
    setTransactionProofFile(null);
    setTransactionProofPreview(null);
    setTransactionProofUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTransactionProofChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size should be less than 2MB.");
      resetTransactionProof();
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error("Only JPG, PNG, or GIF images are allowed.");
      resetTransactionProof();
      return;
    }
    setTransactionProofFile(file);
    setTransactionProofUrl(null);
    const reader = new FileReader();
    reader.onloadend = () => setTransactionProofPreview(reader.result);
    reader.readAsDataURL(file);
    uploadTransactionProof(file);
  };

  const uploadTransactionProof = async (fileToUpload) => {
    if (!fileToUpload) return;
    setUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('transactionProofImage', fileToUpload);
      const token = await getToken();
      const { data } = await axios.post('/api/upload/transaction-proof', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
      if (data.success && data.imageUrl) {
        setTransactionProofUrl(data.imageUrl);
        toast.success("Transaction proof uploaded!");
      } else {
        toast.error(data.message || "Failed to upload proof.");
        resetTransactionProof();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error uploading proof.");
      resetTransactionProof();
    } finally {
      setUploadingProof(false);
    }
  };

  // ---- KHQR Payment Logic ----
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
    }
  };

  const checkQrPaymentStatus = useCallback(async (hash) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/check-payment`, { transaction_hash: hash });
      if (data.success && data.is_paid) {
        setQrPaymentStatus('PAID');
        toast.success("Payment confirmed!");
        stopPolling();
      }
    } catch (error) {
        console.error("Error checking payment status:", error);
    }
  }, []);

  const handleGenerateQR = async () => {
    setGeneratingQR(true);
    setQrPaymentStatus('PENDING');
    try {
      const { total } = calculateOrderAmounts();
      const { data } = await axios.post(`${API_BASE_URL}/api/generate-qr`, { amount: total, currency: 'USD' });
      if (data.success) {
        setKhqrData(data.qr_image_base64);
        setQrTransactionHash(data.transaction_hash);
        pollingIntervalRef.current = setInterval(() => checkQrPaymentStatus(data.transaction_hash), 5000);
      } else {
        toast.error("Failed to generate QR Code.");
        setQrPaymentStatus('FAILED');
      }
    } catch (error) {
      console.error("Error generating QR:", error);
      toast.error("Could not connect to the payment service.");
      setQrPaymentStatus('FAILED');
    } finally {
      setGeneratingQR(false);
    }
  };

  const resetKhqrPayment = () => {
    stopPolling();
    setKhqrData(null);
    setQrTransactionHash(null);
    setQrPaymentStatus('IDLE');
  };

  // ---- Combined Logic ----
  // Payment Method Change Handler
  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    if (method !== "ABA") resetTransactionProof();
    if (method !== "KHQR") resetKhqrPayment();
  };

  // Form Validation
  const validateOrderForm = () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return false; }
    if (getCartCount() <= 0) { toast.error('Your cart is empty'); return false; }
    if (selectedPaymentMethod === "ABA" && !transactionProofUrl) {
      if (transactionProofFile && !transactionProofUrl) toast.error("Please wait for proof to upload.");
      else toast.error("Please upload transaction proof for ABA payment.");
      return false;
    }
    if (selectedPaymentMethod === "KHQR" && qrPaymentStatus !== 'PAID') {
        toast.error("Please complete the QR payment first.");
        return false;
    }
    return true;
  };

  // Create Order
  const createOrder = async () => {
    if (!validateOrderForm()) return;
    setLoading(true);
    try {
      const cartItemsArray = Object.keys(cartItems).map(key => ({ product: key, quantity: cartItems[key] })).filter(item => item.quantity > 0);
      const authToken = await getToken();
      const { subtotal, discount, deliveryFee, total } = calculateOrderAmounts();

      // --- FIX START ---
      // The payload was sending `paymentTransactionImage` for KHQR payments, which is incorrect.
      // The backend expects `paymentTransactionId` for KHQR and `paymentTransactionImage` only for ABA.
      // This change ensures only the correct field is sent for each payment method.
      const orderPayload = {
        address: selectedAddress._id,
        items: cartItemsArray,
        subtotal,
        deliveryFee,
        discount,
        amount: total,
        paymentMethod: selectedPaymentMethod,
        ...(selectedPaymentMethod === "ABA" && { paymentTransactionImage: transactionProofUrl }),
        ...(selectedPaymentMethod === "KHQR" && { paymentTransactionId: qrTransactionHash }),
        ...(appliedPromo && { promoCodeId: appliedPromo._id, promoCode: { id: appliedPromo._id, code: appliedPromo.code, discountType: appliedPromo.discountType, discountValue: appliedPromo.discountValue, discountAmount: discount }})
      };
      // --- FIX END ---

      const { data: orderCreateData } = await axios.post('/api/order/create', orderPayload, { headers: { Authorization: `Bearer ${authToken}` } });

      if (orderCreateData.success) {
        toast.success("Order placed successfully!");
        setCartItems({});
        resetTransactionProof();
        resetKhqrPayment();
        router.push('/order-placed');
        // Details for notifications
        const productsDetails = cartItemsArray.map(item => {
          const product = products.find(p => p._id === item.product);
          return { productName: product?.name || 'Unknown', quantity: item.quantity, price: product?.offerPrice || product?.price || 0 };
        });
        sendOrderNotifications({ orderId: orderCreateData.orderData?.paymentTransactionId || orderCreateData.orderData?._id || Date.now(), address: selectedAddress, items: productsDetails, currency, subtotal, discount, deliveryFee, total, promoCode: appliedPromo?.code, paymentMethod: selectedPaymentMethod });
      } else {
        toast.error(orderCreateData.message || "Failed to place order");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (user) fetchUserAddresses();
  }, [user, getToken]);

  useEffect(() => {
    return () => stopPolling(); // Cleanup polling on component unmount
  }, []);

  // JSX to Render
  return (
    <div className="w-full md:w-96 border border-gray-200 bg-gray-50 shadow-sm p-6 sticky top-24 h-fit">
      <h2 className="text-xl text-gray-800 mb-6 uppercase font-medium">Order Summary</h2>

      {/* Delivery Address Section */}
      <div className="mb-6">
          <div className="flex items-center mb-3"><FaMapMarkerAlt className="text-gray-500 mr-2" /><h3 className="text-sm font-medium uppercase text-gray-700">Delivery Address</h3></div>
          <div className="relative w-full text-sm"><button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-md" onClick={() => setIsDropdownOpen(!isDropdownOpen)}><span className="text-gray-700 truncate flex-1 text-left font-kantumruy">{selectedAddress ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.state}` : "Select delivery address"}</span>{isDropdownOpen ? <FaChevronUp className="ml-2 text-gray-500" /> : <FaChevronDown className="ml-2 text-gray-500" />}</button>{isDropdownOpen && <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto z-10">{userAddresses.length > 0 ? userAddresses.map((address, index) => (<li key={index} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => handleAddressSelect(address)}><p className="font-medium text-gray-800">{address.fullName}</p><p className="text-gray-600 text-sm mt-1">{address.area}, {address.state}</p></li>)) : <li className="px-4 py-3 text-gray-500 italic">No addresses found</li>}<li onClick={() => router.push("/add-address")} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center text-blue-600 font-medium">+ Add New Address</li></ul>}</div>
      </div>

      {/* Promo Code Section */}
      <div className="mb-6">
          {!appliedPromo ? (<><button className="flex items-center justify-between w-full" onClick={() => setPromoExpanded(!promoExpanded)}><div className="flex items-center"><FaTag className="text-gray-500 mr-2" /><h3 className="text-sm font-medium uppercase text-gray-700">Apply Promo Code</h3></div>{promoExpanded ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}</button>{promoExpanded && <div className="mt-3"><div className="flex"><input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter promo code" className="flex-grow outline-none p-3 text-gray-700 border border-gray-200 rounded-l-md focus:border-blue-500" /><button className="bg-black text-white px-4 py-3 rounded-r-md hover:bg-gray-800 disabled:bg-gray-300" onClick={applyPromoCode} disabled={applyingPromo || !promoCode.trim()}>{applyingPromo ? <FaSpinner className="animate-spin h-5 w-5" /> : "Apply"}</button></div>{promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}</div>}</>) : (<div className="flex items-center justify-between bg-green-50 p-3 border border-green-200 rounded-md"><div className="flex items-center"><FaTag className="text-green-600 mr-2" /><div><p className="text-sm font-medium">{appliedPromo.code}</p><p className="text-xs text-gray-600">{appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}% off` : `${currency}${appliedPromo.discountValue} off`}</p></div></div><button className="text-gray-500 hover:text-red-500" onClick={removePromoCode}><FaTimes /></button></div>)}
      </div>

      {/* Payment Method Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium uppercase text-gray-700 mb-3">Payment Method</h3>
        <div className="space-y-3">
          {/* COD Option */}
          <label className={`flex items-center p-3 border rounded-md cursor-pointer ${selectedPaymentMethod === "COD" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200 bg-white"}`}><input type="radio" name="paymentMethod" value="COD" checked={selectedPaymentMethod === "COD"} onChange={() => handlePaymentMethodChange("COD")} className="sr-only"/><FaMoneyBillWave className={`mr-3 h-5 w-5 ${selectedPaymentMethod === "COD" ? "text-blue-600" : "text-gray-400"}`}/><span>Cash on Delivery</span></label>
          {/* ABA Option */}
          <label className={`flex items-center p-3 border rounded-md cursor-pointer ${selectedPaymentMethod === "ABA" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200 bg-white"}`}><input type="radio" name="paymentMethod" value="ABA" checked={selectedPaymentMethod === "ABA"} onChange={() => handlePaymentMethodChange("ABA")} className="sr-only"/><FaCreditCard className={`mr-3 h-5 w-5 ${selectedPaymentMethod === "ABA" ? "text-blue-600" : "text-gray-400"}`}/><span>ABA Bank Transfer</span></label>
          {/* KHQR Option */}
          <label className={`flex items-center p-3 border rounded-md cursor-pointer ${selectedPaymentMethod === "KHQR" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200 bg-white"}`}><input type="radio" name="paymentMethod" value="KHQR" checked={selectedPaymentMethod === "KHQR"} onChange={() => handlePaymentMethodChange("KHQR")} className="sr-only"/><FaQrcode className={`mr-3 h-5 w-5 ${selectedPaymentMethod === "KHQR" ? "text-blue-600" : "text-gray-400"}`}/><span>Pay with KHQR</span></label>
        </div>

        {/* ABA Details */}
        {selectedPaymentMethod === "ABA" && <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white"><p className="text-xs text-gray-600 mb-1">Please transfer and upload a screenshot.</p><div className="bg-gray-50 p-3 rounded mb-3 space-y-1"><div className="flex items-center justify-between"><p>Account: <span className="font-semibold text-blue-600">001 223 344</span></p><button onClick={() => handleCopyText("001 223 344")} className="p-1 text-blue-500"><FaCopy size={14} /></button></div><div className="flex items-center justify-between"><p>Name: <span className="font-semibold text-blue-600">SAY SAKSOPHANNA</span></p><button onClick={() => handleCopyText("SAY SAKSOPHANNA")} className="p-1 text-blue-500"><FaCopy size={14} /></button></div></div><label htmlFor="transaction-proof-upload" className="block text-sm font-medium mb-1">Upload Transaction <span className="text-red-500">*</span></label><input type="file" id="transaction-proof-upload" ref={fileInputRef} onChange={handleTransactionProofChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700" disabled={uploadingProof}/>{transactionProofPreview && <div className="mt-3"><img src={transactionProofPreview} alt="Preview" className="max-h-32 rounded border"/></div>}{uploadingProof && <div className="flex items-center text-sm text-blue-600 mt-2"><FaSpinner className="animate-spin mr-2" /><span>Uploading...</span></div>}{transactionProofUrl && !uploadingProof && <div className="flex items-center text-sm text-green-600 mt-2"><FaCheck className="mr-2" /><span>Uploaded!</span></div>}</div>}

        {/* KHQR Details */}
        {selectedPaymentMethod === "KHQR" && <div className="mt-4 p-4 border rounded-md bg-white text-center">{!khqrData && qrPaymentStatus !== 'PENDING' && (<button onClick={handleGenerateQR} disabled={generatingQR} className="w-full bg-blue-600 text-white px-4 py-3 rounded-md flex items-center justify-center disabled:bg-blue-300">{generatingQR ? <FaSpinner className="animate-spin mr-2"/> : <FaQrcode className="mr-2"/>}{generatingQR ? 'Generating...' : 'Generate QR to Pay'}</button>)}{generatingQR && <div className="flex flex-col items-center"><FaSpinner className="animate-spin text-blue-500 h-8 w-8 mb-3"/><p className="text-sm">Generating secure QR code...</p></div>}{khqrData && qrPaymentStatus === 'PENDING' && (<div className="flex flex-col items-center"><img src={khqrData} alt="KHQR Payment Code" className="w-56 h-56 rounded-lg border bg-white p-1" /><FaSpinner className="animate-spin text-blue-500 h-6 w-6 my-3"/><p className="text-sm">Awaiting payment...</p><p className="text-xs text-gray-500 mt-1">Scan with your bank app to pay.</p></div>)}{qrPaymentStatus === 'PAID' && (<div className="flex flex-col items-center p-3 bg-green-50 text-green-700 rounded-md"><FaCheck className="h-8 w-8 mb-2" /><p className="font-semibold">Payment Confirmed!</p><p className="text-xs">You can now place your order.</p></div>)}{qrPaymentStatus === 'FAILED' && (<div className="flex flex-col items-center p-3 bg-red-50 text-red-700 rounded-md"><FaTimes className="h-8 w-8 mb-2" /><p className="font-semibold">Payment Failed</p><button onClick={handleGenerateQR} className="text-sm underline mt-1">Try Again</button></div>)}</div>}
      </div>

      {/* Order Summary Details */}
      <div className="space-y-3 border-t border-b py-5 mb-6"><div className="flex justify-between text-gray-600"><p>Subtotal ({getCartCount()} items)</p><p>{currency}{subtotal.toFixed(2)}</p></div>{calculatedDiscountValue > 0 && <div className="flex justify-between text-green-600"><p>Discount</p><p>-{currency}{calculatedDiscountValue.toFixed(2)}</p></div>}<div className="flex justify-between text-gray-600"><p>Delivery Fee</p><p>{isFreeDelivery ? <span className="text-green-600">Free</span> : `${currency}${fee.toFixed(2)}`}</p></div><div className="flex justify-between text-lg text-gray-800 border-t pt-3 mt-3"><p>Total</p><p>{currency}{totalAmount.toFixed(2)}</p></div></div>

      {/* Place Order Button */}
      <button onClick={createOrder} disabled={loading || uploadingProof || (selectedPaymentMethod === "ABA" && !transactionProofUrl) || (selectedPaymentMethod === "KHQR" && qrPaymentStatus !== 'PAID')} className="w-full py-3 rounded-md flex items-center justify-center text-base font-medium disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-black text-white hover:bg-gray-800">
          {loading ? <><FaSpinner className="animate-spin mr-3"/>Processing...</> : uploadingProof ? <><FaSpinner className="animate-spin mr-3"/>Uploading...</> : (selectedPaymentMethod === "KHQR" && qrPaymentStatus !== 'PAID') ? 'Awaiting Payment Confirmation' : "Place Order"}
      </button>

      <div className="mt-4 text-center"><p className="text-xs text-gray-500 flex items-center justify-center"><FaLock className="mr-1"/>Secure checkout</p></div>
    </div>
  );
};

export default OrderSummary;
