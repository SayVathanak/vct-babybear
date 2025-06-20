'use client';

import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { sendTelegramNotification } from "@/utils/telegram-config";
import { QRCodeCanvas } from "qrcode.react"; // Correct named import
import { BsQrCodeScan } from "react-icons/bs";
import { MdDeliveryDining } from "react-icons/md";
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
  FaQrcode, // QR Code Icon
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

  // --- Bakong KHQR States ---
  const [isBakongModalOpen, setIsBakongModalOpen] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [bakongQRData, setBakongQRData] = useState(null);
  const [bakongMD5, setBakongMD5] = useState(null);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const pollingIntervalRef = useRef(null);
  const pollingTimeoutRef = useRef(null);
  // --- END: Bakong KHQR States ---

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
      return { success: telegramResult.success };
    } catch (error) {
      console.error("Error sending notifications:", error);
      return { success: false, error };
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

  const handleCopyText = async (textToCopy, message) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(message || `Copied: ${textToCopy}`);
    } catch (err) {
      toast.error('Failed to copy text.');
    }
  };

  // Form validation
  const validateOrderForm = () => {
    if (!selectedAddress) return false;
    if (getCartCount() <= 0) return false;

    if (selectedPaymentMethod === "ABA" && !transactionProofUrl) {
      if (!transactionProofFile) {
        toast.error("Please upload transaction proof for ABA payment.");
      }
      return false;
    }

    if (selectedPaymentMethod === "BAKONG") {
      return true;
    }

    return true;
  };

  // Discount calculation
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

  // Order amounts calculation
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

  // Promo code application
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

  // Remove promo code
  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoError("");
    toast.success("Promo code removed");
  };

  // Transaction proof file change handler
  const handleTransactionProofChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // File size validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size should be less than 2MB.");
      resetTransactionProof();
      return;
    }

    // File type validation
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error("Only JPG, PNG, or GIF images are allowed.");
      resetTransactionProof();
      return;
    }

    setTransactionProofFile(file);
    setTransactionProofUrl(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setTransactionProofPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Auto-upload
    uploadTransactionProof(file);
  };

  // Reset transaction proof
  const resetTransactionProof = () => {
    setTransactionProofFile(null);
    setTransactionProofPreview(null);
    setTransactionProofUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload transaction proof
  const uploadTransactionProof = async (fileToUpload) => {
    if (!fileToUpload) {
      toast.error("No file selected for upload.");
      return;
    }

    setUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append('transactionProofImage', fileToUpload);

      const token = await getToken();
      const { data } = await axios.post('/api/upload/transaction-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (data.success && data.imageUrl) {
        setTransactionProofUrl(data.imageUrl);
        toast.success("Transaction uploaded successfully!");
      } else {
        toast.error(data.message || "Failed to upload proof.");
        resetTransactionProof();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Error uploading proof.");
      resetTransactionProof();
    } finally {
      setUploadingProof(false);
    }
  };

  // --- Stop Bakong Payment Polling ---
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setIsWaitingForPayment(false);
  };

  // --- Start Bakong Payment Polling ---
  const startPolling = (md5) => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/payment/bakong/check-status?md5=${md5}`);
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
    }, 180000); // 3-minute timeout
  };

  // --- Handle Pay with Bakong ---
  const handlePayWithBakong = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address first.');
      return;
    }

    setIsGeneratingQR(true);
    try {
      const { total } = calculateOrderAmounts();
      const authToken = await getToken();

      const { data } = await axios.post('/api/payment/bakong/generate-qr', {
        amount: total,
        currency: currency === '$' ? 'USD' : 'KHR',
        billNumber: `ORD-${Date.now()}`
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (data.success) {
        setBakongQRData(data.qr);
        setBakongMD5(data.md5);
        setIsBakongModalOpen(true);
        setIsWaitingForPayment(true);
        startPolling(data.md5);
      } else {
        toast.error(data.message || "Failed to generate Bakong QR code.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error setting up payment.");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Create order
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

      // Create order
      const { data: orderCreateData } = await axios.post('/api/order/create', orderPayload, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (orderCreateData.success) {
        // Send notifications
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
            orderId: orderCreateData.orderId || `ORD-${Date.now()}`,
            address: selectedAddress,
            items: productsDetails,
            currency,
            subtotal,
            discount,
            deliveryFee,
            total,
            promoCode: appliedPromo ? appliedPromo.code : null,
            paymentMethod: selectedPaymentMethod
          });
        } catch (notificationError) {
          console.error("Failed to send notifications:", notificationError);
        }

        // Success cleanup
        toast.success(orderCreateData.message || "Order placed successfully!");
        setCartItems({});
        resetTransactionProof();
        setBakongMD5(null);
        setBakongQRData(null);
        router.push('/order-placed');
      } else {
        toast.error(orderCreateData.message || "Failed to place order");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle payment method change
  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    if (method !== "ABA") {
      resetTransactionProof();
    }
  };

  // Effects
  useEffect(() => {
    if (user) fetchUserAddresses();
  }, [user]);
  
  // Calculate amounts
  const {
    subtotal,
    discount: calculatedDiscountValue,
    deliveryFee: fee,
    total: totalAmount
  } = calculateOrderAmounts();

  // Render component
  return (
    <>
      {/* Bakong QR Code Modal */}
      {isBakongModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 text-center w-11/12 max-w-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Scan to Pay with Bakong</h3>
            <p className="text-gray-600 mb-4">
              Total Amount: <span className="font-bold text-blue-600">{currency}{totalAmount.toFixed(2)}</span>
            </p>
            <div className="p-4 border border-gray-200 rounded-lg inline-block">
              {bakongQRData ? <QRCodeCanvas value={bakongQRData} size={200} /> : <div className="h-[200px] w-[200px] flex items-center justify-center"><FaSpinner className="animate-spin h-12 w-12 text-gray-400" /></div>}
            </div>
            {isWaitingForPayment && (
              <div className="mt-4 flex items-center justify-center text-blue-600">
                <FaSpinner className="animate-spin mr-2" />
                <span>Waiting for payment...</span>
              </div>
            )}
            <button
              onClick={() => { setIsBakongModalOpen(false); stopPolling(); }}
              className="mt-6 w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      <div className="w-full md:w-96 border border-gray-200 bg-gray-50 shadow-sm p-6 sticky top-24 h-fit">
        <h2 className="text-xl text-gray-800 mb-6 uppercase font-medium">
          Order Summary
        </h2>

        {/* Delivery Address Section */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <FaMapMarkerAlt className="text-gray-500 mr-2" />
            <h3 className="text-sm font-medium uppercase text-gray-700">
              Delivery Address
            </h3>
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
                  : "Select delivery address"
                }
              </span>
              {isDropdownOpen ? (
                <FaChevronUp className="ml-2 text-gray-500" />
              ) : (
                <FaChevronDown className="ml-2 text-gray-500" />
              )}
            </button>

            {isDropdownOpen && (
              <ul
                className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto z-10"
                role="listbox"
              >
                {userAddresses.length > 0 ? (
                  userAddresses.map((address, index) => (
                    <li
                      key={index}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 border-gray-100"
                      onClick={() => handleAddressSelect(address)}
                      role="option"
                      aria-selected={selectedAddress?._id === address._id}
                    >
                      <p className="font-medium text-gray-800">{address.fullName}</p>
                      <p className="text-gray-600 text-sm mt-1">
                        {address.area}, {address.state}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-gray-500 italic">
                    No addresses found
                  </li>
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
                  <h3 className="text-sm font-medium uppercase text-gray-700">
                    Apply Promo Code
                  </h3>
                </div>
                {promoExpanded ? (
                  <FaChevronUp className="text-gray-500" />
                ) : (
                  <FaChevronDown className="text-gray-500" />
                )}
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
                      ) : (
                        "Apply"
                      )}
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
                  <p className="text-sm font-medium text-gray-800">
                    {appliedPromo.code}
                  </p>
                  <p className="text-xs text-gray-600">
                    {appliedPromo.discountType === 'percentage'
                      ? `${appliedPromo.discountValue}% off${appliedPromo.maxDiscountAmount
                        ? ` (up to ${currency}${appliedPromo.maxDiscountAmount})`
                        : ''
                      }`
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
            <p className="text-xs text-gray-600 mb-1">
              Please transfer to the following ABA account and upload a screenshot of your transaction.
            </p>
            
            {/* MODIFIED SECTION for ABA Account and Name */}
            <div className="bg-gray-50 p-3 rounded mb-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Name: <span className="font-semibold text-blue-600">SAY SAKSOPHANNA</span>
                </p>
                <button
                  onClick={() => handleCopyText("SAY SAKSOPHANNA", "Account Name Copied!")}
                  className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                  aria-label="Copy Account Name"
                  title="Copy Account Name"
                  type="button"
                >
                  <FaCopy size={14} />
                </button>
              </div>
               <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Account Number: <span className="font-semibold text-blue-600">001 223 344</span>
                </p>
                <button
                  onClick={() => handleCopyText("001 223 344", "ABA Account Number Copied!")}
                  className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                  aria-label="Copy ABA Account Number"
                  title="Copy ABA Account Number"
                  type="button"
                >
                  <FaCopy size={14} />
                </button>
              </div>
            </div>

            <label
              htmlFor="transaction-proof-upload"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Upload Transaction <span className="text-red-500">*</span>
            </label>
            
            <input
              type="file"
              id="transaction-proof-upload"
              ref={fileInputRef}
              onChange={handleTransactionProofChange}
              accept="image/png, image/jpeg, image/gif"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              disabled={uploadingProof}
            />

            {transactionProofPreview && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <img
                  src={transactionProofPreview}
                  alt="Transaction proof preview"
                  className="max-h-32 rounded-md border border-gray-200"
                />
              </div>
            )}

            {uploadingProof && (
              <div className="flex items-center text-sm text-blue-600 mt-2">
                <FaSpinner className="animate-spin mr-2" />
                <span>Uploading proof...</span>
              </div>
            )}

            {transactionProofUrl && !uploadingProof && (
              <div className="flex items-center text-sm text-green-600 mt-2">
                <FaCheck className="mr-2" />
                <span>Proof uploaded successfully!</span>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1">
              Max file size: 2MB. Allowed types: JPG, PNG, GIF.
            </p>
          </div>
        )}
        </div>

        {/* Order Summary Details */}
        <div className="space-y-3 border-t border-b border-gray-200 py-5 mb-6">
          <div className="flex justify-between text-gray-600">
            <p>Subtotal ({getCartCount()} items)</p>
            <p className="font-medium">{currency}{subtotal.toFixed(2)}</p>
          </div>

          {appliedPromo && calculatedDiscountValue > 0 && (
            <div className="flex justify-between text-gray-600">
              <p className="flex items-center">
                <FaTag className="text-green-600 mr-1 text-xs" />
                Discount
              </p>
              <p className="font-medium text-green-600">
                -{currency}{calculatedDiscountValue.toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex justify-between text-gray-600">
            <p>Delivery Fee</p>
            {isFreeDelivery ? (
              <p className="font-medium">
                <span className="line-through text-gray-400 mr-2">
                  {currency}1.50
                </span>
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
          onClick={selectedPaymentMethod === 'BAKONG' ? handlePayWithBakong : createOrder}
          disabled={loading || uploadingProof || isGeneratingQR || isWaitingForPayment || (selectedPaymentMethod === "ABA" && !transactionProofUrl)}
          className={`w-full py-3 rounded-md flex items-center justify-center font-medium ${loading || uploadingProof || isGeneratingQR || isWaitingForPayment || (selectedPaymentMethod === "ABA" && !transactionProofUrl) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"}`}
        >
          {loading ? <><FaSpinner className="animate-spin mr-3" /> Processing...</> :
            isGeneratingQR ? <><FaSpinner className="animate-spin mr-3" /> Generating QR...</> :
              isWaitingForPayment ? <><FaSpinner className="animate-spin mr-3" /> Awaiting Payment...</> :
                selectedPaymentMethod === "BAKONG" ? "Pay with Bakong" : "Place Order"
          }
        </button>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <FaLock className="mr-1" />
            Secure checkout
          </p>
        </div>
      </div>
    </>
  );
};

export default OrderSummary;