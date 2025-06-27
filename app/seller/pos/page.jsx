'use client'
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import Loading from '@/components/Loading';
import { FaSearch, FaShoppingCart, FaTrash, FaPlus, FaMinus, FaTimesCircle, FaCheckCircle, FaBarcode, FaTimes, FaSpinner, FaQuestionCircle } from 'react-icons/fa';
import { CiBarcode } from "react-icons/ci";
import { Transition } from '@headlessui/react';
import BarcodeScanner from '@/components/BarcodeScanner';
import Receipt from '@/components/Receipt';

const POS = () => {
  // App context and general states
  const { getToken, user, currency } = useAppContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [completedOrderDetails, setCompletedOrderDetails] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- State to manage the barcode scanner ---
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [scannerKey, setScannerKey] = useState(0); // Key to force remount scanner for a clean state

  // --- State for sale confirmation modal ---
  const [showSaleConfirmation, setShowSaleConfirmation] = useState(false);

  // Fetch seller's products on component mount
  useEffect(() => {
    const fetchSellerProduct = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const token = await getToken();
        const { data } = await axios.get('/api/product/seller-list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          setProducts(data.products.filter(p => p.isAvailable));
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchSellerProduct();
  }, [user, getToken]);

  // --- Callback function passed to the BarcodeScanner component ---
  // This function decides what to do with the scanned barcode text.
  const handleBarcodeDetected = async (barcodeText) => {
    console.log('Barcode detected:', barcodeText);
    setBarcodeLoading(true);

    try {
      const normalizedBarcode = barcodeText.trim();
      const localProduct = products.find(p => p.barcode === normalizedBarcode);

      if (localProduct) {
        addToCart(localProduct._id, true);
        toast.success(`Scanned: ${localProduct.name}`, { icon: <FaCheckCircle /> });
        setBarcodeLoading(false);
        // The scanner will close itself via its internal logic
        return;
      }

      // If not found locally, search via API
      const token = await getToken();
      const { data } = await axios.get(`/api/product/barcode-search?barcode=${encodeURIComponent(normalizedBarcode)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success && data.product && products.some(p => p._id === data.product._id)) {
        addToCart(data.product._id, true);
        toast.success(`Scanned: ${data.product.name}`, { icon: <FaCheckCircle /> });
      } else {
        toast.error(data?.message || 'Product not found in your inventory.');
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      const errorMessage = error.response?.data?.message || `Product not found for barcode: ${barcodeText.trim()}`;
      toast.error(errorMessage);
    } finally {
      setBarcodeLoading(false);
    }
  };

  // --- Function to close the scanner modal ---
  const handleBarcodeScannerClose = () => {
    setShowBarcodeScanner(false);
    setBarcodeLoading(false);
    // Incrementing the key forces the BarcodeScanner to remount, ensuring a fresh state
    setScannerKey(prev => prev + 1);
  };

  // --- Function to open the scanner modal ---
  const handleOpenScanner = () => {
    if (!window.location.protocol.startsWith('https') && !window.location.hostname.includes('localhost')) {
      toast.error('Camera access requires a secure connection (HTTPS).');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera access is not supported on this device.');
      return;
    }
    setShowBarcodeScanner(true);
  };

  // --- Cart management functions (addToCart, updateQuantity, etc.) ---
  const addToCart = (productId, fromBarcodeScanner = false) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    setCartItems(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));

    if (!fromBarcodeScanner) {
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems((prev) => ({ ...prev, [productId]: newQuantity }));
    }
  };

  const removeFromCart = (productId) => {
    const product = products.find(p => p._id === productId);
    setCartItems((prev) => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
    toast.error(`Removed ${product?.name || 'item'} from cart`);
  };

  const clearCart = () => {
    if (Object.keys(cartItems).length === 0) return;
    setCartItems({});
    toast.error('Cart cleared');
  };

  // --- Memoized calculations for performance ---
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedSearchTerm) ||
      (product.barcode && product.barcode.includes(lowercasedSearchTerm))
    );
  }, [products, searchTerm]);

  const cartDetails = useMemo(() => {
    const items = Object.keys(cartItems).map(id => {
      const product = products.find(p => p._id === id);
      return product ? { ...product, quantity: cartItems[id] } : null;
    }).filter(Boolean);

    const subtotal = items.reduce((total, item) => total + item.offerPrice * item.quantity, 0);
    const totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
    return { items, subtotal, totalItems };
  }, [cartItems, products]);

  // --- Checkout Logic ---
  const handleShowSaleConfirmation = () => {
    if (cartDetails.items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setShowSaleConfirmation(true);
  };

  const handleCheckout = async () => {
    setShowSaleConfirmation(false);
    setProcessingOrder(true);
    try {
      const token = await getToken();
      const orderPayload = {
        items: cartDetails.items.map(item => ({ product: item._id, quantity: item.quantity })),
        amount: cartDetails.subtotal,
      };
      const { data } = await axios.post('/api/order/create-pos', orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setSaleCompleted(true);
        setCompletedOrderDetails(data.order);
        setCartItems({});
        setSearchTerm('');
        setIsCartOpen(false);
        toast.success('Sale completed successfully!');
      } else {
        toast.error(data.message || 'Failed to complete sale');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred during checkout');
    } finally {
      setProcessingOrder(false);
    }
  };

  const startNewSale = () => {
    setSaleCompleted(false);
    setCompletedOrderDetails(null);
  };


  // --- UI Components (SaleConfirmationModal, CartContents, etc.) ---
  // These remain unchanged as they are part of the POS UI, not the scanner itself.
  const SaleConfirmationModal = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <FaQuestionCircle className="text-blue-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Confirm Sale</h2>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-60 overflow-y-auto">
          {cartDetails.items.map(item => (
            <div key={item._id} className="flex justify-between items-center text-sm mb-2">
              <p className="font-medium text-gray-800 truncate">{item.name} (x{item.quantity})</p>
              <p className="font-semibold text-gray-800">{currency}{(item.offerPrice * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between items-center text-lg font-bold">
            <span className="text-gray-800">Total:</span>
            <span className="text-blue-600">{currency}{cartDetails.subtotal.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSaleConfirmation(false)} className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleCheckout} disabled={processingOrder} className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-400">
            {processingOrder ? <FaSpinner className="animate-spin mx-auto" /> : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );

  const CartContents = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {cartDetails.items.length > 0 ? (
          <div className="space-y-4">
            {cartDetails.items.map(item => (
              <div key={item._id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                <Image src={item.image[0]} alt={item.name} width={60} height={60} className="rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                  <p className="text-sm text-gray-500">{currency}{item.offerPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"><FaMinus size={12} /></button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"><FaPlus size={12} /></button>
                </div>
                <button onClick={() => removeFromCart(item._id)} className="text-gray-400 hover:text-red-500"><FaTimesCircle size={20} /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <FaShoppingCart className="text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Your cart is empty</h3>
          </div>
        )}
      </div>
      <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between text-2xl font-bold mb-4">
          <span>Total</span>
          <span>{currency}{cartDetails.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex gap-4">
          <button onClick={clearCart} disabled={cartDetails.items.length === 0} className="w-full bg-red-100 text-red-600 font-bold py-3.5 rounded-lg hover:bg-red-200 disabled:opacity-50">Clear</button>
          <button onClick={handleShowSaleConfirmation} disabled={cartDetails.items.length === 0} className="w-full bg-green-500 text-white font-bold py-3.5 rounded-lg hover:bg-green-600 disabled:bg-gray-400">Complete Sale</button>
        </div>
      </div>
    </>
  );

  // --- Main Render Logic ---
  if (loading) return <Loading />;
  if (saleCompleted && completedOrderDetails) {
    return (
      <Receipt
        order={completedOrderDetails}
        user={user}
        currency={currency}
        onClose={startNewSale}
        storeDetails={{
          name: "Baby Bear",
          address: "St 230, Toul Kork, Phnom Penh",
          phone: "078 223 444",
          logo: "/icons/logo.svg",
          website: "vct-babybear.vercel.app"
        }}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 md:h-screen md:overflow-hidden">
      {/* --- Render the Barcode Scanner conditionally --- */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full">
            <BarcodeScanner
              key={scannerKey}
              onBarcodeDetected={handleBarcodeDetected}
              onClose={handleBarcodeScannerClose}
              autoCloseOnScan={false}
            />
          </div>
        </div>
      )}

      {/* Sale Confirmation Modal */}
      {showSaleConfirmation && <SaleConfirmationModal />}

      {/* Mobile Cart (Transition) */}
      <Transition show={isCartOpen} as={React.Fragment}>
        <div className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-75 z-40">
          <Transition.Child
            as="div"
            enter="transition-transform duration-300 ease-out"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="transition-transform duration-300 ease-in"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
            className="bg-white w-full max-h-[90vh] rounded-t-2xl flex flex-col absolute bottom-0"
          >
            <header className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Cart ({cartDetails.totalItems})</h2>
              <button onClick={() => setIsCartOpen(false)}><FaTimes size={24} /></button>
            </header>
            <CartContents />
          </Transition.Child>
        </div>
      </Transition>

      {/* Main Product Area */}
      <main className="w-full md:w-3/5 lg:w-2/3 flex flex-col">
        <header className="p-4 bg-white border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleOpenScanner}
              disabled={barcodeLoading}
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {barcodeLoading ? <FaSpinner className="animate-spin" /> : <CiBarcode size={24} />}
              <span>Scan</span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <button key={product._id} onClick={() => addToCart(product._id)} className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg focus:ring-2 focus:ring-indigo-500">
                <Image src={product.image[0]} alt={product.name} width={150} height={150} className="object-contain mx-auto h-28" />
                <p className="font-semibold text-gray-800 text-sm mt-2 line-clamp-2 h-10">{product.name}</p>
                <p className="text-indigo-600 font-bold mt-1">{currency}{product.offerPrice.toFixed(2)}</p>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-500">
              <FaSearch className="text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold">No products found</h3>
            </div>
          )}
        </div>
      </main>

      {/* Desktop Cart Sidebar */}
      <aside className="hidden md:flex md:w-2/5 lg:w-1/3 bg-white border-l flex-col">
        <header className="p-6 border-b">
          <h2 className="text-xl font-bold">Cart ({cartDetails.totalItems})</h2>
        </header>
        <CartContents />
      </aside>

      {/* Mobile Cart Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <button onClick={() => setIsCartOpen(true)} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3">
          <FaShoppingCart />
          View Cart ({cartDetails.totalItems})
          {cartDetails.totalItems > 0 && <span className="font-normal"> - {currency}{cartDetails.subtotal.toFixed(2)}</span>}
        </button>
      </div>
    </div>
  );
};

export default POS;