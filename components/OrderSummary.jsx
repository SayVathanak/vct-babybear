'use client';

import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { sendTelegramNotification } from "@/utils/telegram-config";
import { QRCodeCanvas } from "qrcode.react";
import { BsQrCodeScan } from "react-icons/bs";
import { MdDeliveryDining, MdSaveAlt, MdOpenInNew } from "react-icons/md";
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
  FaQrcode,
} from "react-icons/fa";

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
  const [promoCode, setPromoCode] = useState("");
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("COD");
  const [transactionProofFile, setTransactionProofFile] = useState(null);
  const [transactionProofPreview, setTransactionProofPreview] = useState(null);
  const [transactionProofUrl, setTransactionProofUrl] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef(null);
  
  // Bakong states
  const [isBakongModalOpen, setIsBakongModalOpen] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [bakongQRData, setBakongQRData] = useState(null);
  const [bakongMD5, setBakongMD5] = useState(null);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const pollingIntervalRef = useRef(null);
  const pollingTimeoutRef = useRef(null);
  const [bakongDeeplink, setBakongDeeplink] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const qrCodeRef = useRef(null);

  // Constants
  const isFreeDelivery = getCartCount() > 1;
  const deliveryFee = isFreeDelivery ? 0 : 1.5;

  // Effect to check for mobile device
  useEffect(() => {
    const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
    const mobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));
    setIsMobile(mobile);
  }, []);

  const handleSaveQR = () => {
    if (!qrCodeRef.current) {
        toast.error("QR Code not available.");
        return;
    }
    const canvas = qrCodeRef.current.querySelector('canvas');
    if (!canvas) {
        toast.error("Could not find QR Code to save.");
        return;
    }
    const imageUrl = canvas.toDataURL('image/png');
    if (isMobile) {
        window.open(imageUrl, '_blank');
        toast.success("QR opened in new tab. Long-press to save to photos.", { duration: 4000 });
    } else {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `baby-bear-khqr-payment.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("QR Code saved to downloads!");
    }
  };

  // --- THIS FUNCTION IS NOW SAFER ---
  const calculateOrderAmounts = () => {
    // Get cart amount, but provide a fallback of 0 if it's not ready
    const cartAmountValue = getCartAmount() || 0; 
    const subtotal = Number(cartAmountValue.toFixed(2));
    
    const discount = calculateDiscount(subtotal);
    const total = Number((subtotal + deliveryFee - discount).toFixed(2));

    return {
      subtotal,
      discount,
      deliveryFee: Number(deliveryFee.toFixed(2)),
      total
    };
  };

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
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch addresses");
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const handleCopyText = async (textToCopy, message) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(message || `Copied: ${textToCopy}`);
    } catch (err) {
      toast.error('Failed to copy text.');
    }
  };

  const validateOrderForm = () => {
    if (!selectedAddress) return false;
    if (getCartCount() <= 0) return false;
    if (selectedPaymentMethod === "ABA" && !transactionProofUrl) {
      if (!transactionProofFile) {
        toast.error("Please upload transaction proof for ABA payment.");
      }
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

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }
    setApplyingPromo(true);
    setPromoError("");
    try {
      const token = await getToken();
      const { data } = await axios.post('/api/promo/validate', {
        code: promoCode,
        cartAmount: getCartAmount()
      }, { headers: { Authorization: `Bearer ${token}` } });
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
      const errorMessage = error.response?.data?.message || "Failed to apply promo code";
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

  const resetTransactionProof = () => {
    setTransactionProofFile(null);
    setTransactionProofPreview(null);
    setTransactionProofUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadTransactionProof = async (fileToUpload) => {
    if (!fileToUpload) return;
    setUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('transactionProofImage', fileToUpload);
      const token = await getToken();
      const { data } = await axios.post('/api/upload/transaction-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      if (data.success && data.imageUrl) {
        setTransactionProofUrl(data.imageUrl);
        toast.success("Transaction uploaded successfully!");
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

  const stopPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    setIsWaitingForPayment(false);
  };

  const startPolling = (md5) => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Updated API endpoint - using GET with query parameter
        const { data } = await axios.get(`/api/bakong?md5=${md5}`);
        if (data.success && data.status === 'PAID') {
          stopPolling();
          toast.success("Payment received! Placing your order...");
          setIsBakongModalOpen(false);
          await createOrder(true, md5);
        }
      } catch (error) { 
        console.error("Polling error:", error);
      }
    }, 4000);
    
    pollingTimeoutRef.current = setTimeout(() => {
      stopPolling();
      toast.error("Payment confirmation timed out. Please try again.");
      setIsBakongModalOpen(false);
    }, 180000); // 3 minutes timeout
  };
  
  const handlePayWithBakong = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address first.');
      return;
    }
    setIsGeneratingQR(true);
    try {
      const { total } = calculateOrderAmounts();
      const authToken = await getToken();
      
      // Updated API endpoint and payload structure
      const { data } = await axios.post('/api/bakong', {
        amount: total,
        currency: currency === '$' ? 'USD' : 'KHR',
        billNumber: `ORD-${Date.now()}`
      }, { 
        headers: { Authorization: `Bearer ${authToken}` } 
      });
      
      if (data.success) {
        setBakongQRData(data.qr);
        setBakongMD5(data.md5);
        setBakongDeeplink(data.deeplink);
        setIsBakongModalOpen(true);
        setIsWaitingForPayment(true);
        startPolling(data.md5);
      } else {
        toast.error(data.message || "Failed to generate Bakong QR code.");
      }
    } catch (error) {
      console.error("Bakong payment error:", error);
      toast.error(error.response?.data?.message || "Error setting up payment.");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const createOrder = async (isPaid = false, transactionId = null) => {
    if (!isPaid && !validateOrderForm()) {
        if (!selectedAddress) toast.error('Please select a delivery address');
        return;
    }
    setLoading(true);
    try {
        let cartItemsArray = Object.keys(cartItems).map((key) => ({ product: key, quantity: cartItems[key] })).filter(item => item.quantity > 0);
        const authToken = await getToken();
        const { subtotal, discount, deliveryFee, total } = calculateOrderAmounts();
        const orderPayload = {
            address: selectedAddress._id, 
            items: cartItemsArray, 
            subtotal, 
            deliveryFee, 
            discount, 
            amount: total, 
            paymentMethod: selectedPaymentMethod,
            paymentTransactionId: selectedPaymentMethod === "BAKONG" ? transactionId : null,
            paymentTransactionImage: selectedPaymentMethod === "ABA" ? transactionProofUrl : null,
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
        
        const { data: orderCreateData } = await axios.post('/api/order/create', orderPayload, { 
          headers: { Authorization: `Bearer ${authToken}` } 
        });
        
        if (orderCreateData.success) {
            // Notification logic can be re-added here if needed
            toast.success(orderCreateData.message || "Order placed successfully!");
            setCartItems({});
            resetTransactionProof();
            setBakongMD5(null);
            setBakongQRData(null);
            setBakongDeeplink(null);
            router.push('/order-placed');
        } else {
            toast.error(orderCreateData.message || "Failed to place order");
        }
    } catch (error) {
        console.error("Order creation error:", error);
        toast.error(error.response?.data?.message || "An error occurred");
    } finally {
        setLoading(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    if (method !== "ABA") resetTransactionProof();
  };

  useEffect(() => { 
    if (user) fetchUserAddresses() 
  }, [user]);

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const { subtotal, discount: calculatedDiscountValue, deliveryFee: fee, total: totalAmount } = calculateOrderAmounts();

  return (
    <>
      {isBakongModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 text-center w-full max-w-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Complete Your Payment</h3>
            <p className="text-gray-600 mb-4">
              Total Amount: <span className="font-bold text-blue-600">{currency}{totalAmount.toFixed(2)}</span>
            </p>
            <div ref={qrCodeRef} className="p-4 border border-gray-200 rounded-lg inline-block">
              {bakongQRData ? 
                <QRCodeCanvas value={bakongQRData} size={200} /> : 
                <div className="h-[200px] w-[200px] flex items-center justify-center"><FaSpinner className="animate-spin h-12 w-12 text-gray-400" /></div>
              }
            </div>
            <p className="text-xs text-gray-500 mt-2">Scan with any Cambodian banking app.</p>
            <div className="mt-5 space-y-3">
              <button onClick={handleSaveQR} className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors shadow-md">
                <MdSaveAlt size={20}/>
                Save QR Code
              </button>
              {isMobile && bakongDeeplink && (
                <a href={bakongDeeplink} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                  <MdOpenInNew size={20} />
                  Pay with Banking App
                </a>
              )}
            </div>
            {isWaitingForPayment && (
              <div className="mt-4 flex items-center justify-center text-blue-600">
                <FaSpinner className="animate-spin mr-2" />
                <span>Waiting for payment...</span>
              </div>
            )}
            <button onClick={() => { setIsBakongModalOpen(false); stopPolling(); }} className="mt-6 w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      <div className="w-full md:w-96 border border-gray-200 bg-gray-50 shadow-sm p-6 sticky top-24 h-fit">
        <h2 className="text-xl text-gray-800 mb-6 uppercase font-medium">Order Summary</h2>
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <FaMapMarkerAlt className="text-gray-500 mr-2" />
            <h3 className="text-sm font-medium uppercase text-gray-700">Delivery Address</h3>
          </div>
          <div className="relative w-full text-sm">
            <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 transition-colors rounded-md" onClick={() => setIsDropdownOpen(!isDropdownOpen)} type="button">
              <span className="text-gray-700 truncate flex-1 text-left font-kantumruy">
                {selectedAddress ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.state}` : "Select delivery address"}
              </span>
              {isDropdownOpen ? <FaChevronUp className="ml-2 text-gray-500" /> : <FaChevronDown className="ml-2 text-gray-500" />}
            </button>
            {isDropdownOpen && (
              <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto z-10">
                {userAddresses.length > 0 ? (
                  userAddresses.map((address, index) => (
                    <li key={index} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 border-gray-100" onClick={() => handleAddressSelect(address)}>
                      <p className="font-medium text-gray-800">{address.fullName}</p>
                      <p className="text-gray-600 text-sm mt-1">{address.area}, {address.state}</p>
                    </li>
                  ))
                ) : ( <li className="px-4 py-3 text-gray-500 italic">No addresses found</li> )}
                <li onClick={() => router.push("/add-address")} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center text-blue-600 font-medium">+ Add New Address</li>
              </ul>
            )}
          </div>
        </div>
        <div className="mb-6">
          {!appliedPromo ? (
            <>
              <button className="flex items-center justify-between w-full" onClick={() => setPromoExpanded(!promoExpanded)} type="button">
                <div className="flex items-center">
                  <FaTag className="text-gray-500 mr-2" />
                  <h3 className="text-sm font-medium uppercase text-gray-700">Apply Promo Code</h3>
                </div>
                {promoExpanded ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </button>
              {promoExpanded && (
                <div className="mt-3">
                  <div className="flex">
                    <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter promo code" className="flex-grow outline-none p-3 text-gray-700 border border-gray-200 rounded-l-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                    <button className="bg-black text-white px-4 py-3 rounded-r-md hover:bg-gray-800 transition-colors disabled:bg-gray-300" type="button" onClick={applyPromoCode} disabled={applyingPromo || !promoCode.trim()}>
                      {applyingPromo ? <FaSpinner className="animate-spin h-5 w-5 text-white" /> : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between bg-green-50 p-3 border border-green-200 rounded-md">
              <div className="flex items-center">
                <FaTag className="text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{appliedPromo.code}</p>
                  <p className="text-xs text-gray-600">{appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}% off${appliedPromo.maxDiscountAmount ? ` (up to ${currency}${appliedPromo.maxDiscountAmount})` : ''}` : `${currency}${appliedPromo.discountValue} off`}</p>
                </div>
              </div>
              <button className="text-gray-500 hover:text-red-500" onClick={removePromoCode} type="button" aria-label="Remove promo code"><FaTimes /></button>
            </div>
          )}
        </div>
        <div className="mb-6">
          <h3 className="text-sm font-medium uppercase text-gray-700 mb-3">Payment Method</h3>
          <div className="space-y-3">
            <label htmlFor="payment_cod" className={`flex items-center p-3 border rounded-md cursor-pointer ${selectedPaymentMethod === "COD" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200 bg-white"}`}>
              <input type="radio" id="payment_cod" value="COD" checked={selectedPaymentMethod === "COD"} onChange={() => handlePaymentMethodChange("COD")} className="sr-only" />
              <MdDeliveryDining className={`mr-3 h-5 w-5 ${selectedPaymentMethod === "COD" ? "text-blue-600" : "text-gray-400"}`} />
              <span className="text-sm font-medium">Cash on Delivery</span>
            </label>
            <label htmlFor="payment_aba" className={`flex items-center p-3 border rounded-md cursor-pointer ${selectedPaymentMethod === "ABA" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200 bg-white"}`}>
              <input type="radio" id="payment_aba" value="ABA" checked={selectedPaymentMethod === "ABA"} onChange={() => handlePaymentMethodChange("ABA")} className="sr-only" />
              <FaCreditCard className={`mr-3 h-5 w-5 ${selectedPaymentMethod === "ABA" ? "text-blue-600" : "text-gray-400"}`} />
              <span className="text-sm font-medium">ABA Transfer</span>
            </label>
            <label htmlFor="payment_bakong" className={`flex items-center p-3 border rounded-md cursor-pointer ${selectedPaymentMethod === "BAKONG" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200 bg-white"}`}>
              <input type="radio" id="payment_bakong" value="BAKONG" checked={selectedPaymentMethod === "BAKONG"} onChange={() => handlePaymentMethodChange("BAKONG")} className="sr-only" />
              <BsQrCodeScan className={`mr-3 h-5 w-5 ${selectedPaymentMethod === "BAKONG" ? "text-blue-600" : "text-gray-400"}`} />
              <span className="text-sm font-medium">KHQR (Scan & Pay)</span>
            </label>
          </div>
          {selectedPaymentMethod === "ABA" && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white">
              <p className="text-xs text-gray-600 mb-1">Please transfer to the following ABA account and upload a screenshot of your transaction.</p>
              <div className="bg-gray-50 p-3 rounded mb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">Name: <span className="font-semibold text-blue-600">SAY SAKSOPHANNA</span></p>
                  <button onClick={() => handleCopyText("SAY SAKSOPHANNA", "Account Name Copied!")} className="p-1 text-blue-500 hover:text-blue-700 transition-colors" type="button"><FaCopy size={14} /></button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">Account Number: <span className="font-semibold text-blue-600">001 223 344</span></p>
                  <button onClick={() => handleCopyText("001 223 344", "ABA Account Number Copied!")} className="p-1 text-blue-500 hover:text-blue-700 transition-colors" type="button"><FaCopy size={14} /></button>
                </div>
              </div>
              <label htmlFor="transaction-proof-upload" className="block text-sm font-medium text-gray-700 mb-1">Upload Transaction <span className="text-red-500">*</span></label>
              <input type="file" id="transaction-proof-upload" ref={fileInputRef} onChange={handleTransactionProofChange} accept="image/png, image/jpeg, image/gif" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" disabled={uploadingProof}/>
              {transactionProofPreview && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <img src={transactionProofPreview} alt="Transaction proof preview" className="max-h-32 rounded-md border border-gray-200"/>
                </div>
              )}
              {uploadingProof && <div className="flex items-center text-sm text-blue-600 mt-2"><FaSpinner className="animate-spin mr-2" /><span>Uploading proof...</span></div>}
              {transactionProofUrl && !uploadingProof && <div className="flex items-center text-sm text-green-600 mt-2"><FaCheck className="mr-2" /><span>Proof uploaded successfully!</span></div>}
              <p className="text-xs text-gray-500 mt-1">Max file size: 2MB. Allowed types: JPG, PNG, GIF.</p>
            </div>
          )}
        </div>
        <div className="space-y-3 border-t border-b border-gray-200 py-5 mb-6">
      <div className="flex justify-between text-gray-600">
        <p>Subtotal ({getCartCount()} items)</p>
        <p className="font-medium">{currency}{subtotal.toFixed(2)}</p>
      </div>
      <div className="flex justify-between text-gray-600">
        <p className="flex items-center">
          Delivery Fee
          {isFreeDelivery && (
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              FREE
            </span>
          )}
        </p>
        <p className={`font-medium ${isFreeDelivery ? 'line-through text-gray-400' : ''}`}>
          {currency}{fee.toFixed(2)}
        </p>
      </div>
      {calculatedDiscountValue > 0 && (
        <div className="flex justify-between text-green-600">
          <p>Discount ({appliedPromo.code})</p>
          <p className="font-medium">-{currency}{calculatedDiscountValue.toFixed(2)}</p>
        </div>
      )}
      <div className="flex justify-between text-lg font-semibold text-gray-800 pt-2 border-t border-gray-200">
        <p>Total</p>
        <p>{currency}{totalAmount.toFixed(2)}</p>
      </div>
    </div>

    {/* Order Actions */}
    <div className="space-y-3">
      {selectedPaymentMethod === "BAKONG" ? (
        <button
          onClick={handlePayWithBakong}
          disabled={loading || isGeneratingQR || !selectedAddress || getCartCount() <= 0}
          className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          type="button"
        >
          {isGeneratingQR ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Generating QR...</span>
            </>
          ) : (
            <>
              <FaQrcode />
              <span>Pay with KHQR</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => createOrder()}
          disabled={loading || !selectedAddress || getCartCount() <= 0 || (selectedPaymentMethod === "ABA" && !transactionProofUrl)}
          className="w-full bg-black text-white font-bold py-4 px-6 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          type="button"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Placing Order...</span>
            </>
          ) : (
            <>
              {selectedPaymentMethod === "COD" ? (
                <>
                  <FaMoneyBillWave />
                  <span>Place Order (COD)</span>
                </>
              ) : (
                <>
                  <FaCreditCard />
                  <span>Place Order (ABA)</span>
                </>
              )}
            </>
          )}
        </button>
      )}
      
      {/* Order Requirements Notice */}
      {(!selectedAddress || getCartCount() <= 0 || (selectedPaymentMethod === "ABA" && !transactionProofUrl)) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start">
            <FaLock className="text-yellow-600 mt-1 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Complete these steps to place your order:</p>
              <ul className="space-y-1 text-xs">
                {!selectedAddress && <li>• Select a delivery address</li>}
                {getCartCount() <= 0 && <li>• Add items to your cart</li>}
                {selectedPaymentMethod === "ABA" && !transactionProofUrl && <li>• Upload transaction proof for ABA payment</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Free Delivery Notice */}
      {!isFreeDelivery && getCartCount() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <MdDeliveryDining className="text-blue-600 mr-2" />
            <p className="text-sm text-blue-800">
              Add <span className="font-medium">{2 - getCartCount()}</span> more item{2 - getCartCount() > 1 ? 's' : ''} for free delivery!
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
</>
);
};

export default OrderSummary;