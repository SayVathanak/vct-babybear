'use client';

import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { sendTelegramNotification } from "@/utils/telegram-config";
import { BsQrCodeScan } from "react-icons/bs";
import { MdDeliveryDining } from "react-icons/md";
import { BiTransfer } from "react-icons/bi";
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

// This library will render the QR code string into a visible image
import QRCode from "qrcode";

// A new modal component to display the Bakong QR Code with payment status
const BakongQRModal = ({ show, onClose, qrString, deeplink, isAwaitingPayment, isPlacingOrder }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (show && qrString && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrString, { width: 256, margin: 2 }, (error) => {
        if (error) console.error("Failed to generate QR code canvas:", error);
      });
    }
  }, [show, qrString]);

  const handleSaveImage = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'bakong-payment-qr.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center shadow-2xl transform transition-all duration-300 scale-100">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">Scan to Pay with Bakong</h3>

        <div className="flex justify-center my-4 p-2 bg-gray-100 rounded-lg">
          <canvas ref={canvasRef}></canvas>
        </div>

        <div className="min-h-[80px] flex flex-col justify-center items-center">
          {isPlacingOrder ? (
            <>
              <FaCheck className="text-green-500 h-8 w-8 mb-2" />
              <p className="text-green-600 text-sm font-medium">Payment Received!</p>
              <p className="mt-1 text-xs text-gray-500">Finalizing your order...</p>
            </>
          ) : isAwaitingPayment ? (
            <>
              <FaSpinner className="animate-spin text-blue-500 h-8 w-8 mb-2" />
              <p className="text-blue-600 text-sm font-medium">Waiting for payment...</p>
              <p className="mt-1 text-xs text-gray-500">Do not close this window.</p>
            </>
          ) : (
            <p className="text-sm text-gray-500 mb-4">Use your bank's mobile app to scan the code to complete the payment.</p>
          )}
        </div>

        <div className="space-y-3 mt-4">
          {deeplink && (
            <a
              href={deeplink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition-colors text-sm font-bold flex items-center justify-center disabled:opacity-50"
              disabled={isPlacingOrder}
            >
              Pay with Bakong App
            </a>
          )}
          <button
            onClick={handleSaveImage}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-blue-300"
            disabled={isPlacingOrder}
          >
            Save QR Image
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium disabled:bg-gray-400"
            disabled={isPlacingOrder}
          >
            Cancel Payment
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderSummary = () => {
  const { currency, router, getCartCount, getCartAmount, getToken, user, cartItems, setCartItems, products } = useAppContext();

  // State Management
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

  // ABA Payment State
  const [transactionProofFile, setTransactionProofFile] = useState(null);
  const [transactionProofPreview, setTransactionProofPreview] = useState(null);
  const [transactionProofUrl, setTransactionProofUrl] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // ABA KHQR State
  const [abaKhqrData, setAbaKhqrData] = useState(null);
  const [loadingKhqr, setLoadingKhqr] = useState(false);

  // Bakong Payment State
  const [showBakongModal, setShowBakongModal] = useState(false);
  const [bakongQrString, setBakongQrString] = useState("");
  const [bakongDeeplink, setBakongDeeplink] = useState(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Refs for managing asynchronous operations and inputs
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const bakongDetailsRef = useRef(null);

  // Cleanup effect for the payment polling interval
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fetch user addresses on component mount
  useEffect(() => {
    if (user) fetchUserAddresses();
  }, [user]);

  // Fetch ABA KHQR data when ABA payment is selected
  useEffect(() => {
    if (selectedPaymentMethod === "ABA") {
      fetchABAKhqrData();
    }
  }, [selectedPaymentMethod]);

  // Constants
  const isFreeDelivery = getCartCount() > 1;
  const deliveryFee = isFreeDelivery ? 0 : 1.5;

  // --- DATA FETCHING & CALCULATIONS ---

  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/get-address', { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) setSelectedAddress(data.addresses[0]);
      }
    } catch (error) { toast.error("Failed to fetch addresses"); }
  };

  const fetchABAKhqrData = async () => {
    try {
      setLoadingKhqr(true);
      const { data } = await axios.get('/api/settings/aba-khqr');
      if (data.success) {
        setAbaKhqrData({
          khqr: data.khqr,
          bankDetails: data.bankDetails
        });
      }
    } catch (error) {
      console.error("Failed to fetch ABA KHQR data:", error);
      // Don't show error toast as this might be expected if no KHQR is uploaded
    } finally {
      setLoadingKhqr(false);
    }
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

  // --- UI HANDLERS ---

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const handleCopyText = async (textToCopy, message) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(message || `Copied: ${textToCopy}`);
    } catch (err) { toast.error('Failed to copy.'); }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) { setPromoError("Please enter a promo code"); return; }
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
        toast.success(data.message || "Promo code applied!");
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

  // --- PAYMENT METHOD LOGIC ---

  const resetTransactionProof = () => {
    setTransactionProofFile(null);
    setTransactionProofPreview(null);
    setTransactionProofUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTransactionProofChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("File size must be less than 2MB."); return; }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) { toast.error("Only JPG, PNG, or GIF images are allowed."); return; }
    setTransactionProofFile(file);
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
      const { data } = await axios.post('/api/upload/transaction-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
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

  const pollPaymentStatus = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      const md5 = bakongDetailsRef.current?.md5;
      if (!md5) return;
      try {
        const { data } = await axios.post('/api/bakong/check-payment-status', { 
          md5_hash: md5 
        });
        
        if (data.success && data.is_paid) {
          clearInterval(pollIntervalRef.current);
          setIsAwaitingPayment(false);
          setIsPlacingOrder(true);
          toast.success("Payment received! Placing your order...");
          await createOrder(true);
        }
      } catch (error) {
        console.error("Payment poll failed:", error);
      }
    }, 5000);
  };

  const handleGenerateBakongQR = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address first.");
      return;
    }
    setIsGeneratingQR(true);
    try {
      const { total } = calculateOrderAmounts();
      const billNumber = `ORD-${Date.now()}`;
      
      const { data } = await axios.post('/api/bakong/generate-qr', {
        amount: total,
        bill_number: billNumber,
        generate_deeplink: true,
      });

      if (data.success && data.qr_string && data.md5_hash) {
        setBakongQrString(data.qr_string);
        setBakongDeeplink(data.deeplink);
        bakongDetailsRef.current = {
          md5: data.md5_hash,
          qrString: data.qr_string,
          deeplink: data.deeplink,
        };
        setShowBakongModal(true);
        setIsAwaitingPayment(true);
        pollPaymentStatus();
      } else {
        throw new Error("Invalid response from QR service.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not generate Bakong QR.");
      resetBakongState();
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const resetBakongState = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setShowBakongModal(false);
    setBakongQrString("");
    setBakongDeeplink(null);
    setIsAwaitingPayment(false);
    setIsPlacingOrder(false);
    bakongDetailsRef.current = null;
  };

  const resetAllPaymentStates = () => {
    resetTransactionProof();
    resetBakongState();
  };

  const handlePaymentMethodChange = (method) => {
    resetAllPaymentStates();
    setSelectedPaymentMethod(method);
  };

  // --- ORDER CREATION & VALIDATION ---

  const validateOrderForm = () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return false;
    }

    if (getCartCount() <= 0) {
      toast.error('Your cart is empty');
      return false;
    }

    const stockIssues = [];
    Object.keys(cartItems).forEach((productId) => {
      const product = products.find(p => p._id === productId);
      const requestedQuantity = cartItems[productId];

      if (product) {
        if (!product.isAvailable) {
          stockIssues.push(`${product.name} is currently unavailable`);
        } else if (product.stock < requestedQuantity) {
          stockIssues.push(`${product.name} only has ${product.stock} items in stock (you requested ${requestedQuantity})`);
        }
      }
    });

    if (stockIssues.length > 0) {
      toast.error(`Stock issues: ${stockIssues.join(', ')}`);
      return false;
    }

    if (selectedPaymentMethod === "ABA" && !transactionProofUrl) {
      toast.error("Please upload transaction proof for ABA payment.");
      return false;
    }

    return true;
  };

  const createOrder = async (isBakongAutoTrigger = false) => {
    if (!isBakongAutoTrigger && !validateOrderForm()) return;
    setLoading(true);
    try {
      let cartItemsArray = Object.keys(cartItems).map((key) => ({ product: key, quantity: cartItems[key] })).filter(item => item.quantity > 0);
      const authToken = await getToken();
      const { subtotal, discount, deliveryFee, total } = calculateOrderAmounts();
      const orderPayload = {
        address: selectedAddress._id,
        items: cartItemsArray,
        subtotal, deliveryFee, discount, amount: total,
        paymentMethod: selectedPaymentMethod,
        ...(selectedPaymentMethod === "ABA" && { paymentTransactionImage: transactionProofUrl }),
        ...(selectedPaymentMethod === "Bakong" && { bakongPaymentDetails: bakongDetailsRef.current }),
        ...(appliedPromo && {
          promoCodeId: appliedPromo._id,
          promoCode: { id: appliedPromo._id, code: appliedPromo.code, discountType: appliedPromo.discountType, discountValue: appliedPromo.discountValue, discountAmount: discount }
        }),
      };
      const { data: orderCreateData } = await axios.post('/api/order/create', orderPayload, { headers: { Authorization: `Bearer ${authToken}` } });
      if (orderCreateData.success) {
        toast.success("Order placed successfully!");
        setCartItems({});
        resetAllPaymentStates();
        router.push('/order-placed');
      } else {
        toast.error(orderCreateData.message || "Failed to place order");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
      setIsPlacingOrder(false);
    }
  };

  // --- RENDER ABA PAYMENT SECTION ---
  const renderABAPaymentSection = () => {
    if (loadingKhqr) {
      return (
        <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white">
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin mr-2" />
            <span className="text-gray-600">Loading payment details...</span>
          </div>
        </div>
      );
    }

    // Check if we have KHQR data and it's active
    const hasActiveKhqr = abaKhqrData?.khqr && abaKhqrData?.bankDetails?.isActive;

    if (hasActiveKhqr) {
      return (
        <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white">
          <p className="text-xs text-gray-600 mb-3">Scan the QR code below with your ABA mobile app to complete payment, or transfer manually to the account details.</p>
          
          {/* KHQR Image Display */}
          <div className="flex justify-center mb-4">
            <div className="bg-white p-2 border rounded-lg shadow-sm">
              <img 
                src={abaKhqrData.khqr.url} 
                alt="ABA Bank KHQR" 
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>

          {/* Bank Account Details as Fallback */}
          <div className="bg-gray-50 p-3 rounded mb-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm">Account: <span className="font-semibold text-blue-600">{abaKhqrData.bankDetails.accountNumber}</span></p>
              <button onClick={() => handleCopyText(abaKhqrData.bankDetails.accountNumber, "Account Copied!")} className="p-1 text-blue-500 hover:text-blue-700">
                <FaCopy size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Name: <span className="font-semibold text-blue-600">{abaKhqrData.bankDetails.accountName}</span></p>
              <button onClick={() => handleCopyText(abaKhqrData.bankDetails.accountName, "Name Copied!")} className="p-1 text-blue-500 hover:text-blue-700">
                <FaCopy size={14} />
              </button>
            </div>
          </div>

          {/* Transaction Proof Upload */}
          <label htmlFor="transaction-proof-upload" className="block text-sm font-medium text-gray-700 mb-1">
            Upload Transaction Screenshot <span className="text-red-500">*</span>
          </label>
          <input 
            type="file" 
            id="transaction-proof-upload" 
            ref={fileInputRef} 
            onChange={handleTransactionProofChange} 
            accept="image/png, image/jpeg, image/gif" 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" 
            disabled={uploadingProof} 
          />
          
          {transactionProofPreview && (
            <div className="mt-3">
              <img src={transactionProofPreview} alt="Preview" className="max-h-32 rounded-md border" />
            </div>
          )}
          
          {uploadingProof && (
            <div className="flex items-center text-sm text-blue-600 mt-2">
              <FaSpinner className="animate-spin mr-2" />
              <span>Uploading...</span>
            </div>
          )}
          
          {transactionProofUrl && !uploadingProof && (
            <div className="flex items-center text-sm text-green-600 mt-2">
              <FaCheck className="mr-2" />
              <span>Screenshot uploaded successfully!</span>
            </div>
          )}
        </div>
      );
    }

    // Fallback to manual bank transfer if no KHQR or inactive
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white">
        <p className="text-xs text-gray-600 mb-1">Please transfer to the following ABA account and upload a screenshot of your transaction.</p>
        <div className="bg-gray-50 p-3 rounded mb-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm">Account: <span className="font-semibold text-blue-600">001 223 344</span></p>
            <button onClick={() => handleCopyText("001 223 344", "Account Copied!")} className="p-1 text-blue-500 hover:text-blue-700">
              <FaCopy size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">Name: <span className="font-semibold text-blue-600">SAY SAKSOPHANNA</span></p>
            <button onClick={() => handleCopyText("SAY SAKSOPHANNA", "Name Copied!")} className="p-1 text-blue-500 hover:text-blue-700">
              <FaCopy size={14} />
            </button>
          </div>
        </div>
        
        <label htmlFor="transaction-proof-upload" className="block text-sm font-medium text-gray-700 mb-1">
          Upload Transaction <span className="text-red-500">*</span>
        </label>
        <input 
          type="file" 
          id="transaction-proof-upload" 
          ref={fileInputRef} 
          onChange={handleTransactionProofChange} 
          accept="image/png, image/jpeg, image/gif" 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" 
          disabled={uploadingProof} 
        />
        
        {transactionProofPreview && (
          <div className="mt-3">
            <img src={transactionProofPreview} alt="Preview" className="max-h-32 rounded-md border" />
          </div>
        )}
        
        {uploadingProof && (
          <div className="flex items-center text-sm text-blue-600 mt-2">
            <FaSpinner className="animate-spin mr-2" />
            <span>Uploading...</span>
          </div>
        )}
        
        {transactionProofUrl && !uploadingProof && (
          <div className="flex items-center text-sm text-green-600 mt-2">
            <FaCheck className="mr-2" />
            <span>Uploaded!</span>
          </div>
        )}
      </div>
    );
  };

  // --- RENDER ---
  const { subtotal, discount: calculatedDiscountValue, deliveryFee: fee, total: totalAmount } = calculateOrderAmounts();

  return (
    <>
      <BakongQRModal
        show={showBakongModal}
        onClose={resetBakongState}
        qrString={bakongQrString}
        deeplink={bakongDeeplink}
        isAwaitingPayment={isAwaitingPayment}
        isPlacingOrder={isPlacingOrder} />
      <div className="w-full md:w-96 border border-gray-200 bg-gray-50 shadow-sm p-6 sticky top-24 h-fit">
        <h2 className="text-xl text-gray-800 mb-6 uppercase font-medium">Order Summary</h2>

        {/* Address Section */}
        <div className="mb-6">
          <div className="flex items-center mb-3"><FaMapMarkerAlt className="text-gray-500 mr-2" /><h3 className="text-sm font-medium uppercase text-gray-700">Delivery Address</h3></div>
          <div className="relative w-full text-sm">
            <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 transition-colors rounded-md" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <span className="text-gray-700 truncate flex-1 text-left font-kantumruy">{selectedAddress ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.state}` : "Select delivery address"}</span>
              {isDropdownOpen ? <FaChevronUp className="ml-2 text-gray-500" /> : <FaChevronDown className="ml-2 text-gray-500" />}
            </button>
            {isDropdownOpen && (
              <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto z-10">
                {userAddresses.length > 0 ? userAddresses.map((address, index) => (<li key={index} className="px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => handleAddressSelect(address)}><p className="font-medium text-gray-800">{address.fullName}</p><p className="text-gray-600 text-sm mt-1">{address.area}, {address.state}</p></li>)) : <li className="px-4 py-3 text-gray-500 italic">No addresses found</li>}
                <li onClick={() => router.push("/add-address")} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center text-blue-600 font-medium">+ Add New Address</li>
              </ul>
            )}
          </div>
        </div>

        {/* Promo Code Section */}
        <div className="mb-6">
          {!appliedPromo ? (
            <>
              <button className="flex items-center justify-between w-full" onClick={() => setPromoExpanded(!promoExpanded)}>
                <div className="flex items-center"><FaTag className="text-gray-500 mr-2" /><h3 className="text-sm font-medium uppercase text-gray-700">Apply Promo Code</h3></div>
                {promoExpanded ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </button>
              {promoExpanded && (
                <div className="mt-3">
                  <div className="flex">
                    <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter promo code" className="flex-grow outline-none p-3 text-gray-700 border border-gray-200 rounded-l-md focus:border-blue-500" />
                    <button className="bg-black text-white px-4 py-3 rounded-r-md hover:bg-gray-800 disabled:bg-gray-300" onClick={applyPromoCode} disabled={applyingPromo || !promoCode.trim()}>
                      {applyingPromo ? <FaSpinner className="animate-spin h-5 w-5" /> : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between bg-green-50 p-3 border border-green-200 rounded-md">
              <div className="flex items-center"><FaTag className="text-green-600 mr-2" /><div><p className="text-sm font-medium">{appliedPromo.code}</p><p className="text-xs text-gray-600">{appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}% off` : `${currency}${appliedPromo.discountValue} off`}</p></div></div>
              <button className="text-gray-500 hover:text-red-500" onClick={removePromoCode}><FaTimes /></button>
            </div>
          )}
        </div>

        {/* Payment Method Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium uppercase text-gray-700 mb-3">Payment Method</h3>
          <div className="space-y-3">
            <label className={`flex items-center p-3 border rounded-md cursor-pointer ${selectedPaymentMethod === "COD" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200"}`}>
              <input type="radio" name="paymentMethod" value="COD" checked={selectedPaymentMethod === "COD"} onChange={() => handlePaymentMethodChange("COD")} className="sr-only" />
              <MdDeliveryDining className={`mr-3 h-6 w-6 ${selectedPaymentMethod === "COD" ? "text-blue-600" : "text-gray-400"}`} /><span>Cash on Delivery</span>
            </label>
            <label className={`flex items-center p-3 border rounded-md cursor-pointer ${selectedPaymentMethod === "ABA" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200"}`}>
              <input type="radio" name="paymentMethod" value="ABA" checked={selectedPaymentMethod === "ABA"} onChange={() => handlePaymentMethodChange("ABA")} className="sr-only" />
              <FaCreditCard className={`mr-3 h-5 w-5 ${selectedPaymentMethod === "ABA" ? "text-blue-600" : "text-gray-400"}`} /><span>ABA Bank Transfer</span>
            </label>
            <label className={`flex items-center p-3 border rounded-md cursor-pointer ${selectedPaymentMethod === "Bakong" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200"}`}>
              <input type="radio" name="paymentMethod" value="Bakong" checked={selectedPaymentMethod === "Bakong"} onChange={() => handlePaymentMethodChange("Bakong")} className="sr-only" />
              <BsQrCodeScan className={`mr-3 h-4 w-4 ${selectedPaymentMethod === "Bakong" ? "text-blue-600" : "text-gray-400"}`} /><span>Bakong KHQR</span>
            </label>
          </div>
          
          {/* Render ABA Payment Section */}
          {selectedPaymentMethod === 'ABA' && renderABAPaymentSection()}
        </div>

        {/* Order Summary Details Section */}
        <div className="space-y-3 border-t border-b py-5 mb-6">
          <div className="flex justify-between text-gray-600"><p>Subtotal ({getCartCount()} items)</p><p className="font-medium">{currency}{subtotal.toFixed(2)}</p></div>
          {appliedPromo && <div className="flex justify-between text-green-600"><p>Discount</p><p>-{currency}{calculatedDiscountValue.toFixed(2)}</p></div>}
          <div className="flex justify-between text-gray-600"><p>Delivery Fee</p><p className="font-medium">{isFreeDelivery ? <span className="text-green-600">Free</span> : `${currency}${fee.toFixed(2)}`}</p></div>
          <div className="flex justify-between text-lg font-medium border-t pt-3 mt-3"><p>Total</p><p>{currency}{totalAmount.toFixed(2)}</p></div>
        </div>

        {/* ACTION BUTTONS AREA */}
        <div className="mt-6">
          {selectedPaymentMethod === 'Bakong' ? (
            <button
              onClick={handleGenerateBakongQR}
              disabled={isGeneratingQR || isAwaitingPayment || isPlacingOrder}
              className="w-full py-3 rounded-md flex items-center justify-center transition-all duration-300 text-base font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-wait"
            >
              {isAwaitingPayment || isPlacingOrder ? (<><FaSpinner className="animate-spin mr-3 h-5 w-5" /> Waiting for Payment...</>) : isGeneratingQR ? (<><FaSpinner className="animate-spin mr-3 h-5 w-5" /> Generating QR...</>) : ("Generate Bakong KHQR to Pay")}
            </button>
          ) : (
            <button
              onClick={() => createOrder(false)}
              disabled={loading || uploadingProof}
              className={`w-full py-3 rounded-md flex items-center justify-center transition-all duration-300 text-base font-medium ${loading || uploadingProof ? "bg-gray-300 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"
                }`}
            >
              {loading ? (<><FaSpinner className="animate-spin mr-3 h-5 w-5" /> Processing...</>) : ("Place Order")}
            </button>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center"><FaLock className="mr-1" /> Secure checkout</p>
        </div>
      </div>
    </>
  );
};

export default OrderSummary;